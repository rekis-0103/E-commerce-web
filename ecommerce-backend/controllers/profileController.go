package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// GetProfile - mengambil detail profil user yang sedang login
func GetProfile(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	// Kembalikan data profil tanpa password
	return c.JSON(fiber.Map{
		"message": "Profil berhasil diambil",
		"data": fiber.Map{
			"id":           user.ID,
			"name":         user.Name,
			"email":        user.Email,
			"role":         user.Role,
			"phone":        user.Phone,
			"address":      user.Address,
			"date_of_birth": user.DateOfBirth,
			"created_at":   user.CreatedAt,
		},
	})
}

// UpdateProfile - memperbarui profil user (nama, telepon, alamat, tanggal lahir, password)
// Email tidak bisa diganti
func UpdateProfile(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var req struct {
		Name        string `json:"name"`
		Phone       string `json:"phone"`
		Address     string `json:"address"`
		DateOfBirth string `json:"date_of_birth"`
		Password    string `json:"password,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	// Ambil data user saat ini dari database
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	// Perbarui field yang dikirim
	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.DateOfBirth != "" {
		user.DateOfBirth = req.DateOfBirth
	}

	// Jika user mengirim password baru, hash dan simpan
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"message": "Gagal memproses password"})
		}
		user.Password = string(hashedPassword)
	}

	// Simpan perubahan ke database
	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan perubahan profil"})
	}

	return c.JSON(fiber.Map{
		"message": "Profil berhasil diperbarui",
		"data": fiber.Map{
			"id":           user.ID,
			"name":         user.Name,
			"email":        user.Email,
			"role":         user.Role,
			"phone":        user.Phone,
			"address":      user.Address,
			"date_of_birth": user.DateOfBirth,
			"created_at":   user.CreatedAt,
		},
	})
}
