package admin

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
		Name          string `json:"name"`
		Code          string `json:"code"`
		Address       string `json:"address"`
		Province      string `json:"province"`
		City          string `json:"city"`
		District      string `json:"district"`
		Village       string `json:"village"`
		PostalCode    string `json:"postal_code"`
		WarehouseType string `json:"warehouse_type"`
		StaffID       uint   `json:"staff_id"` // Opsional
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Code == "" || req.Province == "" || req.WarehouseType == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Nama, kode, provinsi, dan tipe gudang wajib diisi"})
	}

	tx := config.DB.Begin()

	// Cek kode gudang
	var codeExists models.Warehouse
	if err := tx.Where("code = ?", req.Code).First(&codeExists).Error; err == nil {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"message": "Kode gudang sudah digunakan"})
	}

	warehouse := models.Warehouse{
		Name:          req.Name,
		Code:          req.Code,
		Address:       req.Address,
		Province:      req.Province,
		City:          req.City,
		District:      req.District,
		Village:       req.Village,
		PostalCode:    req.PostalCode,
		WarehouseType: req.WarehouseType,
		OwnerID:       req.StaffID,
	}

	if err := tx.Create(&warehouse).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat gudang"})
	}

	// Jika staff ditugaskan, update role dan warehouse_id user tersebut
	if req.StaffID > 0 {
		if err := tx.Model(&models.User{}).Where("id = ?", req.StaffID).Updates(map[string]interface{}{
			"role":         "warehouse_staff",
			"warehouse_id": warehouse.ID,
		}).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan staff"})
		}
	}

	tx.Commit()
	return c.Status(201).JSON(fiber.Map{"message": "Gudang berhasil dibuat", "data": warehouse})
}

// UpdateWarehouseByAdmin - Update data gudang
func UpdateWarehouseByAdmin(c *fiber.Ctx) error {
	id := c.Params("id")
	var req struct {
		Name          string `json:"name"`
		Address       string `json:"address"`
		WarehouseType string `json:"warehouse_type"`
		StaffID       uint   `json:"staff_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	var warehouse models.Warehouse
	if err := config.DB.First(&warehouse, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	tx := config.DB.Begin()

	// Jika manager berubah, update user terkait
	if req.StaffID != warehouse.OwnerID {
		// Lepas manager lama jika ada
		if warehouse.OwnerID > 0 {
			tx.Model(&models.User{}).Where("id = ?", warehouse.OwnerID).Update("warehouse_id", nil)
		}
		// Set manager baru
		if req.StaffID > 0 {
			tx.Model(&models.User{}).Where("id = ?", req.StaffID).Updates(map[string]interface{}{
				"role":         "warehouse_staff",
				"warehouse_id": warehouse.ID,
			})
		}
	}

	warehouse.Name = req.Name
	warehouse.Address = req.Address
	warehouse.WarehouseType = req.WarehouseType
	warehouse.OwnerID = req.StaffID

	if err := tx.Save(&warehouse).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal update gudang"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Gudang berhasil diupdate", "data": warehouse})
}

// DeleteWarehouseByAdmin - Hapus gudang (Kurir & Staff akan di-unassign otomatis)
func DeleteWarehouseByAdmin(c *fiber.Ctx) error {
	id := c.Params("id")
	tx := config.DB.Begin()

	// Unassign semua user (kurir & staff) dari gudang ini
	if err := tx.Model(&models.User{}).Where("warehouse_id = ?", id).Update("warehouse_id", nil).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal melepaskan staff/kurir"})
	}

	if err := tx.Delete(&models.Warehouse{}, id).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menghapus gudang"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Gudang berhasil dihapus"})
}

// UnassignCourierFromWarehouse - Melepas kurir dari gudang tanpa menghapus akun
func UnassignCourierFromWarehouse(c *fiber.Ctx) error {
	courierID := c.Params("id")
	
	if err := config.DB.Model(&models.User{}).Where("id = ? AND role = ?", courierID, "courier").Update("warehouse_id", nil).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal melepas kurir"})
	}

	return c.JSON(fiber.Map{"message": "Kurir berhasil dilepas dari gudang"})
}

// GetAllWarehousesWithStaff - Mendapatkan semua gudang beserta staff-nya
func GetAllWarehousesWithStaff(c *fiber.Ctx) error {
	var warehouses []models.Warehouse
	if err := config.DB.Preload("Owner").Preload("Staff").Order("created_at desc").Find(&warehouses).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Data gudang berhasil diambil",
		"data":    warehouses,
	})
}

// GetAllCouriersWithWarehouse - Mendapatkan semua kurir beserta data gudangnya
func GetAllCouriersWithWarehouse(c *fiber.Ctx) error {
	var couriers []models.User
	if err := config.DB.Where("role = ?", "courier").Find(&couriers).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data kurir"})
	}

	type CourierResponse struct {
		ID            uint   `json:"id"`
		Name          string `json:"name"`
		Email         string `json:"email"`
		WarehouseID   uint   `json:"warehouse_id"`
		WarehouseName string `json:"warehouse_name"`
		WarehouseCode string `json:"warehouse_code"`
	}

	var response []CourierResponse
	for _, courier := range couriers {
		warehouseName := "Belum ditugaskan"
		warehouseCode := ""
		var warehouseID uint = 0

		if courier.WarehouseID != nil && *courier.WarehouseID != 0 {
			var w models.Warehouse
			if err := config.DB.First(&w, *courier.WarehouseID).Error; err == nil {
				warehouseName = w.Name
				warehouseCode = w.Code
				warehouseID = w.ID
			}
		}

		response = append(response, CourierResponse{
			ID:            courier.ID,
			Name:          courier.Name,
			Email:         courier.Email,
			WarehouseID:   warehouseID,
			WarehouseName: warehouseName,
			WarehouseCode: warehouseCode,
		})
	}

	return c.JSON(fiber.Map{
		"message": "Data kurir berhasil diambil",
		"data":    response,
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

// AddCourierByAdmin - Menambahkan courier baru dan assign ke gudang pengiriman
func AddCourierByAdmin(c *fiber.Ctx) error {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		WarehouseID uint   `json:"warehouse_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Email == "" || req.Password == "" || req.WarehouseID == 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Semua field wajib diisi"})
	}

	// Validasi gudang harus bertipe 'pengiriman'
	var warehouse models.Warehouse
	if err := config.DB.First(&warehouse, req.WarehouseID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	if warehouse.WarehouseType != "pengiriman" {
		return c.Status(400).JSON(fiber.Map{"message": "Kurir hanya dapat ditugaskan ke gudang tipe 'pengiriman'"})
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
		Name:        req.Name,
		Email:       req.Email,
		Password:    string(hashedPassword),
		Role:        "courier",
		WarehouseID: &req.WarehouseID,
	}

	if err := tx.Create(&courier).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat user kurir"})
	}

	tx.Commit()

	return c.Status(201).JSON(fiber.Map{
		"message": "Kurir berhasil ditambahkan ke gudang " + warehouse.Name,
		"courier": fiber.Map{
			"id":    courier.ID,
			"name":  courier.Name,
			"email": courier.Email,
			"role":  courier.Role,
		},
	})
}

// GetAvailableCouriers - Mendapatkan daftar kurir yang belum ditugaskan ke gudang manapun
func GetAvailableCouriers(c *fiber.Ctx) error {
	var couriers []models.User
	if err := config.DB.Where("role = ? AND (warehouse_id IS NULL OR warehouse_id = 0)", "courier").Find(&couriers).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data kurir"})
	}

	return c.JSON(fiber.Map{
		"message": "Data kurir tersedia berhasil diambil",
		"data":    couriers,
	})
}

// AssignCourierToWarehouse - Menugaskan kurir yang sudah ada ke gudang tertentu
func AssignCourierToWarehouse(c *fiber.Ctx) error {
	var req struct {
		CourierID   uint `json:"courier_id"`
		WarehouseID uint `json:"warehouse_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.CourierID == 0 || req.WarehouseID == 0 {
		return c.Status(400).JSON(fiber.Map{"message": "Courier ID dan Warehouse ID wajib diisi"})
	}

	// Validasi gudang harus bertipe 'pengiriman'
	var warehouse models.Warehouse
	if err := config.DB.First(&warehouse, req.WarehouseID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Gudang tidak ditemukan"})
	}

	if warehouse.WarehouseType != "pengiriman" {
		return c.Status(400).JSON(fiber.Map{"message": "Hanya dapat menugaskan kurir ke gudang tipe 'pengiriman'"})
	}

	// Update WarehouseID pada kurir
	if err := config.DB.Model(&models.User{}).Where("id = ? AND role = ?", req.CourierID, "courier").Update("warehouse_id", req.WarehouseID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menugaskan kurir ke gudang"})
	}

	return c.JSON(fiber.Map{
		"message": "Kurir berhasil ditugaskan ke gudang " + warehouse.Name,
	})
}

// ManageUsers - Mendapatkan list user dengan filter role dan search
func ManageUsers(c *fiber.Ctx) error {
	role := c.Query("role") // seller, warehouse_staff, courier
	search := c.Query("search")

	var users []models.User
	query := config.DB.Model(&models.User{})

	if role != "" {
		query = query.Where("role = ?", role)
	} else {
		// Default: ambil semua kecuali buyer dan admin
		query = query.Where("role IN ?", []string{"seller", "warehouse_staff", "courier"})
	}

	if search != "" {
		query = query.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("created_at desc").Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengambil data user"})
	}

	return c.JSON(fiber.Map{
		"message": "Daftar user berhasil diambil",
		"data":    users,
	})
}

// CreateUserByAdminGeneral - Membuat user baru oleh admin
func CreateUserByAdminGeneral(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	if req.Name == "" || req.Email == "" || req.Password == "" || req.Role == "" {
		return c.Status(400).JSON(fiber.Map{"message": "Semua field wajib diisi"})
	}

	// Hash password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal membuat user (Email mungkin sudah terdaftar)"})
	}

	return c.Status(201).JSON(fiber.Map{
		"message": "User berhasil dibuat",
		"data":    user,
	})
}

// UpdateUserByAdmin - Update data user oleh admin
func UpdateUserByAdmin(c *fiber.Ctx) error {
	userID := c.Params("id")
	var req struct {
		Name  string `json:"name"`
		Role  string `json:"role"`
		Phone string `json:"phone"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	user.Name = req.Name
	user.Role = req.Role
	user.Phone = req.Phone

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mengupdate user"})
	}

	return c.JSON(fiber.Map{
		"message": "User berhasil diupdate",
		"data":    user,
	})
}

// DeleteUserByAdmin - Hapus user oleh admin
func DeleteUserByAdmin(c *fiber.Ctx) error {
	userID := c.Params("id")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "User tidak ditemukan"})
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menghapus user"})
	}

	return c.JSON(fiber.Map{
		"message": "User berhasil dihapus",
	})
}

