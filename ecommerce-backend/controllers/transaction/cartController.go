package transaction

import (
	"ecommerce-backend/config"
	"ecommerce-backend/models"

	"github.com/gofiber/fiber/v2"
)

// Menambah barang ke keranjang
func AddToCart(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Menangkap ID produk dan jumlah (quantity) dari React
	var request struct {
		ProductID uint `json:"product_id"`
		Quantity  int  `json:"quantity"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Mengecek apakah barang ini sudah ada di keranjang user tersebut
	var cart models.Cart
	config.DB.Where("buyer_id = ? AND product_id = ?", userID, request.ProductID).First(&cart)

	if cart.ID != 0 {
		// Jika sudah ada, cukup tambahkan jumlahnya (quantity)
		cart.Quantity += request.Quantity
		config.DB.Save(&cart)
	} else {
		// Jika belum ada, buat entri keranjang baru
		cart = models.Cart{
			BuyerID:   userID,
			ProductID: request.ProductID,
			Quantity:  request.Quantity,
		}
		config.DB.Create(&cart)
	}

	return c.JSON(fiber.Map{"message": "Berhasil ditambahkan ke keranjang!"})
}

// Menampilkan isi keranjang milik user yang sedang login
func GetMyCart(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	// Kita menggabungkan (JOIN) tabel carts dengan products agar mendapat nama dan harga
	type CartResult struct {
		CartID    uint    `json:"cart_id"`
		ProductID uint    `json:"product_id"`
		Name      string  `json:"name"`
		Price     float64 `json:"price"`
		Quantity  int     `json:"quantity"`
		Total     float64 `json:"total"`
	}

	var results []CartResult

	config.DB.Table("carts").
		Select("carts.id as cart_id, products.id as product_id, products.name, products.price, carts.quantity, (products.price * carts.quantity) as total").
		Joins("left join products on products.id = carts.product_id").
		Where("carts.buyer_id = ?", userID).
		Scan(&results)

	return c.JSON(fiber.Map{
		"message": "Data keranjang berhasil diambil",
		"data":    results,
	})
}

// Update jumlah barang di keranjang (Tambah/Kurang)
func UpdateCartQuantity(c *fiber.Ctx) error {
	cartID := c.Params("id")
	var data struct {
		Quantity int `json:"quantity"`
	}

	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Data tidak valid"})
	}

	// Pastikan quantity tidak boleh kurang dari 1
	if data.Quantity < 1 {
		return c.Status(400).JSON(fiber.Map{"message": "Jumlah minimal adalah 1"})
	}

	if err := config.DB.Model(&models.Cart{}).Where("id = ?", cartID).Update("quantity", data.Quantity).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal memperbarui jumlah"})
	}

	return c.JSON(fiber.Map{"message": "Jumlah berhasil diperbarui"})
}

// Menghapus satu item dari keranjang
func DeleteCartItem(c *fiber.Ctx) error {
	cartID := c.Params("id")

	if err := config.DB.Delete(&models.Cart{}, cartID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Gagal menghapus item"})
	}

	return c.JSON(fiber.Map{"message": "Item berhasil dihapus"})
}