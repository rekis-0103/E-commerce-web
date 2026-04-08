package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Fungsi untuk melindungi rute yang wajib login
func Protected(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")

	// 1. Cek apakah token ada
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"message": "Akses ditolak. Token tidak ditemukan."})
	}

	// 2. Pastikan formatnya "Bearer <token>"
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(401).JSON(fiber.Map{"message": "Format token salah."})
	}

	tokenString := parts[1]
	secret := os.Getenv("JWT_SECRET")

	// 3. Validasi keaslian token
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"message": "Token tidak valid atau kedaluwarsa."})
	}

	// 4. Jika valid, simpan ID dan Role ke dalam request untuk dipakai di controller
	claims := token.Claims.(jwt.MapClaims)
	c.Locals("user_id", claims["id"])
	c.Locals("role", claims["role"])

	return c.Next() // Izinkan lewat
}

// Fungsi untuk membatasi akses khusus Admin
func IsAdmin(c *fiber.Ctx) error {
	role := c.Locals("role")
	if role != "admin" {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Anda bukan Admin!"})
	}
	return c.Next() // Jika admin, izinkan lewat
}

// Fungsi untuk membatasi akses khusus Penjual (Seller)
func IsSeller(c *fiber.Ctx) error {
	role := c.Locals("role")
	if role != "seller" {
		return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak. Anda bukan Penjual!"})
	}
	return c.Next()
}