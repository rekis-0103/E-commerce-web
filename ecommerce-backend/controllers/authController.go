package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Fungsi Register
func Register(c *fiber.Ctx) error {
	var data map[string]string

	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	// Hash Password agar aman di database
	password, _ := bcrypt.GenerateFromPassword([]byte(data["password"]), 14)

	user := models.User{
		Name:     data["name"],
		Email:    data["email"],
		Password: string(password),
		Role:     "buyer", // Default selalu menjadi pembeli saat daftar
	}

	// Simpan ke database
	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Email mungkin sudah terdaftar"})
	}

	return c.Status(201).JSON(fiber.Map{"message": "Berhasil mendaftar!", "user": user})
}

// Fungsi Login
func Login(c *fiber.Ctx) error {
	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	var user models.User
	// Cari user berdasarkan email
	config.DB.Where("email = ?", data["email"]).First(&user)
	if user.ID == 0 {
		return c.Status(404).JSON(fiber.Map{"message": "Email tidak ditemukan"})
	}

	// Cek kecocokan password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(data["password"])); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Password salah"})
	}

	// Membuat Token JWT
	claims := jwt.MapClaims{
		"id":   user.ID,
		"role": user.Role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(), // Token berlaku 24 jam
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	t, err := token.SignedString([]byte(secret))
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat token"})
	}

	return c.JSON(fiber.Map{
		"message": "Berhasil login",
		"token":   t,
		"role":    user.Role,
	})
}