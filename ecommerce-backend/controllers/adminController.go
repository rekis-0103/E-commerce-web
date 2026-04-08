package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
)

// 1. Melihat semua toko yang masih pending
func GetPendingShops(c *fiber.Ctx) error {
	var shops []models.Shop
	config.DB.Where("status = ?", "pending").Find(&shops)
	
	return c.JSON(fiber.Map{
		"message": "Daftar pengajuan toko",
		"data":    shops,
	})
}

// 2. Menyetujui toko dan mengubah role Budi menjadi 'seller'
func ApproveShop(c *fiber.Ctx) error {
	shopID := c.Params("id") // Mengambil ID toko dari URL
	var shop models.Shop

	// Cari toko berdasarkan ID
	if err := config.DB.First(&shop, shopID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	// Ubah status toko menjadi approved & berikan title/badge (contoh: Toko Resmi)
	shop.Status = "approved"
	shop.Badge = "Resmi"
	config.DB.Save(&shop)

	// Cari user yang memiliki toko ini, lalu naikkan pangkatnya jadi penjual
	var user models.User
	config.DB.First(&user, shop.UserID)
	user.Role = "seller"
	config.DB.Save(&user)

	return c.JSON(fiber.Map{
		"message": "Toko berhasil disetujui! User sekarang adalah Penjual.",
		"shop":    shop,
	})
}