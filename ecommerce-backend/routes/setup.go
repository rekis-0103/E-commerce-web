package routes

import (
	"ecommerce-backend/controllers"
	"ecommerce-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")

	api.Post("/register", controllers.Register)
	api.Post("/login", controllers.Login)
	api.Get("/products", controllers.GetAllPublicProducts)
	api.Get("/products/:id", controllers.GetPublicProductByID)
	api.Post("/auth/request-otp", controllers.RequestOTP)
	api.Post("/auth/google", controllers.GoogleLogin)

	protected := api.Group("/user", middleware.Protected)
	protected.Get("/profile", controllers.GetProfile)
	protected.Put("/profile", controllers.UpdateProfile)
	protected.Post("/shop/register", controllers.CreateShop)
	protected.Post("/cart", controllers.AddToCart)
	protected.Get("/cart", controllers.GetMyCart)
	protected.Put("/cart/:id", controllers.UpdateCartQuantity) 
	protected.Delete("/cart/:id", controllers.DeleteCartItem)
	protected.Post("/checkout", controllers.Checkout)
	protected.Get("/orders", controllers.GetMyOrders)
	protected.Post("/orders/:id/pay", controllers.UploadPaymentProof)

	admin := api.Group("/admin", middleware.Protected, middleware.IsAdmin)
	admin.Get("/shops/pending", controllers.GetPendingShops)
	admin.Put("/shops/approve/:id", controllers.ApproveShop) 

	seller := api.Group("/seller", middleware.Protected, middleware.IsSeller)
	seller.Post("/products", controllers.CreateProduct)
	seller.Get("/products", controllers.GetMyShopProducts)
	seller.Put("/products/:id", controllers.UpdateProduct)
	seller.Delete("/products/:id", controllers.DeleteProduct)
	seller.Get("/orders", controllers.GetShopOrders)
	seller.Put("/orders/:id/status", controllers.UpdateOrderStatus)
	seller.Get("/shipments", controllers.GetShopShipmentOrders)
	seller.Put("/shipments/confirm/:id", controllers.ConfirmReceived)

	// Buyer shipment routes
	buyer := api.Group("/buyer", middleware.Protected, func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "buyer" {
			return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak"})
		}
		return c.Next()
	})
	buyer.Get("/shipments", controllers.GetMyShipmentOrders)

	// Courier routes
	courier := api.Group("/courier", middleware.Protected, middleware.IsCourier)
	courier.Get("/shipments", controllers.GetAllShipments)
	courier.Put("/shipments/status", controllers.UpdateShipmentStatus)

	// Warehouse staff routes
	warehouse := api.Group("/warehouse", middleware.Protected, middleware.IsWarehouseStaff)
	warehouse.Get("/shipments", controllers.GetAllShipments)
	warehouse.Put("/shipments/location", controllers.UpdateShipmentLocation)

	// Public tracking
	api.Get("/tracking/:tracking_number", controllers.GetTrackingByNumber)
}