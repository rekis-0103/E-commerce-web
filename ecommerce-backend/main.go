package main

import (
	"log"
	"os"

	"ecommerce-backend/config"
	"ecommerce-backend/models" // Tambahkan ini
	"ecommerce-backend/routes" // Tambahkan ini

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors" // Tambahkan middleware CORS
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.ConnectDB()

	// (Opsional) Auto-migrate: Memastikan tabel dibuat jika belum ada
	config.DB.AutoMigrate(&models.User{}, &models.Shop{}, &models.Product{}, &models.Cart{})

	app := fiber.New()

	// Mengizinkan Frontend (React) mengakses Backend
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", 
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Panggil file routes
	routes.Setup(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	
	log.Printf("Server berjalan di http://localhost:%s", port)
	app.Listen(":" + port)
}