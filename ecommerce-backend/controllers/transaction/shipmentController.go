package transaction

import (
	"fmt"
	"math/rand"
	"time"

	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
)

// generateTrackingNumber membuat nomor resi unik dengan format: TRX-YYYYMMDD-XXXX
func generateTrackingNumber(orderID uint) string {
	now := time.Now()
	dateStr := now.Format("20060102")
	randSuffix := rand.Intn(10000)
	return fmt.Sprintf("TRX-%s-%04d-%d", dateStr, orderID, randSuffix)
}

// FindNearestWarehouse mencari gudang bertipe 'pengiriman' terdekat dengan lokasi asal
func FindNearestWarehouse(province, city, district string) (*models.Warehouse, error) {
	var warehouse models.Warehouse

	// Priority 1: Match Kecamatan (District)
	if err := config.DB.Where("warehouse_type = 'pengiriman' AND province = ? AND city = ? AND district = ?", province, city, district).First(&warehouse).Error; err == nil {
		return &warehouse, nil
	}

	// Priority 2: Match Kota (City)
	if err := config.DB.Where("warehouse_type = 'pengiriman' AND province = ? AND city = ?", province, city).First(&warehouse).Error; err == nil {
		return &warehouse, nil
	}

	// Priority 3: Match Provinsi (Province)
	if err := config.DB.Where("warehouse_type = 'pengiriman' AND province = ?", province).First(&warehouse).Error; err == nil {
		return &warehouse, nil
	}

	// Priority 4: Gudang Pengiriman apa saja yang tersedia (Global Fallback)
	if err := config.DB.Where("warehouse_type = 'pengiriman'").First(&warehouse).Error; err == nil {
		return &warehouse, nil
	}

	return nil, fmt.Errorf("tidak ada gudang pengiriman yang tersedia di wilayah ini")
}

// CreateShipment - Membuat data pengiriman saat order status berubah jadi "Dikirim"
func CreateShipment(orderID uint, courierName string, shippingAddress string, estimatedDays int) (*models.Shipment, error) {
	// 1. Dapatkan detail Order dan Lokasi Shop asal
	var order models.Order
	if err := config.DB.Preload("Items").First(&order, orderID).Error; err != nil {
		return nil, fmt.Errorf("order tidak ditemukan")
	}

	var shop models.Shop
	if err := config.DB.First(&shop, order.ShopID).Error; err != nil {
		return nil, fmt.Errorf("toko tidak ditemukan")
	}

	// 2. Cari Gudang Pengiriman terdekat dari lokasi Penjual
	nearestWH, err := FindNearestWarehouse(shop.Province, shop.City, shop.District)
	var warehouseIDPtr *uint = nil
	currentLocName := "Lokasi Pickup"
	if err == nil {
		warehouseIDPtr = &nearestWH.ID
		currentLocName = fmt.Sprintf("Hub Terdekat: %s (%s)", nearestWH.Name, nearestWH.City)
	}

	// 3. Cek apakah shipment sudah ada
	var existingShipment models.Shipment
	if err := config.DB.Where("order_id = ?", orderID).First(&existingShipment).Error; err == nil {
		return &existingShipment, nil
	}

	trackingNumber := generateTrackingNumber(orderID)

	shipment := models.Shipment{
		OrderID:         orderID,
		TrackingNumber:  trackingNumber,
		CourierName:     courierName,
		CurrentStatus:   "Dikirim",
		CurrentLocation: currentLocName,
		ShippingAddress: shippingAddress,
		EstimatedDays:   estimatedDays,
		WarehouseID:     warehouseIDPtr, // Tautkan ke gudang terdekat
	}

	if err := config.DB.Create(&shipment).Error; err != nil {
		return nil, err
	}

	// 4. Buat log pertama
	notes := "Pesanan telah diproses oleh penjual. Menunggu pickup oleh kurir."
	if nearestWH != nil {
		notes = fmt.Sprintf("Pesanan diproses. Paket akan dikirim melalui %s.", nearestWH.Name)
	}

	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        "Dikirim",
		Location:      shop.City,
		Notes:         notes,
		UpdatedBy:     0,
		UpdatedByRole: "system",
	}
	config.DB.Create(&log)

	return &shipment, nil
}

// GetTrackingByNumber - Tracking paket berdasarkan nomor resi (Publik)
func GetTrackingByNumber(c *fiber.Ctx) error {
	trackingNumber := c.Params("tracking_number")

	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", trackingNumber).Preload("Logs").First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan"})
	}

	// Urutkan logs dari yang terbaru
	logs := shipment.Logs
	for i, j := 0, len(logs)-1; i < j; i, j = i+1, j-1 {
		logs[i], logs[j] = logs[j], logs[i]
	}

	return c.JSON(fiber.Map{
		"message": "Data tracking ditemukan",
		"data": fiber.Map{
			"tracking_number":  shipment.TrackingNumber,
			"courier_name":     shipment.CourierName,
			"current_status":   shipment.CurrentStatus,
			"current_location": shipment.CurrentLocation,
			"shipping_address": shipment.ShippingAddress,
			"estimated_days":   shipment.EstimatedDays,
			"delivered_at":     shipment.DeliveredAt,
			"logs":             logs,
		},
	})
}

// GetMyShipmentOrders - Untuk buyer: lihat semua order yang punya shipment
func GetMyShipmentOrders(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shipments []models.Shipment
	if err := config.DB.
		Joins("JOIN orders ON orders.id = shipments.order_id").
		Where("orders.buyer_id = ?", userID).
		Preload("Logs").
		Find(&shipments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data pengiriman"})
	}

	// Urutkan logs dari yang terbaru untuk setiap shipment
	for i := range shipments {
		logs := shipments[i].Logs
		for j, k := 0, len(logs)-1; j < k; j, k = j+1, k-1 {
			logs[j], logs[k] = logs[k], logs[j]
		}
	}

	return c.JSON(fiber.Map{
		"message": "Data pengiriman berhasil diambil",
		"data":    shipments,
	})
}

// GetShopShipmentOrders - Untuk seller: lihat semua order dari toko yang punya shipment
func GetShopShipmentOrders(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	var shipments []models.Shipment
	if err := config.DB.
		Joins("JOIN orders ON orders.id = shipments.order_id").
		Where("orders.shop_id = ?", shop.ID).
		Preload("Logs").
		Find(&shipments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data pengiriman"})
	}

	// Urutkan logs dari yang terbaru
	for i := range shipments {
		logs := shipments[i].Logs
		for j, k := 0, len(logs)-1; j < k; j, k = j+1, k-1 {
			logs[j], logs[k] = logs[k], logs[j]
		}
	}

	return c.JSON(fiber.Map{
		"message": "Data pengiriman toko berhasil diambil",
		"data":    shipments,
	})
}

// GetNextDestination menghitung gudang mana yang harus dituju selanjutnya
func GetNextDestination(shipment *models.Shipment) (string, *uint, string) {
	var currentWH models.Warehouse
	if shipment.WarehouseID == nil {
		return "Alamat Pembeli", nil, "Kurir akan mengantar ke alamat tujuan"
	}
	config.DB.First(&currentWH, *shipment.WarehouseID)

	// JIKA di Gudang Pengiriman Asal (Origin Hub) -> Kirim ke Gudang Transit (Sortir) di provinsi yang sama
	if currentWH.WarehouseType == "pengiriman" && (shipment.CurrentStatus == "Dikirim" || shipment.CurrentStatus == "Di Gudang") {
		// Cari apakah kita sudah di Hub Tujuan atau Hub Asal
		// Untuk menyederhanakan, kita cek apakah ada gudang sortir di provinsi ini
		var sortirWH models.Warehouse
		err := config.DB.Where("warehouse_type = 'sortir' AND province = ?", currentWH.Province).First(&sortirWH).Error
		if err == nil && sortirWH.ID != currentWH.ID {
			return "Gudang Transit (Sortir)", &sortirWH.ID, sortirWH.Name
		}
	}

	// JIKA di Gudang Sortir -> Kirim ke Hub Pengiriman (Last Mile Hub) terdekat dengan alamat pembeli
	if currentWH.WarehouseType == "sortir" {
		// Parsing sederhana dari ShippingAddress (asumsi format: "... , Kota, Provinsi")
		// Dalam implementasi nyata, sebaiknya tabel Order/Shipment punya field Province/City terpisah
		// Kita coba cari Hub Pengiriman di wilayah tersebut atau fallback ke Hub Pengiriman mana saja
		targetWH, err := FindNearestWarehouse("", "", "") // Fallback
		if err == nil && targetWH.ID != currentWH.ID {
			return "Hub Pengiriman Tujuan", &targetWH.ID, targetWH.Name
		}
	}

	// JIKA sudah di Hub Pengiriman Tujuan atau tidak ada rute lain -> Alamat Pembeli
	return "Alamat Pembeli", nil, "Kurir akan mengantar ke alamat tujuan"
}

// UpdateShipmentLocation - Untuk staff gudang: proses barang masuk/keluar
func UpdateShipmentLocation(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	var req struct {
		TrackingNumber string `json:"tracking_number"`
		Action         string `json:"action"` // "masuk" atau "keluar"
		Notes          string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", req.TrackingNumber).First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan"})
	}

	// Dapatkan data gudang tempat staff bekerja
	var staff models.User
	config.DB.First(&staff, userID)
	if staff.WarehouseID == nil {
		return c.Status(403).JSON(fiber.Map{"message": "Anda tidak terdaftar di gudang manapun"})
	}

	var currentWH models.Warehouse
	config.DB.First(&currentWH, *staff.WarehouseID)

	status := shipment.CurrentStatus
	location := currentWH.Name

	if req.Action == "masuk" {
		shipment.WarehouseID = staff.WarehouseID
		shipment.CurrentStatus = "Di Gudang"
		if currentWH.WarehouseType == "sortir" {
			shipment.CurrentStatus = "Transit di Gudang Sortir"
		}
		status = "Diterima di " + currentWH.Name
	} else if req.Action == "keluar" {
		destType, nextWHID, nextName := GetNextDestination(&shipment)
		
		shipment.CurrentStatus = "Dalam Perjalanan ke " + destType
		status = "Keluar dari " + currentWH.Name
		location = "Menuju " + nextName
		
		// PENTING: Update WarehouseID ke tujuan berikutnya agar muncul di tab "Akan Masuk" gudang tujuan
		shipment.WarehouseID = nextWHID 
	}

	shipment.CurrentLocation = location
	if err := config.DB.Save(&shipment).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan perubahan status"})
	}

	// Log
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        status,
		Location:      currentWH.Name, // Tetap gunakan nama gudang saat ini sebagai lokasi event
		Notes:         req.Notes,
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}
	config.DB.Create(&log)

	return c.JSON(fiber.Map{
		"message": "Status paket diperbarui", 
		"action": req.Action,
		"current_location": location,
		"status": shipment.CurrentStatus,
	})
}

// UpdateShipmentStatus - Untuk kurir: update status pengiriman
func UpdateShipmentStatus(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	var req struct {
		TrackingNumber string `json:"tracking_number"`
		Status         string `json:"status"` // "Dalam Perjalanan" atau "Sampai"
		Location       string `json:"location"`
		Notes          string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", req.TrackingNumber).First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan"})
	}

	// Update status
	shipment.CurrentStatus = req.Status
	if req.Location != "" {
		shipment.CurrentLocation = req.Location
	}

	// Jika status "Sampai", catat waktu delivery
	if req.Status == "Sampai" {
		now := time.Now()
		shipment.DeliveredAt = &now
	}

	config.DB.Save(&shipment)

	// Buat log
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        req.Status,
		Location:      req.Location,
		Notes:         req.Notes,
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}
	config.DB.Create(&log)

	return c.JSON(fiber.Map{
		"message": "Status pengiriman berhasil diperbarui",
		"data":    shipment,
	})
}

// GetAllShipments - Untuk admin/kurir/gudang: lihat semua pengiriman
func GetAllShipments(c *fiber.Ctx) error {
	var shipments []models.Shipment
	if err := config.DB.Preload("Logs").Order("created_at desc").Find(&shipments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data pengiriman"})
	}

	// Batasi logs di response utama (hambil 1 log terakhir)
	type ShipmentSummary struct {
		models.Shipment
		LastLog *models.ShipmentLog `json:"last_log,omitempty"`
	}

	var summaries []ShipmentSummary
	for _, s := range shipments {
		summary := ShipmentSummary{Shipment: s}
		if len(s.Logs) > 0 {
			summary.LastLog = &s.Logs[0]
		}
		summaries = append(summaries, summary)
	}

	return c.JSON(fiber.Map{
		"message": "Data pengiriman berhasil diambil",
		"data":    summaries,
	})
}

// ConfirmReceived - Untuk seller: konfirmasi paket sudah diterima buyer
func ConfirmReceived(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := uint(c.Locals("user_id").(float64))

	// Validasi: user harus pemilik shop dari order ini
	var shop models.Shop
	if err := config.DB.Where("user_id = ?", userID).First(&shop).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	var order models.Order
	if err := config.DB.Where("id = ? AND shop_id = ?", orderID, shop.ID).First(&order).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Pesanan tidak ditemukan"})
	}

	if order.Status != "Menunggu Konfirmasi Diterima" {
		return c.Status(400).JSON(fiber.Map{"message": "Pesanan tidak dalam status menunggu konfirmasi"})
	}

	// Update status order jadi "Selesai"
	order.Status = "Selesai"
	config.DB.Save(&order)

	// Update shipment jika ada
	var shipment models.Shipment
	if err := config.DB.Where("order_id = ?", orderID).First(&shipment).Error; err == nil {
		shipment.CurrentStatus = "Selesai"
		now := time.Now()
		shipment.DeliveredAt = &now
		config.DB.Save(&shipment)

		// Buat log
		log := models.ShipmentLog{
			ShipmentID:    shipment.ID,
			Status:        "Selesai",
			Location:      shipment.CurrentLocation,
			Notes:         "Paket dikonfirmasi diterima oleh pembeli",
			UpdatedBy:     userID,
			UpdatedByRole: "seller",
		}
		config.DB.Create(&log)
	}

	return c.JSON(fiber.Map{
		"message": "Pesanan telah dikonfirmasi selesai",
		"data":    order,
	})
}
