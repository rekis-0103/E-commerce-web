package auth

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"
	"math/rand"
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

// 4. Login via Google (Membaca Data Asli dari Google + Alat Penyadap)
func GoogleLogin(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Token tidak valid"})
	}

	token_google, _, err := jwt.NewParser().ParseUnverified(req.Token, jwt.MapClaims{})
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Gagal membaca token Google"})
	}

	claims, ok := token_google.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(400).JSON(fiber.Map{"message": "Format token Google salah"})
	}

	realEmail := fmt.Sprintf("%v", claims["email"])
	realName := fmt.Sprintf("%v", claims["name"])

	// ---- ALAT PENYADAP ----
	fmt.Println("\n=====================================")
	fmt.Println("🚀 LOGIN GOOGLE TERDETEKSI!")
	fmt.Println("Nama  :", realName)
	fmt.Println("Email :", realEmail)

	var user models.User
	if err := config.DB.Where("email = ?", realEmail).First(&user).Error; err != nil {
		fmt.Println("Status: Email belum ada. Mencoba membuat akun baru...")
		
		// Perhatikan: Kita TIDAK mengirimkan OTP sama sekali ke database
		user = models.User{
			Email: realEmail,
			Name:  realName,
			Role:  "buyer",
		}
		
		if errCreate := config.DB.Create(&user).Error; errCreate != nil {
			fmt.Println("❌ GAGAL SIMPAN KE MYSQL:", errCreate)
		} else {
			fmt.Println("✅ AKUN BARU BERHASIL DISIMPAN KE DB!")
		}
	} else {
		fmt.Println("Status: Email sudah ada di DB. Langsung masuk!")
	}
	fmt.Println("=====================================\n")

	// Buat Token Lokal
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