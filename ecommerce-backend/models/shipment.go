package models

import "time"

// Warehouse mewakili gudang fisik yang dikelola oleh seorang warehouse staff
type Warehouse struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:100;not null" json:"name"`               // Nama gudang
	Code          string    `gorm:"uniqueIndex;size:20;not null" json:"code"`    // Kode unik gudang
	Address       string    `json:"address"`                                      // Alamat lengkap
	Province      string    `gorm:"size:100;not null" json:"province"`           // Provinsi di Indonesia
	WarehouseType string    `gorm:"type:enum('sortir', 'pengiriman');not null;default:'pengiriman'" json:"warehouse_type"` // Tipe gudang
	OwnerID       uint      `gorm:"not null" json:"owner_id"`                     // Manager/Owner
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Relasi
	Owner     User        `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Staff     []User      `gorm:"foreignKey:WarehouseID" json:"staff,omitempty"`
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
	ID               uint       `gorm:"primaryKey" json:"id"`
	OrderID          uint       `gorm:"uniqueIndex" json:"order_id"`
	TrackingNumber   string     `gorm:"uniqueIndex;size:50" json:"tracking_number"`
	CourierName      string     `json:"courier_name"`
	CurrentStatus    string     `gorm:"default:'Dikirim'" json:"current_status"` // Dikirim, Dalam Perjalanan, Sampai, Menunggu Konfirmasi Diterima, Diterima
	CurrentLocation  string     `json:"current_location"`
	ShippingAddress  string     `json:"shipping_address"`
	EstimatedDays    int        `json:"estimated_days"`
	DeliveryPhotoURL string     `json:"delivery_photo_url"` // URL foto bukti pengiriman dari kurir
	DeliveredAt      *time.Time `json:"delivered_at"`
	ReceivedAt       *time.Time `json:"received_at"` // Waktu buyer konfirmasi paket diterima
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

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
	ID               uint       `gorm:"primaryKey" json:"id"`
	HubID            uint       `gorm:"not null" json:"hub_id"`
	ShipmentID       uint       `gorm:"not null" json:"shipment_id"`
	TrackingNumber   string     `gorm:"size:50;not null" json:"tracking_number"`
	Status           string     `gorm:"type:enum('menunggu','diambil','dikirim','menunggu_konfirmasi','selesai');default:'menunggu'" json:"status"`
	DeliveryPhotoURL string     `json:"delivery_photo_url"` // URL foto bukti pengiriman
	AssignedBy       uint       `json:"assigned_by"`
	AssignedAt       time.Time  `gorm:"not null" json:"assigned_at"`
	PickedUpBy       uint       `json:"picked_up_by"`
	PickedUpAt       *time.Time `json:"picked_up_at"`
	DeliveredAt      *time.Time `json:"delivered_at"`
	Notes            string     `json:"notes"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`

	// Relasi
	Hub      DeliveryHub `gorm:"foreignKey:HubID" json:"hub,omitempty"`
	Shipment Shipment    `gorm:"foreignKey:ShipmentID" json:"shipment,omitempty"`
}
