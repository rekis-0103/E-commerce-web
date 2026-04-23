package models

import "time"

// Order mewakili satu nota pesanan dari satu pembeli ke satu toko
type Order struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	BuyerID         uint        `json:"buyer_id"`
	ShopID          uint        `json:"shop_id"`
	TotalAmount     float64     `json:"total_amount"`
	Status          string      `gorm:"default:'Menunggu Pembayaran'" json:"status"` // Menunggu Pembayaran, Diproses, Dikirim, Selesai
	ShippingAddress string      `json:"shipping_address"`
	PaymentMethod   string      `gorm:"size:50;default:'transfer_manual'" json:"payment_method"` // transfer_manual, akane_pay
	PaymentProof    string      `json:"payment_proof"` // URL gambar bukti transfer
	CreatedAt       time.Time   `json:"created_at"`

	// Relasi ke tabel OrderItem (1 Order punya banyak Item)
	Items []OrderItem `gorm:"foreignKey:OrderID" json:"items"`
}

// OrderItem mewakili barang spesifik yang dibeli di dalam sebuah nota
type OrderItem struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderID   uint    `json:"order_id"`
	ProductID uint    `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"` // PENTING: Kita simpan harga saat ini, agar jika penjual mengubah harga besok, nota lama tidak ikut berubah
}