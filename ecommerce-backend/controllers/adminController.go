package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// AdminDashboardStats - Mendapatkan statistik dashboard admin
func AdminDashboardStats(c *fiber.Ctx) error {
	// Count users by role
	var totalUsers int64
	var totalBuyers int64
	var totalSellers int64
	var totalCouriers int64
	var totalWarehouseStaff int64

	config.DB.Model(&models.User{}).Count(&totalUsers)
	config.DB.Model(&models.User{}).Where("role = ?", "buyer").Count(&totalBuyers)
	config.DB.Model(&models.User{}).Where("role = ?", "seller").Count(&totalSellers)
	config.DB.Model(&models.User{}).Where("role = ?", "courier").Count(&totalCouriers)
	config.DB.Model(&models.User{}).Where("role = ?", "warehouse_staff").Count(&totalWarehouseStaff)

	// Count shops by status
	var totalShops int64
	var pendingShops int64
	var approvedShops int64
	var rejectedShops int64

	config.DB.Model(&models.Shop{}).Count(&totalShops)
	config.DB.Model(&models.Shop{}).Where("status = ?", "pending").Count(&pendingShops)
	config.DB.Model(&models.Shop{}).Where("status = ?", "approved").Count(&approvedShops)
	config.DB.Model(&models.Shop{}).Where("status = ?", "rejected").Count(&rejectedShops)

	// Count warehouses and delivery hubs
	var totalWarehouses int64
	var totalDeliveryHubs int64
	var assignedHubs int64

	config.DB.Model(&models.Warehouse{}).Count(&totalWarehouses)
	config.DB.Model(&models.DeliveryHub{}).Count(&totalDeliveryHubs)
	config.DB.Model(&models.DeliveryHub{}).Where("assigned_courier_id IS NOT NULL").Count(&assignedHubs)

	// Count shipments
	var totalShipments int64
	var activeShipments int64
	var deliveredShipments int64

	config.DB.Model(&models.Shipment{}).Count(&totalShipments)
	config.DB.Model(&models.Shipment{}).Where("current_status NOT IN ?", []string{"Sampai", "Selesai"}).Count(&activeShipments)
	config.DB.Model(&models.Shipment{}).Where("current_status IN ?", []string{"Sampai", "Selesai"}).Count(&deliveredShipments)

	// Count orders
	var totalOrders int64
	var pendingOrders int64
	var completedOrders int64

	config.DB.Model(&models.Order{}).Count(&totalOrders)
	config.DB.Model(&models.Order{}).Where("status = ?", "Menunggu Pembayaran").Count(&pendingOrders)
	config.DB.Model(&models.Order{}).Where("status = ?", "Selesai").Count(&completedOrders)

	// Recent activities (last 5 shops pending)
	var recentPendingShops []models.Shop
	config.DB.Where("status = ?", "pending").Order("created_at desc").Limit(5).Find(&recentPendingShops)

	return c.JSON(fiber.Map{
		"message": "Dashboard statistics berhasil diambil",
		"data": fiber.Map{
			"users": fiber.Map{
				"total":      totalUsers,
				"buyers":     totalBuyers,
				"sellers":    totalSellers,
				"couriers":   totalCouriers,
				"warehouse_staff": totalWarehouseStaff,
			},
			"shops": fiber.Map{
				"total":    totalShops,
				"pending":  pendingShops,
				"approved": approvedShops,
				"rejected": rejectedShops,
			},
			"warehouses": fiber.Map{
				"total_warehouses": totalWarehouses,
				"total_hubs":       totalDeliveryHubs,
				"assigned_hubs":    assignedHubs,
			},
			"shipments": fiber.Map{
				"total":   totalShipments,
				"active":  activeShipments,
				"delivered": deliveredShipments,
			},
			"orders": fiber.Map{
				"total":     totalOrders,
				"pending":   pendingOrders,
				"completed": completedOrders,
			},
			"recent_pending_shops": recentPendingShops,
		},
	})
}

// GetPendingShops - Mendapatkan semua toko yang menunggu approval
func GetPendingShops(c *fiber.Ctx) error {
	var shops []models.Shop
	if err := config.DB.Preload("Owner").Where("status = ?", "pending").Order("created_at desc").Find(&shops).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data pengajuan toko"})
	}

	return c.JSON(fiber.Map{
		"message": "Daftar pengajuan toko",
		"data":    shops,
	})
}

// ApproveShop - Menyetujui pengajuan toko
func ApproveShop(c *fiber.Ctx) error {
	shopID := c.Params("id")

	var shop models.Shop
	if err := config.DB.First(&shop, shopID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	if shop.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"message": "Toko ini tidak dalam status pending"})
	}

	tx := config.DB.Begin()

	// Update shop status
	now := time.Now()
	shop.Status = "approved"
	shop.Badge = "Reguler"
	shop.ApprovedAt = &now

	if err := tx.Save(&shop).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyetujui toko"})
	}

	// Update user role jadi seller
	var user models.User
	if err := tx.First(&user, shop.UserID).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"message": "User toko tidak ditemukan"})
	}

	user.Role = "seller"
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate role user"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message": "Toko berhasil disetujui! User sekarang adalah Penjual.",
		"shop":    shop,
		"user":    user,
	})
}

// RejectShop - Menolak pengajuan toko dengan cooldown 1 bulan
func RejectShop(c *fiber.Ctx) error {
	shopID := c.Params("id")

	var shop models.Shop
	if err := config.DB.First(&shop, shopID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	if shop.Status != "pending" {
		return c.Status(400).JSON(fiber.Map{"message": "Toko ini tidak dalam status pending"})
	}

	tx := config.DB.Begin()

	// Update shop status jadi rejected dengan tanggal penolakan
	now := time.Now()
	shop.Status = "rejected"
	shop.LastRejectionDate = &now

	if err := tx.Save(&shop).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menolak toko"})
	}

	// User tetap jadi buyer (tidak diupdate)

	tx.Commit()

	// Hitung tanggal bisa daftar lagi (1 bulan dari penolakan)
	canReapplyAt := now.AddDate(0, 1, 0)

	return c.JSON(fiber.Map{
		"message": "Pengajuan toko ditolak. User bisa mengajukan lagi setelah 1 bulan.",
		"shop":    shop,
		"can_reapply_at": canReapplyAt.Format("02 Jan 2006"),
	})
}

// GetAllShops - Mendapatkan semua toko (untuk manajemen shop)
func GetAllShops(c *fiber.Ctx) error {
	var shops []models.Shop
	if err := config.DB.Preload("Owner").Order("created_at desc").Find(&shops).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data toko"})
	}

	return c.JSON(fiber.Map{
		"message": "Data semua toko berhasil diambil",
		"data":    shops,
	})
}

// UpdateShopBadge - Update badge toko (Admin)
func UpdateShopBadge(c *fiber.Ctx) error {
	shopID := c.Params("id")

	var req struct {
		Badge string `json:"badge"` // "Reguler", "Terpercaya", "Resmi"
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Badge == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Badge wajib diisi"})
	}

	// Validasi badge
	validBadges := map[string]bool{
		"Reguler":      true,
		"Terpercaya":   true,
		"Resmi":        true,
	}

	if !validBadges[req.Badge] {
		return c.Status(400).JSON(fiber.Map{"message": "Badge harus Reguler, Terpercaya, atau Resmi"})
	}

	var shop models.Shop
	if err := config.DB.First(&shop, shopID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	shop.Badge = req.Badge
	if err := config.DB.Save(&shop).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate badge toko"})
	}

	return c.JSON(fiber.Map{
		"message": "Badge toko berhasil diupdate",
		"shop":    shop,
	})
}

// DeleteShop - Hapus toko (Admin)
func DeleteShop(c *fiber.Ctx) error {
	shopID := c.Params("id")

	var shop models.Shop
	if err := config.DB.First(&shop, shopID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Toko tidak ditemukan"})
	}

	tx := config.DB.Begin()

	// Hapus semua produk di toko ini
	if err := tx.Where("shop_id = ?", shopID).Delete(&models.Product{}).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menghapus produk toko"})
	}

	// Hapus shop
	if err := tx.Delete(&shop).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menghapus toko"})
	}

	// Kembalikan role user jadi buyer
	var user models.User
	if err := tx.First(&user, shop.UserID).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"message": "User toko tidak ditemukan"})
	}

	user.Role = "buyer"
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate role user"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message": "Toko berhasil dihapus. User kembali menjadi pembeli.",
		"shop":    shop,
	})
}

// CreateWarehouseByAdmin - Admin membuat gudang baru dan assign warehouse staff
func CreateWarehouseByAdmin(c *fiber.Ctx) error {
	var req struct {
		Name      string `json:"name"`
		Code      string `json:"code"`
		Address   string `json:"address"`
		StaffID   uint   `json:"staff_id"` // User ID warehouse staff (opsional)
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Code == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama dan kode gudang wajib diisi"})
	}

	// Cek apakah kode gudang sudah digunakan
	var codeExists models.Warehouse
	if err := config.DB.Where("code = ?", req.Code).First(&codeExists).Error; err == nil {
		return c.Status(400).JSON(fiber.Map{"message": "Kode gudang sudah digunakan"})
	}

	tx := config.DB.Begin()

	// Jika staff_id diisi, validasi user adalah warehouse_staff atau buat user baru
	var ownerID uint = 0
	if req.StaffID > 0 {
		var staff models.User
		if err := tx.Where("id = ?", req.StaffID).First(&staff).Error; err != nil {
			tx.Rollback()
			return c.Status(404).JSON(fiber.Map{"message": "User staff tidak ditemukan"})
		}

		if staff.Role != "warehouse_staff" {
			// Update role jadi warehouse_staff
			staff.Role = "warehouse_staff"
			if err := tx.Save(&staff).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate role user"})
			}
		}

		ownerID = staff.ID
	} else {
		// Jika tidak ada staff, buat user baru dengan role warehouse_staff
		// Tapi ini butuh email dan nama, jadi kita return error minta staff_id
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{
			"message": "Staff ID wajib diisi. Admin harus menambahkan warehouse staff terlebih dahulu.",
		})
	}

	// Buat warehouse
	warehouse := models.Warehouse{
		Name:    req.Name,
		Code:    req.Code,
		Address: req.Address,
		OwnerID: ownerID,
	}

	if err := tx.Create(&warehouse).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat gudang"})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message": "Gudang berhasil dibuat dan staff ditugaskan",
		"warehouse": warehouse,
	})
}

// GetAllWarehousesWithStaff - Mendapatkan semua gudang beserta staff-nya
func GetAllWarehousesWithStaff(c *fiber.Ctx) error {
	var warehouses []models.Warehouse
	if err := config.DB.Preload("Owner").Order("created_at desc").Find(&warehouses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Data gudang berhasil diambil",
		"data":    warehouses,
	})
}

// AddWarehouseStaff - Menambahkan warehouse staff baru dan assign ke gudang
func AddWarehouseStaff(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		WarehouseID uint   `json:"warehouse_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama, email, dan password wajib diisi"})
	}

	tx := config.DB.Begin()

	// Cek apakah email sudah terdaftar
	var existingUser models.User
	if err := tx.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"message": "Email sudah terdaftar"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal memproses password"})
	}

	// Buat user baru dengan role warehouse_staff
	staff := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "warehouse_staff",
	}

	if err := tx.Create(&staff).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat user staff"})
	}

	// Jika warehouse_id diisi, update warehouse owner
	if req.WarehouseID > 0 {
		var warehouse models.Warehouse
		if err := tx.First(&warehouse, req.WarehouseID).Error; err != nil {
			tx.Rollback()
			return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
		}

		warehouse.OwnerID = staff.ID
		if err := tx.Save(&warehouse).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan staff ke gudang"})
		}
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message": "Warehouse staff berhasil ditambahkan",
		"staff":   fiber.Map{
			"id":    staff.ID,
			"name":  staff.Name,
			"email": staff.Email,
			"role":  staff.Role,
		},
	})
}

// CreateDeliveryHubByAdmin - Admin membuat delivery hub baru
func CreateDeliveryHubByAdmin(c *fiber.Ctx) error {
	var req struct {
		Name       string `json:"name"`
		Code       string `json:"code"`
		Address    string `json:"address"`
		CourierID  uint   `json:"courier_id"` // Opsional
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

	tx := config.DB.Begin()

	hub := models.DeliveryHub{
		Name:    req.Name,
		Code:    req.Code,
		Address: req.Address,
	}

	// Jika courier_id diisi, validasi dan assign
	if req.CourierID > 0 {
		var courier models.User
		if err := tx.Where("id = ? AND role = ?", req.CourierID, "courier").First(&courier).Error; err != nil {
			tx.Rollback()
			return c.Status(404).JSON(fiber.Map{"message": "User kurir tidak ditemukan"})
		}

		hub.AssignedCourierID = &req.CourierID
	}

	if err := tx.Create(&hub).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat delivery hub"})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message": "Delivery hub berhasil dibuat",
		"hub":     hub,
	})
}

// AddCourierByAdmin - Menambahkan courier baru dan assign ke hub
func AddCourierByAdmin(c *fiber.Ctx) error {
	var req struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Password string `json:"password"`
		HubID   uint   `json:"hub_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama, email, dan password wajib diisi"})
	}

	tx := config.DB.Begin()

	// Cek apakah email sudah terdaftar
	var existingUser models.User
	if err := tx.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"message": "Email sudah terdaftar"})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal memproses password"})
	}

	// Buat user baru dengan role courier
	courier := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     "courier",
	}

	if err := tx.Create(&courier).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat user kurir"})
	}

	// Jika hub_id diisi, assign courier ke hub
	if req.HubID > 0 {
		var hub models.DeliveryHub
		if err := tx.First(&hub, req.HubID).Error; err != nil {
			tx.Rollback()
			return c.Status(404).JSON(fiber.Map{"message": "Delivery hub tidak ditemukan"})
		}

		hub.AssignedCourierID = &courier.ID
		if err := tx.Save(&hub).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan kurir ke hub"})
		}
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message": "Kurir berhasil ditambahkan",
		"courier": fiber.Map{
			"id":    courier.ID,
			"name":  courier.Name,
			"email": courier.Email,
			"role":  courier.Role,
		},
	})
}

// GetAllCouriersWithHub - Mendapatkan semua kurir beserta hub mereka
func GetAllCouriersWithHub(c *fiber.Ctx) error {
	var couriers []models.User
	if err := config.DB.Where("role = ?", "courier").Order("created_at desc").Find(&couriers).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data kurir"})
	}

	type CourierWithHub struct {
		models.User
		HubName string `json:"hub_name"`
		HubCode string `json:"hub_code"`
	}

	var result []CourierWithHub
	for _, courier := range couriers {
		cwh := CourierWithHub{User: courier}

		var hub models.DeliveryHub
		if err := config.DB.Where("assigned_courier_id = ?", courier.ID).First(&hub).Error; err == nil {
			cwh.HubName = hub.Name
			cwh.HubCode = hub.Code
		} else {
			cwh.HubName = "Belum ditugaskan"
			cwh.HubCode = "-"
		}

		result = append(result, cwh)
	}

	return c.JSON(fiber.Map{
		"message": "Data kurir berhasil diambil",
		"data":    result,
	})
}
