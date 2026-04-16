package main

import (
	"log"
	"os"

	"ecommerce-backend/config"
	"ecommerce-backend/models" 
	"ecommerce-backend/routes" 

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors" 
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	config.ConnectDB()

	config.DB.AutoMigrate(
		&models.User{},
		&models.Shop{},
		&models.Product{},
		&models.Cart{},
		&models.Order{},
		&models.OrderItem{},
		&models.OTPRegistry{},
		&models.Shipment{},
		&models.ShipmentLog{},
		&models.Warehouse{},
		&models.WarehouseMovement{},
		&models.DeliveryHub{},
		&models.HubAssignment{},
	)

	app := fiber.New()

	// Middleware CORS manual untuk SEMUA request (termasuk static files)
	app.Use(func(c *fiber.Ctx) error {
		c.Set("Access-Control-Allow-Origin", "*")
		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		
		// Handle preflight requests
		if c.Method() == "OPTIONS" {
			return c.SendStatus(204)
		}
		
		return c.Next()
	})

	// Mengizinkan Frontend (React) mengakses Backend
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Serve static files
	app.Static("/uploads", "./uploads", fiber.Static{
		Compress: true,
		MaxAge:   3600,
	})

	// Panggil file routes
	routes.Setup(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	
	log.Printf("Server berjalan di http://localhost:%s", port)
	app.Listen(":" + port)
}