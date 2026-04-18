package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

var validProvinces = map[string]bool{
	"Aceh": true, "Sumatera Utara": true, "Sumatera Barat": true, "Riau": true, "Kepulauan Riau": true, "Jambi": true,
	"Sumatera Selatan": true, "Bangka Belitung": true, "Bengkulu": true, "Lampung": true, "DKI Jakarta": true,
	"Jawa Barat": true, "Banten": true, "Jawa Tengah": true, "DI Yogyakarta": true, "Jawa Timur": true,
	"Bali": true, "Nusa Tenggara Barat": true, "Nusa Tenggara Timur": true, "Kalimantan Barat": true,
	"Kalimantan Tengah": true, "Kalimantan Selatan": true, "Kalimantan Timur": true, "Kalimantan Utara": true,
	"Sulawesi Utara": true, "Sulawesi Tengah": true, "Sulawesi Selatan": true, "Sulawesi Tenggara": true,
	"Gorontalo": true, "Sulawesi Barat": true, "Maluku": true, "Maluku Utara": true, "Papua": true,
	"Papua Barat": true, "Papua Selatan": true, "Papua Tengah": true, "Papua Pegunungan": true, "Papua Barat Daya": true,
}

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

	// Validasi provinsi jika diisi
	if data["province"] != "" && !validProvinces[data["province"]] {
		return c.Status(400).JSON(fiber.Map{"message": "Provinsi tidak valid"})
	}

	// 4. Buat toko baru dengan status "pending"
	shop := models.Shop{
		UserID:      userID,
		ShopName:    data["shop_name"],
		Description: data["description"],
		Province:    data["province"],
		Address:     data["address"],
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

// Mendapatkan profil toko sendiri (untuk seller)
func GetShopProfile(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	return c.Status(200).JSON(fiber.Map{
		"data": shop,
	})
}

// Mengupdate profil toko (untuk seller)
func UpdateShopProfile(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	var data map[string]string
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	// Update fields if provided
	if name, ok := data["shop_name"]; ok && name != "" {
		shop.ShopName = name
	}
	if desc, ok := data["description"]; ok {
		shop.Description = desc
	}
	if prov, ok := data["province"]; ok {
		if prov != "" && !validProvinces[prov] {
			return c.Status(400).JSON(fiber.Map{"message": "Provinsi tidak valid"})
		}
		shop.Province = prov
	}
	if addr, ok := data["address"]; ok {
		shop.Address = addr
	}

	if err := config.DB.Save(&shop).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate toko"})
	}

	return c.Status(200).JSON(fiber.Map{
		"message": "Profil toko berhasil diupdate",
		"data":    shop,
	})
}