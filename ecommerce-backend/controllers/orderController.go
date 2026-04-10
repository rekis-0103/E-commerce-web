package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"

	"github.com/gofiber/fiber/v2"
)

// Checkout mengubah isi keranjang menjadi pesanan resmi
func Checkout(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var req struct {
		ShippingAddress string `json:"shipping_address"`
	}
	if err := c.BodyParser(&req); err != nil || req.ShippingAddress == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Alamat pengiriman wajib diisi!"})
	}

	var carts []models.Cart
	if err := config.DB.Where("buyer_id = ?", userID).Find(&carts).Error; err != nil || len(carts) == 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Keranjang belanja Anda masih kosong"})
	}

	ordersMap := make(map[uint][]models.OrderItem)
	totalsMap := make(map[uint]float64)

	for _, cart := range carts {
		var product models.Product
		if err := config.DB.First(&product, cart.ProductID).Error; err != nil {
			continue
		}

		// Tetap cek stok, sekadar memastikan barangnya masih ada saat checkout
		if product.Stock < cart.Quantity {
			return c.Status(400).JSON(fiber.Map{"message": "Maaf, stok produk " + product.Name + " tidak mencukupi"})
		}

		orderItem := models.OrderItem{
			ProductID: product.ID,
			Quantity:  cart.Quantity,
			Price:     product.Price,
		}

		ordersMap[product.ShopID] = append(ordersMap[product.ShopID], orderItem)
		totalsMap[product.ShopID] += product.Price * float64(cart.Quantity)
	}

	tx := config.DB.Begin()

	for shopID, items := range ordersMap {
		order := models.Order{
			BuyerID:         userID,
			ShopID:          shopID,
			TotalAmount:     totalsMap[shopID],
			Status:          "Menunggu Pembayaran",
			ShippingAddress: req.ShippingAddress,
		}

		if err := tx.Create(&order).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat nota pesanan"})
		}

		for _, item := range items {
			item.OrderID = order.ID
			if err := tx.Create(&item).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan rincian barang"})
			}
		}
	}

	if err := tx.Where("buyer_id = ?", userID).Delete(&models.Cart{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengosongkan keranjang"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Checkout berhasil! Silakan lakukan pembayaran."})
}

// FUNGSI BARU: Mengunggah Bukti Pembayaran & Memotong Stok
func UploadPaymentProof(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := uint(c.Locals("user_id").(float64))

	var order models.Order
	if err := config.DB.Where("id = ? AND buyer_id = ?", orderID, userID).First(&order).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Pesanan tidak ditemukan"})
	}

	if order.Status != "Menunggu Pembayaran" {
		return c.Status(400).JSON(fiber.Map{"message": "Pesanan ini tidak sedang menunggu pembayaran"})
	}

	// 1. Terima File Gambar
	file, err := c.FormFile("payment_proof")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Bukti pembayaran wajib diunggah"})
	}

	filename := fmt.Sprintf("proof-%d-%s", order.ID, file.Filename)
	imagePath := "/uploads/" + filename
	if err := c.SaveFile(file, fmt.Sprintf("./uploads/%s", filename)); err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan gambar"})
	}

	// 2. Mulai Transaksi untuk memotong stok dengan aman
	tx := config.DB.Begin()

	// Ambil semua barang di dalam pesanan ini
	var items []models.OrderItem
	tx.Where("order_id = ?", order.ID).Find(&items)

	// Kurangi stok produknya SEKARANG
	for _, item := range items {
		var product models.Product
		tx.First(&product, item.ProductID)
		
		// Validasi akhir: Jika ternyata dibeli orang lain duluan dan stok habis
		if product.Stock < item.Quantity {
			tx.Rollback()
			return c.Status(400).JSON(fiber.Map{"message": "Maaf, stok " + product.Name + " sudah habis keduluan pembeli lain!"})
		}

		tx.Model(&models.Product{}).Where("id = ?", item.ProductID).Update("stock", config.DB.Raw("stock - ?", item.Quantity))
	}

	// 3. Update status pesanan dan simpan path gambar
	order.PaymentProof = imagePath
	order.Status = "Menunggu Konfirmasi" // Berubah statusnya!
	if err := tx.Save(&order).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate pesanan"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Bukti pembayaran berhasil diunggah! Menunggu konfirmasi penjual."})
}

// Menampilkan riwayat pesanan khusus untuk pembeli yang sedang login
func GetMyOrders(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Kita membuat struct cetakan khusus agar data yang dikirim ke React sangat rapi
	type ItemDetail struct {
		ProductName string  `json:"product_name"`
		Quantity    int     `json:"quantity"`
		Price       float64 `json:"price"`
	}

	type OrderResponse struct {
		ID              uint         `json:"id"`
		TotalAmount     float64      `json:"total_amount"`
		Status          string       `json:"status"`
		ShippingAddress string       `json:"shipping_address"`
		PaymentProof    string       `json:"payment_proof"` // SUDAH ADA DI SINI
		CreatedAt       string       `json:"created_at"`
		Items           []ItemDetail `json:"items"`
	}

	var orders []models.Order
	// Ambil pesanan dari database, urutkan dari yang paling baru (descending)
	if err := config.DB.Where("buyer_id = ?", userID).Order("created_at desc").Find(&orders).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data pesanan"})
	}

	var response []OrderResponse

	// Looping setiap pesanan untuk mencari barang apa saja di dalamnya
	for _, order := range orders {
		var items []models.OrderItem
		config.DB.Where("order_id = ?", order.ID).Find(&items)

		var itemDetails []ItemDetail
		for _, item := range items {
			var product models.Product
			// Ambil nama produk berdasarkan ProductID
			config.DB.Select("name").Where("id = ?", item.ProductID).First(&product)
			
			itemDetails = append(itemDetails, ItemDetail{
				ProductName: product.Name,
				Quantity:    item.Quantity,
				Price:       item.Price,
			})
		}

		// Format tanggal agar ramah dibaca manusia
		formattedDate := order.CreatedAt.Format("02 Jan 2006, 15:04")

		response = append(response, OrderResponse{
			ID:              order.ID,
			TotalAmount:     order.TotalAmount,
			Status:          order.Status,
			ShippingAddress: order.ShippingAddress,
			PaymentProof:    order.PaymentProof, // SUDAH ADA DI SINI
			CreatedAt:       formattedDate,
			Items:           itemDetails,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Berhasil mengambil riwayat pesanan",
		"data":    response,
	})
}

// Menampilkan pesanan yang masuk ke toko milik penjual (Seller)
func GetShopOrders(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Cari ID Toko milik user yang sedang login
	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	// Struct cetakan (Sama seperti GetMyOrders)
	type ItemDetail struct {
		ProductName string  `json:"product_name"`
		Quantity    int     `json:"quantity"`
		Price       float64 `json:"price"`
	}

	type OrderResponse struct {
		ID              uint         `json:"id"`
		TotalAmount     float64      `json:"total_amount"`
		Status          string       `json:"status"`
		ShippingAddress string       `json:"shipping_address"`
		PaymentProof    string       `json:"payment_proof"` // SUDAH DIPERBAIKI DI SINI
		CreatedAt       string       `json:"created_at"`
		Items           []ItemDetail `json:"items"`
	}

	// Ambil pesanan khusus untuk ShopID ini
	var orders []models.Order
	if err := config.DB.Where("shop_id = ?", shop.ID).Order("created_at desc").Find(&orders).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil pesanan masuk"})
	}

	var response []OrderResponse

	for _, order := range orders {
		var items []models.OrderItem
		config.DB.Where("order_id = ?", order.ID).Find(&items)

		var itemDetails []ItemDetail
		for _, item := range items {
			var product models.Product
			config.DB.Select("name").Where("id = ?", item.ProductID).First(&product)
			
			itemDetails = append(itemDetails, ItemDetail{
				ProductName: product.Name,
				Quantity:    item.Quantity,
				Price:       item.Price,
			})
		}

		response = append(response, OrderResponse{
			ID:              order.ID,
			TotalAmount:     order.TotalAmount,
			Status:          order.Status,
			ShippingAddress: order.ShippingAddress,
			PaymentProof:    order.PaymentProof, // SUDAH DIPERBAIKI DI SINI
			CreatedAt:       order.CreatedAt.Format("02 Jan 2006, 15:04"),
			Items:           itemDetails,
		})
	}

	return c.JSON(fiber.Map{"message": "Berhasil", "data": response})
}

// Mengubah status pesanan oleh Penjual
func UpdateOrderStatus(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := uint(c.Locals("user_id").(float64))

	// Validasi keamanan: Pastikan toko yang login benar-benar pemilik pesanan ini
	var shop models.Shop
	config.DB.Where("user_id = ?", userID).First(&shop)

	var order models.Order
	if err := config.DB.Where("id = ? AND shop_id = ?", orderID, shop.ID).First(&order).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Pesanan tidak ditemukan atau akses ditolak"})
	}

	// Menangkap status baru dari React
	var req struct {
		Status string `json:"status"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Update status di database
	order.Status = req.Status
	config.DB.Save(&order)

	return c.JSON(fiber.Map{"message": "Status pesanan berhasil diperbarui!"})
}