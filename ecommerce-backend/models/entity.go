package models

import "time"

type User struct {
	ID          uint      `gorm:"primaryKey"`
	Name        string    `json:"name"`
	Email       string    `gorm:"unique" json:"email"`
	Password    string    `json:"-"`
	Role        string    `gorm:"type:enum('admin', 'seller', 'buyer', 'courier', 'warehouse_staff');default:'buyer'" json:"role"`
	Phone       string    `json:"phone"`
	Address     string    `json:"address"`
	DateOfBirth string    `json:"date_of_birth"`
	WarehouseID *uint     `json:"warehouse_id,omitempty"` // ID Gudang tempat staf bekerja
	CreatedAt   time.Time `json:"created_at"`
}

type OTPRegistry struct {
	Email     string    `gorm:"primaryKey"`
	OTP       string
	OTPExpiry time.Time
}

type Shop struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	UserID            uint       `json:"user_id"`
	Owner             User       `gorm:"foreignKey:UserID" json:"owner"`
	ShopName          string     `json:"shop_name"`
	Description       string     `json:"description"`
	Province          string     `json:"province"`
	Address           string     `json:"address"`
	Badge             string     `gorm:"type:enum('Reguler', 'Terpercaya', 'Resmi');default:'Reguler'" json:"badge"`
	Status            string     `gorm:"type:enum('pending', 'approved', 'rejected');default:'pending'" json:"status"`
	LastRejectionDate *time.Time `json:"last_rejection_date"` // Tanggal terakhir ditolak (untuk cooldown 1 bulan)
	ApprovedAt        *time.Time `json:"approved_at"`         // Tanggal disetujui
	CreatedAt         time.Time  `json:"created_at"`
}

type Product struct {
	ID          uint      `gorm:"primaryKey"`
	ShopID      uint      `json:"shop_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Stock       int       `json:"stock"`
	CreatedAt   time.Time `json:"created_at"`
	Image string `json:"image"`
}

// Fitur Tambahan: Keranjang Belanja
type Cart struct {
	ID        uint      `gorm:"primaryKey"`
	BuyerID   uint      `json:"buyer_id"`
	ProductID uint      `json:"product_id"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
}