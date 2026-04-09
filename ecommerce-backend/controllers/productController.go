package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
)

// Menambah produk baru
func CreateProduct(c *fiber.Ctx) error {
	// 1. Ambil ID Penjual dari Token
	userID := uint(c.Locals("user_id").(float64))

	// 2. Cari ID Toko milik penjual tersebut
	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	// 3. Tangkap data produk dari Frontend
	var data models.Product
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Format data tidak valid"})
	}

	// 4. Masukkan ID Toko ke data produk, lalu simpan ke DB
	data.ShopID = shop.ID
	if err := config.DB.Create(&data).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan produk"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Produk berhasil ditambahkan!",
		"product": data,
	})
}

// Menampilkan produk khusus untuk toko si Penjual (untuk ditampilkan di Dashboard)
func GetMyShopProducts(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	config.DB.Where("user_id = ?", userID).First(&shop)

	var products []models.Product
	config.DB.Where("shop_id = ?", shop.ID).Find(&products)

	return c.JSON(fiber.Map{
		"data": products,
	})
}

// Menampilkan semua produk untuk Halaman Utama (Bisa diakses siapa saja)
func GetAllPublicProducts(c *fiber.Ctx) error {
	var products []models.Product
	
	// Mengambil semua produk dari database
	if err := config.DB.Find(&products).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data produk"})
	}

	return c.JSON(fiber.Map{
		"message": "Berhasil mengambil semua produk",
		"data":    products,
	})
}

// Menampilkan satu produk spesifik berdasarkan ID (Bisa diakses siapa saja)
func GetPublicProductByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	
	if err := config.DB.First(&product, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Produk tidak ditemukan"})
	}

	return c.JSON(fiber.Map{
		"message": "Berhasil mengambil detail produk",
		"data":    product,
	})
}