package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
)

// Daftar menjadi penjual (Membuat Toko)
func CreateShop(c *fiber.Ctx) error {
	// 1. Ambil User ID dari Token (disediakan oleh middleware "Satpam" kita)
	// Catatan: JWT menyimpan angka sebagai float64, jadi kita casting dulu
	userID := uint(c.Locals("user_id").(float64))

	// 2. Tangkap data input dari body request
	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	// 3. Cek apakah user sudah punya toko (1 user = 1 toko)
	var existingShop models.Shop
	config.DB.Where("user_id = ?", userID).First(&existingShop)
	if existingShop.ID != 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Anda sudah memiliki toko atau sedang dalam masa pengajuan"})
	}

	// 4. Buat toko baru dengan status "pending"
	shop := models.Shop{
		UserID:      userID,
		ShopName:    data["shop_name"],
		Description: data["description"],
		Status:      "pending", // Wajib di-approve admin nanti
	}

	if err := config.DB.Create(&shop).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengajukan pembuatan toko"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Pengajuan toko berhasil! Menunggu persetujuan Admin.",
		"shop":    shop,
	})
}