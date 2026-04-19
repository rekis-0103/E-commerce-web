package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RegisterWarehouse - Mendaftarkan gudang baru untuk warehouse staff
func RegisterWarehouse(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Cek apakah user sudah punya gudang
	var existingWarehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", userID).First(&existingWarehouse).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Anda sudah memiliki gudang terdaftar",
			"warehouse": existingWarehouse,
		})
	}

	var req struct {
		Name          string `json:"name"`
		Code          string `json:"code"`
		Address       string `json:"address"`
		Province      string `json:"province"`
		WarehouseType string `json:"warehouse_type"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Validasi required fields
	if req.Name == "" || req.Code == "" || req.Province == "" || req.WarehouseType == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama, kode, provinsi, dan tipe gudang wajib diisi"})
	}

	// Cek apakah kode gudang sudah digunakan
	var codeExists models.Warehouse
	if err := config.DB.Where("code = ?", req.Code).First(&codeExists).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Kode gudang sudah digunakan"})
	}

	warehouse := models.Warehouse{
		Name:          req.Name,
		Code:          req.Code,
		Address:       req.Address,
		Province:      req.Province,
		WarehouseType: req.WarehouseType,
		OwnerID:       userID,
	}

	if err := config.DB.Create(&warehouse).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mendaftarkan gudang"})
	}

	// Update WarehouseID pada User pembuat
	config.DB.Model(&models.User{}).Where("id = ?", userID).Update("warehouse_id", warehouse.ID)

	return c.Status(201).JSON(fiber.Map{
		"message": "Gudang berhasil didaftarkan",
		"warehouse": warehouse,
	})
}

// GetMyWarehouse - Mendapatkan data gudang milik warehouse staff yang login
func GetMyWarehouse(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var warehouse models.Warehouse
	// Cari gudang dimana user ini adalah Owner atau Staff
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	if user.WarehouseID == nil {
		// Cek apakah dia owner tapi warehouse_id belum diupdate (migrasi lama)
		if err := config.DB.Where("owner_id = ?", userID).First(&warehouse).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan. Silakan daftarkan gudang terlebih dahulu"})
		}
		// Update warehouse_id yang kosong
		config.DB.Model(&user).Update("warehouse_id", warehouse.ID)
	}

	if err := config.DB.Where("id = ?", user.WarehouseID).Preload("Staff").Preload("Movements").First(&warehouse).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	return c.JSON(fiber.Map{
		"message": "Data gudang berhasil diambil",
		"data":    warehouse,
	})
}

// RecordMovement - Input resi barang masuk atau keluar dari gudang
func RecordMovement(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var req struct {
		TrackingNumber string `json:"tracking_number"`
		MovementType   string `json:"movement_type"` // 'masuk' atau 'keluar'
		Status         string `json:"status"`
		Notes          string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Validasi required fields
	if req.TrackingNumber == "" || req.MovementType == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nomor resi dan tipe pergerakan wajib diisi"})
	}

	// Validasi movement type
	if req.MovementType != "masuk" && req.MovementType != "keluar" {
		return c.Status(400).JSON(fiber.Map{"message": "Tipe pergerakan harus 'masuk' atau 'keluar'"})
	}

	// Dapatkan gudang milik user
	var warehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", userID).First(&warehouse).Error; err != nil {
		// Cek jika dia staff
		var user models.User
		config.DB.First(&user, userID)
		if user.WarehouseID != nil {
			config.DB.First(&warehouse, user.WarehouseID)
		} else {
			return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
		}
	}

	// LOGIKA KHUSUS TIPE GUDANG
	if warehouse.WarehouseType == "pengiriman" && req.MovementType == "keluar" {
		// Gudang pengiriman hanya boleh keluar ke KURIR, bukan antar gudang
		if req.Status != "Diserahkan ke Kurir" {
			return c.Status(400).JSON(fiber.Map{
				"message": "Gudang pengiriman hanya bisa memproses barang keluar untuk diserahkan ke kurir (Gunakan status 'Diserahkan ke Kurir')",
			})
		}
	}

	// Cek apakah resi ada di sistem
	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", req.TrackingNumber).First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan di sistem"})
	}

	// Mulai transaksi
	tx := config.DB.Begin()

	// Buat record warehouse movement
	movement := models.WarehouseMovement{
		WarehouseID:    warehouse.ID,
		TrackingNumber: req.TrackingNumber,
		MovementType:   req.MovementType,
		Status:         req.Status,
		Notes:          req.Notes,
		ProcessedBy:    userID,
		ProcessedAt:    time.Now(),
	}

	if err := tx.Create(&movement).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mencatat pergerakan barang"})
	}

	// Update shipment log untuk tracking
	shipmentLogStatus := fmt.Sprintf("Barang %s di gudang %s", req.MovementType, warehouse.Name)
	if req.Status != "" {
		shipmentLogStatus = req.Status
	}

	// Update current location shipment
	shipment.CurrentLocation = warehouse.Name
	if req.MovementType == "keluar" {
		if req.Status == "Diserahkan ke Kurir" {
			shipment.CurrentLocation = "Dalam Perjalanan ke Alamat Pembeli"
			shipment.CurrentStatus = "Dalam Perjalanan"
		} else {
			shipment.CurrentLocation = fmt.Sprintf("Keluar dari %s", warehouse.Name)
		}
	} else if req.MovementType == "masuk" {
		shipment.CurrentStatus = "Diproses di Gudang"
	}

	if err := tx.Save(&shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update lokasi pengiriman"})
	}

	// Buat ShipmentLog entry
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        shipmentLogStatus,
		Location:      warehouse.Name,
		Notes: fmt.Sprintf("[%s] %s", 
			req.MovementType, 
			req.Notes),
		UpdatedBy:     userID,
		UpdatedByRole: "warehouse_staff",
	}

	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log pengiriman"})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message":  fmt.Sprintf("Berhasil mencatat barang %s", req.MovementType),
		"movement": movement,
		"log_id":   log.ID,
	})
}

// GetIncomingShipments - Mendapatkan daftar barang yang kemungkinan akan masuk ke gudang ini
func GetIncomingShipments(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var warehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", userID).First(&warehouse).Error; err != nil {
		var user models.User
		config.DB.First(&user, userID)
		if user.WarehouseID != nil {
			config.DB.First(&warehouse, user.WarehouseID)
		} else {
			return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
		}
	}

	var shipments []models.Shipment
	
	// Kriteria barang masuk:
	// 1. Status 'Dikirim' atau 'Dalam Perjalanan'
	// 2. Lokasi saat ini bukan gudang ini
	// 3. (Opsional) Alamat pengiriman di provinsi yang sama dengan gudang
	
	query := config.DB.Where("current_location != ? AND current_status IN (?)", warehouse.Name, []string{"Dikirim", "Dalam Perjalanan"})
	
	// Jika gudang pengiriman, filter berdasarkan provinsi
	if warehouse.WarehouseType == "pengiriman" {
		query = query.Where("shipping_address LIKE ?", "%"+warehouse.Province+"%")
	}

	if err := query.Find(&shipments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data barang masuk"})
	}

	return c.JSON(fiber.Map{
		"message": "Data barang masuk berhasil diambil",
		"data":    shipments,
	})
}

// GetWarehouseStock - Mendapatkan daftar barang yang saat ini berada di dalam gudang
func GetWarehouseStock(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var warehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", userID).First(&warehouse).Error; err != nil {
		var user models.User
		config.DB.First(&user, userID)
		if user.WarehouseID != nil {
			config.DB.First(&warehouse, user.WarehouseID)
		} else {
			return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
		}
	}

	var shipments []models.Shipment
	
	// Kriteria barang di gudang:
	// 1. Lokasi saat ini adalah gudang ini
	// 2. Status pengiriman adalah 'Diproses di Gudang' atau 'Dikirim' (jika baru masuk)
	
	if err := config.DB.Where("current_location = ? AND current_status != ?", warehouse.Name, "Selesai").
		Find(&shipments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data stok gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Data stok gudang berhasil diambil",
		"data":    shipments,
	})
}

// GetWarehouseMovements - Mendapatkan riwayat semua pergerakan barang di gudang
func GetWarehouseMovements(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var warehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", userID).First(&warehouse).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	var movements []models.WarehouseMovement
	if err := config.DB.Where("warehouse_id = ?", warehouse.ID).
		Order("created_at desc").
		Find(&movements).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil riwayat pergerakan"})
	}

	return c.JSON(fiber.Map{
		"message": "Riwayat pergerakan gudang berhasil diambil",
		"data":    movements,
	})
}

// GetAllWarehouses - Untuk admin: lihat semua gudang
func GetAllWarehouses(c *fiber.Ctx) error {
	var warehouses []models.Warehouse
	if err := config.DB.Preload("Owner").Find(&warehouses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Data semua gudang berhasil diambil",
		"data":    warehouses,
	})
}

// GetWarehouseByID - Mendapatkan detail gudang tertentu
func GetWarehouseByID(c *fiber.Ctx) error {
	warehouseID := c.Params("id")

	var warehouse models.Warehouse
	if err := config.DB.Preload("Owner").Preload("Movements").First(&warehouse, warehouseID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	return c.JSON(fiber.Map{
		"message": "Detail gudang berhasil diambil",
		"data":    warehouse,
	})
}

// GetAvailableStaff - Mendapatkan daftar semua warehouse staff yang belum ditugaskan ke gudang manapun
func GetAvailableStaff(c *fiber.Ctx) error {
	var staff []models.User
	if err := config.DB.Where("role = ? AND (warehouse_id IS NULL OR warehouse_id = 0)", "warehouse_staff").Find(&staff).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data staf"})
	}

	return c.JSON(fiber.Map{
		"message": "Data staf yang tersedia berhasil diambil",
		"data":    staff,
	})
}

// AddStaffToWarehouse - Menugaskan staf ke gudang milik user yang login (Owner)
func AddStaffToWarehouse(c *fiber.Ctx) error {
	ownerID := uint(c.Locals("user_id").(float64))

	var req struct {
		StaffID uint `json:"staff_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Pastikan user yang login adalah owner sebuah gudang
	var warehouse models.Warehouse
	if err := config.DB.Where("owner_id = ?", ownerID).First(&warehouse).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"message": "Hanya pemilik gudang yang dapat menambah staf"})
	}

	// Update WarehouseID pada staff yang dipilih
	if err := config.DB.Model(&models.User{}).Where("id = ? AND role = ?", req.StaffID, "warehouse_staff").Update("warehouse_id", warehouse.ID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menambahkan staf ke gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Staf berhasil ditambahkan ke gudang",
	})
}
