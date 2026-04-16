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
	
	// Dashboard
	admin.Get("/dashboard", controllers.AdminDashboardStats)
	
	// Shop approval & management
	admin.Get("/shops/pending", controllers.GetPendingShops)
	admin.Put("/shops/approve/:id", controllers.ApproveShop)
	admin.Put("/shops/reject/:id", controllers.RejectShop)
	admin.Get("/shops/all", controllers.GetAllShops)
	admin.Put("/shops/badge/:id", controllers.UpdateShopBadge)
	admin.Delete("/shops/:id", controllers.DeleteShop)
	
	// Warehouse management
	admin.Post("/warehouse/create", controllers.CreateWarehouseByAdmin)
	admin.Get("/warehouse/all", controllers.GetAllWarehousesWithStaff)
	admin.Post("/warehouse/add-staff", controllers.AddWarehouseStaff)
	
	// Courier & Delivery Hub management
	admin.Post("/delivery-hub/create", controllers.CreateDeliveryHubByAdmin)
	admin.Post("/courier/add", controllers.AddCourierByAdmin)
	admin.Get("/courier/all", controllers.GetAllCouriersWithHub) 

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
	
	// Courier delivery hub routes
	courier.Get("/hub/assignments", controllers.GetMyHubAssignments)
	courier.Put("/hub/pickup/:id", controllers.PickupShipment)
	courier.Put("/hub/delivery/:id", controllers.UpdateDeliveryStatus)
	courier.Get("/hub/history", controllers.GetCourierDeliveryHistory)

	// Warehouse staff routes
	warehouse := api.Group("/warehouse", middleware.Protected, middleware.IsWarehouseStaff)
	warehouse.Get("/shipments", controllers.GetAllShipments)
	warehouse.Put("/shipments/location", controllers.UpdateShipmentLocation)

	// Warehouse management routes
	warehouse.Post("/register", controllers.RegisterWarehouse)
	warehouse.Get("/my-warehouse", controllers.GetMyWarehouse)
	warehouse.Post("/movement", controllers.RecordMovement)
	warehouse.Get("/movements", controllers.GetWarehouseMovements)
	warehouse.Get("/all", controllers.GetAllWarehouses)
	warehouse.Get("/:id", controllers.GetWarehouseByID)

	// Delivery Hub management routes (Admin & Seller)
	adminHubs := api.Group("/delivery-hub", middleware.Protected, middleware.IsAdmin)
	adminHubs.Post("/register", controllers.RegisterDeliveryHub)
	adminHubs.Get("/all", controllers.GetAllDeliveryHubs)
	adminHubs.Put("/assign-courier/:id", controllers.AssignCourierToHub)
	adminHubs.Get("/pending/:id", controllers.GetHubPendingPackages)

	// Seller can assign shipments to hubs
	sellerHubs := api.Group("/delivery-hub", middleware.Protected, middleware.IsSeller)
	sellerHubs.Post("/assign", controllers.AssignShipmentToHub)

	// Public tracking
	api.Get("/tracking/:tracking_number", controllers.GetTrackingByNumber)
}