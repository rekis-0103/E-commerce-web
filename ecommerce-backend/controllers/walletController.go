package controllers

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"
	"fmt"
	"math/rand"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// Helper untuk mengambil User ID dari context secara aman
func getAuthenticatedUserID(c *fiber.Ctx) uint {
	val := c.Locals("user_id")
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case uint:
		return v
	case float64:
		return uint(v)
	case int:
		return uint(v)
	default:
		return 0
	}
}

// Helper untuk generate Transaction ID
func generateTransactionID(prefix string) string {
	return fmt.Sprintf("%s-%d%d", prefix, time.Now().Unix(), rand.Intn(1000))
}

// GetWallet - Mengambil data dompet user
func GetWallet(c *fiber.Ctx) error {
	userID := getAuthenticatedUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"message": "Sesi tidak valid"})
	}

	var wallet models.Wallet
	if err := config.DB.Where("user_id = ?", userID).First(&wallet).Error; err != nil {
		wallet = models.Wallet{UserID: userID, Balance: 0, IsActive: false}
		config.DB.Create(&wallet)
	}

	var transactions []models.WalletTransaction
	config.DB.Where("wallet_id = ?", wallet.ID).Order("created_at desc").Limit(10).Find(&transactions)

	return c.Status(200).JSON(fiber.Map{
		"wallet":       wallet,
		"transactions": transactions,
	})
}

// SetupPIN - Mengaktifkan dompet dengan PIN
func SetupPIN(c *fiber.Ctx) error {
	userID := getAuthenticatedUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"message": "Sesi tidak valid"})
	}

	var input struct {
		PIN string `json:"pin"`
	}

	if err := c.BodyParser(&input); err != nil || len(input.PIN) != 6 {
		return c.Status(400).JSON(fiber.Map{"message": "PIN harus 6 digit angka"})
	}

	hashedPIN, _ := bcrypt.GenerateFromPassword([]byte(input.PIN), bcrypt.DefaultCost)

	if err := config.DB.Model(&models.Wallet{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"pin":       string(hashedPIN),
		"is_active": true,
	}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menyimpan PIN"})
	}

	return c.Status(200).JSON(fiber.Map{"message": "Akane Pay berhasil diaktifkan!"})
}

// TopUp - Isi saldo
func TopUp(c *fiber.Ctx) error {
	userID := getAuthenticatedUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"message": "Sesi tidak valid"})
	}

	var input struct {
		Amount float64 `json:"amount"`
	}

	if err := c.BodyParser(&input); err != nil || input.Amount < 10000 {
		return c.Status(400).JSON(fiber.Map{"message": "Minimal top up Rp 10.000"})
	}

	var wallet models.Wallet
	config.DB.Where("user_id = ?", userID).First(&wallet)

	tax := 1500.0 
	totalAmount := input.Amount

	tx := config.DB.Begin()

	wallet.Balance += totalAmount
	if err := tx.Save(&wallet).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal top up"})
	}

	transaction := models.WalletTransaction{
		WalletID:      wallet.ID,
		Type:          "topup",
		Amount:        totalAmount,
		Fee:           tax,
		Description:   "Top Up Akane Pay",
		TransactionID: generateTransactionID("TOP"),
		Status:        "success",
	}

	if err := tx.Create(&transaction).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"message": "Gagal mencatat transaksi"})
	}

	tx.Commit()
	return c.Status(200).JSON(fiber.Map{"message": "Top up berhasil!", "balance": wallet.Balance})
}

// Withdrawal - Tarik saldo ke rekening (untuk Seller)
func Withdrawal(c *fiber.Ctx) error {
	userID := getAuthenticatedUserID(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"message": "Sesi tidak valid"})
	}

	var input struct {
		Amount float64 `json:"amount"`
		PIN    string  `json:"pin"`
	}

	if err := c.BodyParser(&input); err != nil || input.Amount < 50000 {
		return c.Status(400).JSON(fiber.Map{"message": "Minimal penarikan Rp 50.000"})
	}

	var wallet models.Wallet
	config.DB.Where("user_id = ?", userID).First(&wallet)

	if err := bcrypt.CompareHashAndPassword([]byte(wallet.PIN), []byte(input.PIN)); err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "PIN Akane Pay salah"})
	}

	tax := 5000.0 
	if wallet.Balance < (input.Amount + tax) {
		return c.Status(400).JSON(fiber.Map{"message": "Saldo tidak cukup (Termasuk biaya admin Rp 5.000)"})
	}

	tx := config.DB.Begin()
	wallet.Balance -= (input.Amount + tax)
	tx.Save(&wallet)

	transaction := models.WalletTransaction{
		WalletID:      wallet.ID,
		Type:          "withdrawal",
		Amount:        input.Amount,
		Fee:           tax,
		Description:   "Penarikan Dana ke Rekening",
		TransactionID: generateTransactionID("WDR"),
		Status:        "success",
	}
	tx.Create(&transaction)

	tx.Commit()
	return c.Status(200).JSON(fiber.Map{"message": "Permintaan penarikan dana berhasil diproses!", "balance": wallet.Balance})
}

// PayWithAkanePay - Membayar pesanan menggunakan saldo
func PayWithAkanePay(c *fiber.Ctx) error {
	userID := getAuthenticatedUserID(c)
	var input struct {
		OrderID uint   `json:"order_id"`
		PIN     string `json:"pin"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Input tidak valid"})
	}

	var wallet models.Wallet
	config.DB.Where("user_id = ?", userID).First(&wallet)

	if err := bcrypt.CompareHashAndPassword([]byte(wallet.PIN), []byte(input.PIN)); err != nil {
		return c.Status(401).JSON(fiber.Map{"message": "PIN Akane Pay salah"})
	}

	var order models.Order
	if err := config.DB.First(&order, input.OrderID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"message": "Pesanan tidak ditemukan"})
	}

	if order.BuyerID != userID {
		return c.Status(403).JSON(fiber.Map{"message": "Bukan pesanan Anda"})
	}

	if order.Status != "Menunggu Pembayaran" {
		return c.Status(400).JSON(fiber.Map{"message": "Pesanan sudah dibayar atau dibatalkan"})
	}

	if wallet.Balance < order.TotalAmount {
		return c.Status(400).JSON(fiber.Map{"message": "Saldo Akane Pay tidak cukup"})
	}

	tx := config.DB.Begin()
	wallet.Balance -= order.TotalAmount
	tx.Save(&wallet)

	order.Status = "Diproses"
	order.PaymentMethod = "akane_pay"
	tx.Save(&order)

	transaction := models.WalletTransaction{
		WalletID:      wallet.ID,
		Type:          "payment",
		Amount:        order.TotalAmount,
		Description:   fmt.Sprintf("Pembayaran Pesanan #%d", order.ID),
		TransactionID: generateTransactionID("PAY"),
		Status:        "success",
	}
	tx.Create(&transaction)

	tx.Commit()
	return c.Status(200).JSON(fiber.Map{"message": "Pembayaran Berhasil! Pesanan sedang diproses.", "balance": wallet.Balance})
}
