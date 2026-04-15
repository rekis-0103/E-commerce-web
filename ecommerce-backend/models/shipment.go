package models

import "time"

// Shipment mewakili data pengiriman untuk satu order
type Shipment struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	OrderID         uint      `gorm:"uniqueIndex" json:"order_id"`
	TrackingNumber  string    `gorm:"uniqueIndex;size:50" json:"tracking_number"` // Nomor resi unik
	CourierName     string    `json:"courier_name"`                               // Nama kurir/jasa ekspedisi
	CurrentStatus   string    `gorm:"default:'Dikirim'" json:"current_status"`    // Status terkini: Dikirim, Dalam Perjalanan, Sampai
	CurrentLocation string    `json:"current_location"`                           // Lokasi terakhir paket
	ShippingAddress string    `json:"shipping_address"`                           // Alamat tujuan (salinan dari order)
	EstimatedDays   int       `json:"estimated_days"`                             // Estimasi hari sampai
	DeliveredAt     *time.Time `json:"delivered_at"`                              // Waktu pengiriman diterima (nullable)
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relasi
	Order Order      `json:"order,omitempty"`
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
