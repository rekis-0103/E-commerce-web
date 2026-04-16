package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"time"

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
		// Jika toko approved, tidak bisa daftar lagi
		if existingShop.Status == "approved" {
			return c.Status(400).JSON(fiber.Map{"message": "Anda sudah memiliki toko yang disetujui"})
		}
		// Jika pending, tidak bisa daftar lagi
		if existingShop.Status == "pending" {
			return c.Status(400).JSON(fiber.Map{"message": "Pengajuan toko Anda masih dalam proses review oleh Admin"})
		}
		// Jika rejected, cek cooldown 1 bulan
		if existingShop.Status == "rejected" && existingShop.LastRejectionDate != nil {
			oneMonthLater := existingShop.LastRejectionDate.AddDate(0, 1, 0)
			if time.Now().Before(oneMonthLater) {
				daysLeft := int(oneMonthLater.Sub(time.Now()).Hours() / 24)
				return c.Status(400).JSON(fiber.Map{
					"message": "Pengajuan toko Anda ditolak. Silakan coba lagi setelah 1 bulan.",
					"can_reapply_after_days": daysLeft,
					"can_reapply_at": oneMonthLater.Format("02 Jan 2006"),
				})
			}
			// Sudah lewat 1 bulan, bisa hapus shop lama dan buat baru
			config.DB.Delete(&existingShop)
		}
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