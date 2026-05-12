package auth

import (
	"crypto/rsa"
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func jwtSecret() string {
	// Backward-compatible default (so existing environments keep working),
	// but prefer JWT_SECRET from .env when present.
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return s
	}
	return "rahasia_negara_123"
}

// 1. Meminta OTP saat mau Register
func RequestOTP(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format email tidak valid"})
	}

	// Pastikan email belum terdaftar di tabel User utama
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Email sudah terdaftar! Silakan langsung Login."})
	}

	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	
	// ---- KODE YANG DIPERBAIKI MULAI DARI SINI ----
	
	// Simpan di "Ruang Tunggu" OTP (Menggunakan OTPRegistry)
	registry := models.OTPRegistry{
		Email:     req.Email, // Kita pastikan email disuntikkan secara eksplisit di sini
		OTP:       otp,
		OTPExpiry: time.Now().Add(5 * time.Minute),
	}

	// config.DB.Save() akan cerdas: 
	// Jika email belum ada -> Buat Baris Baru. Jika sudah ada -> Perbarui OTP-nya saja.
	if err := config.DB.Save(&registry).Error; err != nil {
		fmt.Println("❌ GAGAL SIMPAN OTP:", err)
		return c.Status(500).JSON(fiber.Map{"message": "Gangguan pada server saat menyimpan OTP."})
	}
	
	// ---- KODE YANG DIPERBAIKI SELESAI DI SINI ----

	// Simulasi kirim Email ke Terminal
	fmt.Println("=========================================")
	fmt.Printf("📧 REGISTER OTP UNTUK: %s\n", req.Email)
	fmt.Printf("🔑 KODE OTP ANDA  : %s\n", otp)
	fmt.Println("=========================================")

	return c.JSON(fiber.Map{"message": "OTP berhasil dikirim ke email Anda!"})
}

// 2. Mendaftarkan Akun (DENGAN HASH PASSWORD)
func Register(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		OTP      string `json:"otp"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak lengkap"})
	}

	// --- PERBAIKAN DI SINI ---
	// Kita harus deklarasikan variabel registry dulu agar bisa dipakai untuk mencari dan menghapus
	var registry models.OTPRegistry

	// Cek apakah OTP ada di database
	if err := config.DB.Where("email = ?", req.Email).First(&registry).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Anda belum meminta kode OTP"})
	}
	// --------------------------

	// Cek apakah OTP cocok dan belum expired
	if registry.OTP != req.OTP || time.Now().After(registry.OTPExpiry) {
		return c.Status(401).JSON(fiber.Map{"message": "Kode OTP salah atau kedaluwarsa"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal memproses password"})
	}

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "buyer",
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan user baru"})
	}

	// Sekarang variabel 'registry' sudah dikenal, jadi bisa dihapus dengan aman
	config.DB.Delete(&registry)

	return c.JSON(fiber.Map{"message": "Pendaftaran berhasil! Silakan Login."})
}

// 3. Login Biasa (MEMBANDINGKAN HASH)
func Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format tidak valid"})
	}

	var user models.User
	// Cari user berdasarkan email saja
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "Email tidak ditemukan!"})
	}

	// Bandingkan password inputan dengan Hash di database
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "Password salah!"})
	}

	// Jika cocok, buatkan JWT (kode sisanya tetap sama)
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	// Provide both keys for compatibility with older/newer middleware.
	claims["id"] = user.ID
	claims["user_id"] = user.ID
	claims["role"] = user.Role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token.SignedString([]byte(jwtSecret()))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat token"})
	}

	return c.JSON(fiber.Map{"message": "Login berhasil!", "token": t, "role": user.Role})
}

// Google JWKS response structure
type googleJWKS struct {
	Keys []googleJWK `json:"keys"`
}

type googleJWK struct {
	Kid string `json:"kid"`
	N   string `json:"n"` // RSA modulus (base64url)
	E   string `json:"e"` // RSA exponent (base64url)
}

// fetchGooglePublicKey mengambil RSA public key dari Google JWKS endpoint
// berdasarkan kid (key ID) dari header JWT Google.
func fetchGooglePublicKey(kid string) (*rsa.PublicKey, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v3/certs")
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil Google public keys: %w", err)
	}
	defer resp.Body.Close()

	var jwks googleJWKS
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("gagal decode Google JWKS: %w", err)
	}

	for _, key := range jwks.Keys {
		if key.Kid != kid {
			continue
		}

		// Decode modulus (n) dari base64url
		nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
		if err != nil {
			return nil, fmt.Errorf("gagal decode modulus: %w", err)
		}

		// Decode exponent (e) dari base64url
		eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
		if err != nil {
			return nil, fmt.Errorf("gagal decode exponent: %w", err)
		}

		// Konversi exponent bytes menjadi int
		exponent := 0
		for _, b := range eBytes {
			exponent = exponent<<8 | int(b)
		}

		pubKey := &rsa.PublicKey{
			N: new(big.Int).SetBytes(nBytes),
			E: exponent,
		}

		return pubKey, nil
	}

	return nil, fmt.Errorf("kunci publik dengan kid=%s tidak ditemukan di Google JWKS", kid)
}

// 4. Login via Google (VERIFIKASI SIGNATURE GOOGLE)
func GoogleLogin(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Token tidak valid"})
	}

	if req.Token == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Token wajib diisi"})
	}

	// 1. Parse header token untuk mendapatkan kid (key ID)
	parser := jwt.NewParser()
	parsedUnverified, _, err := parser.ParseUnverified(req.Token, jwt.MapClaims{})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Gagal membaca token Google"})
	}

	kid, ok := parsedUnverified.Header["kid"].(string)
	if !ok || kid == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Token Google tidak memiliki kid"})
	}

	// 2. Ambil public key Google yang sesuai dengan kid
	googlePubKey, err := fetchGooglePublicKey(kid)
	if err != nil {
		fmt.Println("Google pubkey error:", err)
		return c.Status(500).JSON(fiber.Map{"message": "Gagal memverifikasi token Google"})
	}

	// 3. Verifikasi signature token dengan public key Google
	token_google, err := jwt.Parse(req.Token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("metode signature tidak valid: %v", t.Header["alg"])
		}
		return googlePubKey, nil
	})
	if err != nil || !token_google.Valid {
		return c.Status(401).JSON(fiber.Map{"message": "Token Google tidak valid atau palsu"})
	}

	claims, ok := token_google.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(400).JSON(fiber.Map{"message": "Format klaim token Google salah"})
	}

	// 4. Validasi issuer (harus dari Google)
	iss, _ := claims["iss"].(string)
	if iss != "https://accounts.google.com" && iss != "accounts.google.com" {
		return c.Status(401).JSON(fiber.Map{"message": "Issuer token tidak valid"})
	}

	// 5. Validasi audience (harus cocok dengan Google Client ID kita)
	aud, _ := claims["aud"].(string)
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		return c.Status(500).JSON(fiber.Map{"message": "Google Client ID belum dikonfigurasi di server"})
	}
	if aud != googleClientID {
		fmt.Printf("GoogleLogin: aud mismatch — got %q, expected %q\n", aud, googleClientID)
		return c.Status(401).JSON(fiber.Map{"message": "Audience token tidak valid"})
	}

	// 6. Validasi expired (jwt.Parse sudah mengecek exp, tapi kita cek ulang untuk kepastian)
	exp, _ := claims["exp"].(float64)
	if exp == 0 || time.Now().After(time.Unix(int64(exp), 0)) {
		return c.Status(401).JSON(fiber.Map{"message": "Token Google sudah kedaluwarsa"})
	}

	// 7. Ambil data user dari klaim yang sudah TERVERIFIKASI
	realEmail := fmt.Sprintf("%v", claims["email"])
	realName := fmt.Sprintf("%v", claims["name"])

	if realEmail == "" || realEmail == "<nil>" {
		return c.Status(400).JSON(fiber.Map{"message": "Token Google tidak mengandung email"})
	}

	fmt.Println("\n=====================================")
	fmt.Println("🚀 LOGIN GOOGLE TERVERIFIKASI!")
	fmt.Println("Nama  :", realName)
	fmt.Println("Email :", realEmail)
	fmt.Printf("Iss   : %s | Aud : %s\n", iss, aud)

	var user models.User
	if errDB := config.DB.Where("email = ?", realEmail).First(&user).Error; errDB != nil {
		fmt.Println("Status: Email belum ada. Membuat akun baru...")

		user = models.User{
			Email: realEmail,
			Name:  realName,
			Role:  "buyer",
		}

		if errCreate := config.DB.Create(&user).Error; errCreate != nil {
			fmt.Println("❌ GAGAL SIMPAN KE MYSQL:", errCreate)
			return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat akun baru"})
		}
		fmt.Println("✅ AKUN BARU BERHASIL DISIMPAN KE DB!")
	} else {
		fmt.Println("Status: Email sudah ada di DB. Langsung masuk!")
	}
	fmt.Println("=====================================\n")

	// 8. Buat token lokal
	token_lokal := jwt.New(jwt.SigningMethodHS256)
	claims_lokal := token_lokal.Claims.(jwt.MapClaims)
	claims_lokal["id"] = user.ID
	claims_lokal["user_id"] = user.ID
	claims_lokal["role"] = user.Role
	claims_lokal["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, err := token_lokal.SignedString([]byte(jwtSecret()))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat token"})
	}

	pesanSapaan := fmt.Sprintf("Selamat datang kembali, %s!", user.Name)

	return c.JSON(fiber.Map{
		"message": pesanSapaan,
		"token":   t,
		"role":    user.Role,
	})
}