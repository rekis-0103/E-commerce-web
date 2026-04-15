package controllers

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

// CreateShipment - Membuat data pengiriman saat order status berubah jadi "Dikirim"
func CreateShipment(orderID uint, courierName string, shippingAddress string, estimatedDays int) (*models.Shipment, error) {
	// Cek apakah shipment sudah ada
	var existingShipment models.Shipment
	if err := config.DB.Where("order_id = ?", orderID).First(&existingShipment).Error; err == nil {
		return &existingShipment, nil // Sudah ada, kembalikan yang lama
	}

	trackingNumber := generateTrackingNumber(orderID)

	shipment := models.Shipment{
		OrderID:         orderID,
		TrackingNumber:  trackingNumber,
		CourierName:     courierName,
		CurrentStatus:   "Dikirim",
		CurrentLocation: "Gudang Pengiriman",
		ShippingAddress: shippingAddress,
		EstimatedDays:   estimatedDays,
	}

	if err := config.DB.Create(&shipment).Error; err != nil {
		return nil, err
	}

	// Buat log pertama
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        "Dikirim",
		Location:      "Gudang Pengiriman",
		Notes:         "Paket telah dikirim dari gudang",
		UpdatedBy:     0, // System
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

// UpdateShipmentLocation - Untuk staff gudang: update lokasi terakhir paket
func UpdateShipmentLocation(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	var req struct {
		TrackingNumber string `json:"tracking_number"`
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

	// Update lokasi terkini
	shipment.CurrentLocation = req.Location
	config.DB.Save(&shipment)

	// Buat log baru
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        shipment.CurrentStatus,
		Location:      req.Location,
		Notes:         req.Notes,
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}
	config.DB.Create(&log)

	return c.JSON(fiber.Map{
		"message": "Lokasi paket berhasil diperbarui",
		"data":    shipment,
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
