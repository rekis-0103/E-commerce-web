package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

// 1. Meminta OTP saat mau Register
func RequestOTP(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format email tidak valid"})
	}

	// Pastikan email belum terdaftar
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Email sudah terdaftar! Silakan langsung Login."})
	}

	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	
	// Simpan di "Ruang Tunggu" OTP (Menggunakan OTPRegistry, BUKAN User)
	var registry models.OTPRegistry
	config.DB.Where("email = ?", req.Email).Assign(models.OTPRegistry{
		OTP:       otp,
		OTPExpiry: time.Now().Add(5 * time.Minute),
	}).FirstOrCreate(&registry)

	// Simulasi kirim Email ke Terminal
	fmt.Println("=========================================")
	fmt.Printf("📧 REGISTER OTP UNTUK: %s\n", req.Email)
	fmt.Printf("🔑 KODE OTP ANDA  : %s\n", otp)
	fmt.Println("=========================================")

	return c.JSON(fiber.Map{"message": "OTP berhasil dikirim ke email Anda!"})
}

// 2. Mendaftarkan Akun (Cek Password & OTP)
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

	// Cek keaslian OTP di ruang tunggu (OTPRegistry)
	var registry models.OTPRegistry
	if err := config.DB.Where("email = ?", req.Email).First(&registry).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Anda belum meminta kode OTP"})
	}

	if registry.OTP != req.OTP || time.Now().After(registry.OTPExpiry) {
		return c.Status(401).JSON(fiber.Map{"message": "Kode OTP salah atau kedaluwarsa"})
	}

	// OTP Valid! Buat Akunnya di tabel User (Tanpa kolom OTP)
	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password, 
		Role:     "buyer",
	}
	config.DB.Create(&user)

	// Hapus OTP dari ruang tunggu karena sudah terpakai
	config.DB.Delete(&registry)

	return c.JSON(fiber.Map{"message": "Pendaftaran berhasil! Silakan Login."})
}

// 3. Login Biasa (Email & Password)
func Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format tidak valid"})
	}

	var user models.User
	if err := config.DB.Where("email = ? AND password = ?", req.Email, req.Password).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "Email atau Password salah!"})
	}

	// Buat JWT
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = user.ID
	claims["role"] = user.Role
	claims["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, _ := token.SignedString([]byte("rahasia_negara_123"))

	return c.JSON(fiber.Map{
		"message": "Login berhasil!",
		"token":   t,
		"role":    user.Role,
	})
}

// 4. Login via Google (Membaca Data Asli dari Google + Alat Penyadap)
func GoogleLogin(c *fiber.Ctx) error {
	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Token tidak valid"})
	}

	token_google, _, err := new(jwt.Parser).ParseUnverified(req.Token, jwt.MapClaims{})
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
	claims_lokal["user_id"] = user.ID
	claims_lokal["role"] = user.Role
	claims_lokal["exp"] = time.Now().Add(time.Hour * 72).Unix()

	t, _ := token_lokal.SignedString([]byte("rahasia_negara_123"))

	pesanSapaan := fmt.Sprintf("Selamat datang kembali, %s!", user.Name)

	return c.JSON(fiber.Map{
		"message": pesanSapaan,
		"token":   t,
		"role":    user.Role,
	})
}