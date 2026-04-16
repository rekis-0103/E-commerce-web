package models

import "time"

// Warehouse mewakili gudang fisik yang dikelola oleh seorang warehouse staff
type Warehouse struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`               // Nama gudang (contoh: "Gudang Jakarta Utara")
	Code        string    `gorm:"uniqueIndex;size:20;not null" json:"code"`    // Kode unik gudang (contoh: "JKT-001")
	Address     string    `json:"address"`                                      // Alamat lengkap gudang
	OwnerID     uint      `gorm:"not null" json:"owner_id"`                     // User ID dari warehouse staff
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relasi
	Owner     User        `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Movements []WarehouseMovement `gorm:"foreignKey:WarehouseID" json:"movements,omitempty"`
}

// WarehouseMovement mewakili pergerakan barang masuk/keluar di gudang
type WarehouseMovement struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	WarehouseID     uint       `gorm:"not null" json:"warehouse_id"`
	TrackingNumber  string     `gorm:"size:50;not null" json:"tracking_number"` // Nomor resi yang diproses
	MovementType    string     `gorm:"type:enum('masuk','keluar');not null" json:"movement_type"` // 'masuk' atau 'keluar'
	Status          string     `gorm:"size:50" json:"status"`                   // Status saat ini
	Notes           string     `json:"notes"`                                   // Catatan tambahan
	ProcessedBy     uint       `gorm:"not null" json:"processed_by"`            // User ID yang memproses
	ProcessedAt     time.Time  `gorm:"not null" json:"processed_at"`            // Waktu pemrosesan
	CreatedAt       time.Time  `json:"created_at"`

	// Relasi
	Warehouse Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse,omitempty"`
}

// Shipment mewakili data pengiriman untuk satu order
type Shipment struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	OrderID         uint       `gorm:"uniqueIndex" json:"order_id"`
	TrackingNumber  string     `gorm:"uniqueIndex;size:50" json:"tracking_number"` // Nomor resi unik
	CourierName     string     `json:"courier_name"`                               // Nama kurir/jasa ekspedisi
	CurrentStatus   string     `gorm:"default:'Dikirim'" json:"current_status"`    // Status terkini: Dikirim, Dalam Perjalanan, Sampai
	CurrentLocation string     `json:"current_location"`                           // Lokasi terakhir paket
	ShippingAddress string     `json:"shipping_address"`                           // Alamat tujuan (salinan dari order)
	EstimatedDays   int        `json:"estimated_days"`                             // Estimasi hari sampai
	DeliveredAt     *time.Time `json:"delivered_at"`                               // Waktu pengiriman diterima (nullable)
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relasi
	Order Order         `json:"order,omitempty"`
	Logs  []ShipmentLog `gorm:"foreignKey:ShipmentID" json:"logs,omitempty"`
}

// ShipmentLog menyimpan riwayat setiap perubahan status pengiriman
type ShipmentLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ShipmentID   uint      `json:"shipment_id"`
	Status       string    `json:"status"`           // Status saat log dibuat
	Location     string    `json:"location"`         // Lokasi saat log dibuat
	Notes        string    `json:"notes"`            // Catatan tambahan (opsional)
	UpdatedBy    uint      `json:"updated_by"`       // User ID yang mengupdate (kurir/gudang)
	UpdatedByRole string   `json:"updated_by_role"`  // Role user (courier, warehouse_staff)
	CreatedAt    time.Time `json:"created_at"`

	// Relasi
	Shipment Shipment `json:"shipment,omitempty"`
}

// DeliveryHub mewakili tempat pengumpulan paket untuk kurir sebelum distribusi
type DeliveryHub struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:100;not null" json:"name"`               // Nama hub (contoh: "Hub Jakarta Selatan")
	Code        string    `gorm:"uniqueIndex;size:20;not null" json:"code"`    // Kode unik hub (contoh: "HUB-JS-001")
	Address     string    `json:"address"`                                      // Alamat lengkap hub
	AssignedCourierID *uint `gorm:"" json:"assigned_courier_id"`                // ID kurir yang bertugas di hub ini (nullable)
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relasi
	AssignedCourier User `gorm:"foreignKey:AssignedCourierID" json:"assigned_courier,omitempty"`
	Assignments     []HubAssignment `gorm:"foreignKey:HubID" json:"assignments,omitempty"`
}

// HubAssignment mencatat penugasan paket ke delivery hub untuk kurir
type HubAssignment struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	HubID           uint       `gorm:"not null" json:"hub_id"`
	ShipmentID      uint       `gorm:"not null" json:"shipment_id"`
	TrackingNumber  string     `gorm:"size:50;not null" json:"tracking_number"` // Nomor resi yang ditugaskan
	Status          string     `gorm:"type:enum('menunggu','diambil','dikirim','selesai');default:'menunggu'" json:"status"` // Status di hub
	AssignedBy      uint       `json:"assigned_by"`                              // User ID yang menugaskan (admin/seller)
	AssignedAt      time.Time  `gorm:"not null" json:"assigned_at"`              // Waktu penugasan
	PickedUpBy      uint       `json:"picked_up_by"`                             // User ID kurir yang mengambil
	PickedUpAt      *time.Time `json:"picked_up_at"`                             // Waktu pengambilan
	DeliveredAt     *time.Time `json:"delivered_at"`                             // Waktu pengiriman selesai
	Notes           string     `json:"notes"`                                    // Catatan tambahan
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relasi
	Hub      DeliveryHub `gorm:"foreignKey:HubID" json:"hub,omitempty"`
	Shipment Shipment    `gorm:"foreignKey:ShipmentID" json:"shipment,omitempty"`
}
