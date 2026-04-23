package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RegisterDeliveryHub - Mendaftarkan delivery hub baru (Admin)
func RegisterDeliveryHub(c *fiber.Ctx) error {
	var req struct {
		Name    string `json:"name"`
		Code    string `json:"code"`
		Address string `json:"address"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama dan kode hub wajib diisi"})
	}

	// Cek apakah kode hub sudah digunakan
	var codeExists models.DeliveryHub
	if err := config.DB.Where("code = ?", req.Code).First(&codeExists).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Kode hub sudah digunakan"})
	}

	hub := models.DeliveryHub{
		Name:    req.Name,
		Code:    req.Code,
		Address: req.Address,
	}

	if err := config.DB.Create(&hub).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mendaftarkan delivery hub"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "Delivery hub berhasil didaftarkan",
		"hub":     hub,
	})
}

// GetAllDeliveryHubs - Lihat semua delivery hub
func GetAllDeliveryHubs(c *fiber.Ctx) error {
	var hubs []models.DeliveryHub
	if err := config.DB.Preload("AssignedCourier").Find(&hubs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data delivery hub"})
	}

	return c.JSON(fiber.Map{
		"message": "Data delivery hub berhasil diambil",
		"data":    hubs,
	})
}

// AssignCourierToHub - Menugaskan kurir ke delivery hub (Admin)
func AssignCourierToHub(c *fiber.Ctx) error {
	hubID := c.Params("id")

	var req struct {
		CourierID uint `json:"courier_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	var hub models.DeliveryHub
	if err := config.DB.First(&hub, hubID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Delivery hub tidak ditemukan"})
	}

	// Cek apakah user adalah courier
	var courier models.User
	if err := config.DB.Where("id = ? AND role = ?", req.CourierID, "courier").First(&courier).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User kurir tidak ditemukan"})
	}

	hub.AssignedCourierID = &req.CourierID
	if err := config.DB.Save(&hub).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan kurir ke hub"})
	}

	return c.JSON(fiber.Map{
		"message": "Kurir berhasil ditugaskan ke delivery hub",
		"hub":     hub,
	})
}

// AssignShipmentToHub - Menugaskan paket ke delivery hub (Seller/Admin)
func AssignShipmentToHub(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	var req struct {
		TrackingNumber string `json:"tracking_number"`
		HubID          uint   `json:"hub_id"`
		Notes          string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.TrackingNumber == "" || req.HubID == 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Nomor resi dan hub wajib diisi"})
	}

	// Cek shipment
	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", req.TrackingNumber).First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan"})
	}

	// Validasi: seller hanya bisa assign shipment dari toko mereka sendiri
	if userRole == "seller" {
		var order models.Order
		if err := config.DB.First(&order, shipment.OrderID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"message": "Order tidak ditemukan"})
		}

		var shop models.Shop
		if err := config.DB.Where("id = ? AND user_id = ?", order.ShopID, userID).First(&shop).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Bukan pesanan Anda"})
		}
	}

	// Cek hub
	var hub models.DeliveryHub
	if err := config.DB.First(&hub, req.HubID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Delivery hub tidak ditemukan"})
	}

	// Cek apakah sudah ada assignment aktif untuk shipment ini
	var existingAssignment models.HubAssignment
	if err := config.DB.Where("shipment_id = ? AND status IN ?", shipment.ID, []string{"menunggu", "diambil", "dikirim"}).First(&existingAssignment).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{
			"message": "Paket sudah ditugaskan ke hub lain",
			"current_hub": existingAssignment.Hub.Name,
		})
	}

	// Buat assignment
	assignment := models.HubAssignment{
		HubID:          hub.ID,
		ShipmentID:     shipment.ID,
		TrackingNumber: req.TrackingNumber,
		Status:         "menunggu",
		AssignedBy:     userID,
		AssignedAt:     time.Now(),
		Notes:          req.Notes,
	}

	tx := config.DB.Begin()

	if err := tx.Create(&assignment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan paket ke hub"})
	}

	// Update shipment location
	shipment.CurrentLocation = fmt.Sprintf("Menunggu pengambilan di %s", hub.Name)
	if err := tx.Save(&shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update lokasi shipment"})
	}

	// Buat ShipmentLog
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        "Menunggu Pengambilan di Hub",
		Location:      hub.Name,
		Notes:         fmt.Sprintf("[Hub Assignment] %s", req.Notes),
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}

	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log shipment"})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message":    "Paket berhasil ditugaskan ke delivery hub",
		"assignment": assignment,
	})
}

// GetMyHubAssignments - Untuk kurir: lihat semua paket yang ditugaskan di hub mereka
func GetMyHubAssignments(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Cari hub tempat kurir ini bertugas
	var hub models.DeliveryHub
	if err := config.DB.Where("assigned_courier_id = ?", userID).First(&hub).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"message": "Anda belum ditugaskan ke delivery hub manapun",
		})
	}

	// Ambil semua assignment di hub ini
	var assignments []models.HubAssignment
	if err := config.DB.Where("hub_id = ?", hub.ID).
		Preload("Shipment").
		Order("created_at desc").
		Find(&assignments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data assignment"})
	}

	return c.JSON(fiber.Map{
		"message": "Data assignment berhasil diambil",
		"hub":     hub,
		"data":    assignments,
	})
}

// PickupShipment - Kurir mengambil paket dari hub
func PickupShipment(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	assignmentID := c.Params("id")

	var assignment models.HubAssignment
	if err := config.DB.Preload("Hub").Preload("Shipment").First(&assignment, assignmentID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Assignment tidak ditemukan"})
	}

	// Validasi: kurir harus dari hub yang sama
	var hub models.DeliveryHub
	if err := config.DB.Where("assigned_courier_id = ? AND id = ?", userID, assignment.HubID).First(&hub).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Bukan hub Anda"})
	}

	if assignment.Status != "menunggu" {
		return c.Status(400).JSON(fiber.Map{
			"message": fmt.Sprintf("Paket tidak bisa diambil. Status saat ini: %s", assignment.Status),
		})
	}

	tx := config.DB.Begin()

	// Update assignment
	now := time.Now()
	assignment.Status = "diambil"
	assignment.PickedUpBy = userID
	assignment.PickedUpAt = &now

	if err := tx.Save(&assignment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update assignment"})
	}

	// Update shipment
	assignment.Shipment.CurrentLocation = fmt.Sprintf("Dalam perjalanan - %s", hub.Name)
	if err := tx.Save(&assignment.Shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update shipment"})
	}

	// Buat ShipmentLog
	log := models.ShipmentLog{
		ShipmentID:    assignment.Shipment.ID,
		Status:        "Diambil oleh Kurir",
		Location:      hub.Name,
		Notes:         "Paket telah diambil dari delivery hub untuk dikirim ke alamat tujuan",
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}

	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log shipment"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message":    "Paket berhasil diambil dari hub",
		"assignment": assignment,
	})
}

// UpdateDeliveryStatus - Update status pengiriman setelah paket diambil dari hub
func UpdateDeliveryStatus(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)

	assignmentID := c.Params("id")

	var req struct {
		Status   string `json:"status"`   // "dikirim" atau "selesai"
		Location string `json:"location"` // Lokasi terkini
		Notes    string `json:"notes"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Status == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Status wajib diisi"})
	}

	var assignment models.HubAssignment
	if err := config.DB.Preload("Hub").Preload("Shipment").First(&assignment, assignmentID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Assignment tidak ditemukan"})
	}

	// Validasi: kurir harus dari hub yang sama
	var hub models.DeliveryHub
	if err := config.DB.Where("assigned_courier_id = ? AND id = ?", userID, assignment.HubID).First(&hub).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Bukan hub Anda"})
	}

	if assignment.Status == "selesai" {
		return c.Status(400).JSON(fiber.Map{"message": "Paket sudah selesai dikirim"})
	}

	tx := config.DB.Begin()

	// Update assignment status
	if req.Status == "dikirim" {
		assignment.Status = "dikirim"
	} else if req.Status == "selesai" {
		assignment.Status = "selesai"
		now := time.Now()
		assignment.DeliveredAt = &now
	}

	if err := tx.Save(&assignment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update status assignment"})
	}

	// Update shipment
	locationUpdate := req.Location
	if locationUpdate == "" {
		locationUpdate = fmt.Sprintf("Dalam perjalanan dari %s", hub.Name)
	}
	assignment.Shipment.CurrentLocation = locationUpdate

	if req.Status == "selesai" {
		assignment.Shipment.CurrentStatus = "Sampai"
		now := time.Now()
		assignment.Shipment.DeliveredAt = &now
	}

	if err := tx.Save(&assignment.Shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update shipment"})
	}

	// Buat ShipmentLog
	shipmentLogStatus := "Dalam Perjalanan"
	if req.Status == "selesai" {
		shipmentLogStatus = "Sampai di Tujuan"
	}

	log := models.ShipmentLog{
		ShipmentID:    assignment.Shipment.ID,
		Status:        shipmentLogStatus,
		Location:      locationUpdate,
		Notes:         req.Notes,
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}

	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log shipment"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message":    fmt.Sprintf("Status berhasil diperbarui: %s", req.Status),
		"assignment": assignment,
	})
}

// GetHubPendingPackages - Lihat semua paket yang menunggu di hub tertentu
func GetHubPendingPackages(c *fiber.Ctx) error {
	hubID := c.Params("id")

	var hub models.DeliveryHub
	if err := config.DB.First(&hub, hubID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Delivery hub tidak ditemukan"})
	}

	var assignments []models.HubAssignment
	if err := config.DB.Where("hub_id = ? AND status = ?", hub.ID, "menunggu").
		Preload("Shipment").
		Order("created_at desc").
		Find(&assignments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data assignment"})
	}

	return c.JSON(fiber.Map{
		"message": "Data paket menunggu berhasil diambil",
		"hub":     hub,
		"data":    assignments,
	})
}

// GetCourierDeliveryHistory - Riwayat pengiriman kurir
func GetCourierDeliveryHistory(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Cari hub tempat kurir ini bertugas
	var hub models.DeliveryHub
	if err := config.DB.Where("assigned_courier_id = ?", userID).First(&hub).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"message": "Anda belum ditugaskan ke delivery hub manapun",
		})
	}

	var assignments []models.HubAssignment
	if err := config.DB.Where("hub_id = ? AND picked_up_by = ?", hub.ID, userID).
		Preload("Shipment").
		Order("created_at desc").
		Find(&assignments).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil riwayat pengiriman"})
	}

	return c.JSON(fiber.Map{
		"message": "Riwayat pengiriman berhasil diambil",
		"hub":     hub,
		"data":    assignments,
	})
}

// UploadDeliveryProof - Kurir upload foto bukti pengiriman & tandai sudah dikirim ke alamat
func UploadDeliveryProof(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	userRole := c.Locals("role").(string)
	assignmentID := c.Params("id")

	var assignment models.HubAssignment
	if err := config.DB.Preload("Hub").Preload("Shipment").First(&assignment, assignmentID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Assignment tidak ditemukan"})
	}

	// Validasi: kurir harus dari hub yang sama
	var hub models.DeliveryHub
	if err := config.DB.Where("assigned_courier_id = ? AND id = ?", userID, assignment.HubID).First(&hub).Error; err != nil {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Bukan hub Anda"})
	}

	if assignment.Status != "diambil" && assignment.Status != "dikirim" {
		return c.Status(400).JSON(fiber.Map{"message": "Status paket tidak memungkinkan upload bukti"})
	}

	// Handle file upload
	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "File foto wajib diunggah"})
	}

	// Simpan file
	filename := fmt.Sprintf("delivery_%s_%d_%s", assignment.TrackingNumber, userID, file.Filename)
	savePath := fmt.Sprintf("./uploads/delivery/%s", filename)
	if err := c.SaveFile(file, savePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan foto"})
	}

	photoURL := fmt.Sprintf("http://localhost:3000/uploads/delivery/%s", filename)
	notes := c.FormValue("notes", "")

	tx := config.DB.Begin()

	// Update assignment
	now := time.Now()
	assignment.Status = "menunggu_konfirmasi"
	assignment.DeliveryPhotoURL = photoURL
	assignment.DeliveredAt = &now

	if err := tx.Save(&assignment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update assignment"})
	}

	// Update shipment
	assignment.Shipment.CurrentStatus = "Menunggu Konfirmasi Diterima"
	assignment.Shipment.CurrentLocation = "Terkirim ke Alamat Tujuan"
	assignment.Shipment.DeliveryPhotoURL = photoURL
	assignment.Shipment.DeliveredAt = &now

	if err := tx.Save(&assignment.Shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update shipment"})
	}

	// Buat ShipmentLog
	log := models.ShipmentLog{
		ShipmentID:    assignment.Shipment.ID,
		Status:        "Terkirim - Menunggu Konfirmasi Penerima",
		Location:      assignment.Shipment.ShippingAddress,
		Notes:         fmt.Sprintf("[Bukti Foto] %s", notes),
		UpdatedBy:     userID,
		UpdatedByRole: userRole,
	}
	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log shipment"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message":   "Bukti pengiriman berhasil diunggah. Menunggu konfirmasi penerima.",
		"photo_url": photoURL,
	})
}

// ConfirmPackageReceived - Buyer mengkonfirmasi paket sudah diterima
func ConfirmPackageReceived(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))
	trackingNumber := c.Params("tracking_number")

	// Cari shipment berdasarkan resi
	var shipment models.Shipment
	if err := config.DB.Where("tracking_number = ?", trackingNumber).First(&shipment).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Nomor resi tidak ditemukan"})
	}

	// Validasi: pastikan ini memang order milik buyer ini
	var order models.Order
	if err := config.DB.First(&order, shipment.OrderID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Order tidak ditemukan"})
	}
	if order.BuyerID != userID {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak"})
	}

	if shipment.CurrentStatus != "Menunggu Konfirmasi Diterima" {
		return c.Status(400).JSON(fiber.Map{"message": "Status paket tidak memungkinkan konfirmasi"})
	}

	tx := config.DB.Begin()

	now := time.Now()
	shipment.CurrentStatus = "Diterima"
	shipment.ReceivedAt = &now

	if err := tx.Save(&shipment).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal konfirmasi penerimaan"})
	}

	// Update order status jadi Selesai
	if err := tx.Model(&models.Order{}).Where("id = ?", order.ID).Update("status", "Selesai").Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update status pesanan"})
	}

	// Update hub assignment jadi selesai
	tx.Model(&models.HubAssignment{}).Where("shipment_id = ?", shipment.ID).Update("status", "selesai")

	// --- AKANE PAY: TRANSFER KE PENJUAL ---
	var shop models.Shop
	if err := config.DB.First(&shop, order.ShopID).Error; err == nil {
		// Hitung biaya layanan (misal 2.5%)
		serviceFeeRate := 0.025
		serviceFee := order.TotalAmount * serviceFeeRate
		netAmount := order.TotalAmount - serviceFee

		// Cari wallet penjual
		var sellerWallet models.Wallet
		if err := tx.Where("user_id = ?", shop.UserID).First(&sellerWallet).Error; err != nil {
			// Jika belum punya wallet, buatkan
			sellerWallet = models.Wallet{UserID: shop.UserID, Balance: 0, IsActive: true}
			tx.Create(&sellerWallet)
		}

		// Tambahkan saldo
		sellerWallet.Balance += netAmount
		tx.Save(&sellerWallet)

		// Catat Transaksi Pendapatan
		incomeTx := models.WalletTransaction{
			WalletID:      sellerWallet.ID,
			Type:          "income",
			Amount:        netAmount,
			Fee:           serviceFee,
			Description:   fmt.Sprintf("Pendapatan Pesanan #%d", order.ID),
			TransactionID: fmt.Sprintf("INC-%d", time.Now().Unix()),
			Status:        "success",
		}
		tx.Create(&incomeTx)
	}
	// ---------------------------------------

	// Buat ShipmentLog
	log := models.ShipmentLog{
		ShipmentID:    shipment.ID,
		Status:        "Paket Diterima oleh Pembeli",
		Location:      shipment.ShippingAddress,
		Notes:         "Pembeli telah mengkonfirmasi penerimaan paket",
		UpdatedBy:     userID,
		UpdatedByRole: "buyer",
	}
	if err := tx.Create(&log).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat log shipment"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Konfirmasi berhasil! Pesanan telah selesai."})
}
