package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"encoding/json" // TAMBAHAN BARU
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

// 1. CREATE: Menambah produk baru dengan BANYAK GAMBAR
func CreateProduct(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	name := c.FormValue("name")
	description := c.FormValue("description")
	price, _ := strconv.ParseFloat(c.FormValue("price"), 64)
	stock, _ := strconv.Atoi(c.FormValue("stock"))

	// Menangani BANYAK File Gambar (Array)
	form, err := c.MultipartForm()
	var imagePaths []string

	if err == nil && form != nil {
		files := form.File["images"] // Perhatikan huruf 's' (images)
		for _, file := range files {
			filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
			c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename))
			imagePaths = append(imagePaths, "/uploads/"+filename)
		}
	}

	// Ubah array path menjadi string JSON agar muat di kolom DB yang lama
	imagesJSON, _ := json.Marshal(imagePaths)

	product := models.Product{
		ShopID:      shop.ID,
		Name:        name,
		Description: description,
		Price:       price,
		Stock:       stock,
		Image:       string(imagesJSON), // Simpan sebagai array JSON
	}

	if err := config.DB.Create(&product).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan produk"})
	}

	return c.Status(201).JSON(fiber.Map{"message": "Produk berhasil ditambahkan!", "product": product})
}

// 2. READ: (Tetap sama seperti sebelumnya)
func GetMyShopProducts(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	var shop models.Shop
	config.DB.Where("user_id = ?", userID).First(&shop)
	var products []models.Product
	config.DB.Where("shop_id = ?", shop.ID).Find(&products)
	return c.JSON(fiber.Map{"data": products})
}

// 3. UPDATE: Mengedit Produk & Mengatur Ulang Gambar
func UpdateProduct(c *fiber.Ctx) error {
	productID := c.Params("id")
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	config.DB.Where("user_id = ?", userID).First(&shop)

	var product models.Product
	if err := config.DB.Where("id = ? AND shop_id = ?", productID, shop.ID).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Produk tidak ditemukan"})
	}

	product.Name = c.FormValue("name")
	product.Description = c.FormValue("description")
	product.Price, _ = strconv.ParseFloat(c.FormValue("price"), 64)
	product.Stock, _ = strconv.Atoi(c.FormValue("stock"))

	var finalImages []string

	// 1. Ambil gambar lama yang TIDAK dihapus (dan urutannya) dari React
	existingImagesStr := c.FormValue("existing_images")
	if existingImagesStr != "" {
		json.Unmarshal([]byte(existingImagesStr), &finalImages)
	}

	// 2. Tambahkan gambar baru (jika ada) ke urutan belakang
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		files := form.File["images"]
		for _, file := range files {
			filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
			c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename))
			finalImages = append(finalImages, "/uploads/"+filename)
		}
	}

	imagesJSON, _ := json.Marshal(finalImages)
	product.Image = string(imagesJSON)

	config.DB.Save(&product)
	return c.JSON(fiber.Map{"message": "Produk berhasil diupdate!"})
}

// 4. DELETE: (Tetap sama)
func DeleteProduct(c *fiber.Ctx) error {
	productID := c.Params("id")
	userID := uint(c.Locals("user_id").(float64))
	var shop models.Shop
	config.DB.Where("user_id = ?", userID).First(&shop)
	var product models.Product
	if err := config.DB.Where("id = ? AND shop_id = ?", productID, shop.ID).First(&product).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gagal menghapus"})
	}
	config.DB.Delete(&product)
	return c.JSON(fiber.Map{"message": "Produk berhasil dihapus!"})
}

// Fungsi Publik (Beranda & Detail - Tetap sama)
func GetAllPublicProducts(c *fiber.Ctx) error {
	var products []models.Product
	config.DB.Find(&products)
	return c.JSON(fiber.Map{"data": products})
}

func GetPublicProductByID(c *fiber.Ctx) error {
	id := c.Params("id")
	var product models.Product
	if err := config.DB.First(&product, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Produk tidak ditemukan"})
	}
	return c.JSON(fiber.Map{"data": product})
}