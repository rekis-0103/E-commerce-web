package routes

import (
	"ecommerce-backend/controllers/admin"
	"ecommerce-backend/controllers/auth"
	"ecommerce-backend/controllers/product"
	"ecommerce-backend/controllers/transaction"
	"ecommerce-backend/controllers/user"
	"ecommerce-backend/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")

	api.Post("/register", auth.Register)
	api.Post("/login", auth.Login)
	api.Get("/products", product.GetAllPublicProducts)
	api.Get("/products/:id", product.GetPublicProductByID)
	api.Post("/auth/request-otp", auth.RequestOTP)
	api.Post("/auth/google", auth.GoogleLogin)

	protected := api.Group("/user", middleware.Protected)
	protected.Get("/profile", user.GetProfile)
	protected.Put("/profile", user.UpdateProfile)
	protected.Post("/shop/register", product.CreateShop)

	// Akane Pay Routes
	protected.Get("/wallet", transaction.GetWallet)
	protected.Post("/wallet/setup-pin", transaction.SetupPIN)
	protected.Post("/wallet/topup", transaction.TopUp)
	protected.Post("/wallet/withdraw", transaction.Withdrawal)
	protected.Post("/wallet/pay", transaction.PayWithAkanePay)

	protected.Post("/cart", transaction.AddToCart)
	protected.Get("/cart", transaction.GetMyCart)
	protected.Put("/cart/:id", transaction.UpdateCartQuantity) 
	protected.Delete("/cart/:id", transaction.DeleteCartItem)
	protected.Post("/checkout", transaction.Checkout)
	protected.Get("/orders", transaction.GetMyOrders)
	protected.Post("/orders/:id/pay", transaction.UploadPaymentProof)

	adminGroup := api.Group("/admin", middleware.Protected, middleware.IsAdmin)
	
	// Dashboard
	adminGroup.Get("/dashboard", admin.AdminDashboardStats)
	
	// Shop approval & management
	adminGroup.Get("/shops/pending", admin.GetPendingShops)
	adminGroup.Put("/shops/approve/:id", admin.ApproveShop)
	adminGroup.Put("/shops/reject/:id", admin.RejectShop)
	adminGroup.Get("/shops/all", admin.GetAllShops)
	adminGroup.Put("/shops/badge/:id", admin.UpdateShopBadge)
	adminGroup.Delete("/shops/:id", admin.DeleteShop)
	
	// Warehouse management
	adminGroup.Post("/warehouse/create", admin.CreateWarehouseByAdmin)
	adminGroup.Get("/warehouse/all", admin.GetAllWarehousesWithStaff)
	adminGroup.Post("/warehouse/add-staff", admin.AddWarehouseStaff)
	adminGroup.Get("/staff/available", admin.GetAvailableStaff)
	
	// Courier & Delivery Hub management
	adminGroup.Post("/courier/add", admin.AddCourierByAdmin)
	adminGroup.Get("/courier/available", admin.GetAvailableCouriers)
	adminGroup.Post("/courier/assign-warehouse", admin.AssignCourierToWarehouse)
	adminGroup.Get("/courier/all", admin.GetAllCouriersWithWarehouse) 

	// Delivery Hub Admin Management
	adminGroup.Post("/hub/register", admin.RegisterDeliveryHub)
	adminGroup.Get("/hub/all", admin.GetAllDeliveryHubs)
	adminGroup.Put("/hub/assign-courier/:id", admin.AssignCourierToHub)
	adminGroup.Post("/hub/assign-shipment", admin.AssignShipmentToHub) 

	seller := api.Group("/seller", middleware.Protected, middleware.IsSeller)
	seller.Get("/shop/profile", product.GetShopProfile)
	seller.Put("/shop/profile", product.UpdateShopProfile)
	seller.Post("/products", product.CreateProduct)
	seller.Get("/products", product.GetMyShopProducts)
	seller.Put("/products/:id", product.UpdateProduct)
	seller.Delete("/products/:id", product.DeleteProduct)
	seller.Get("/orders", transaction.GetShopOrders)
	seller.Put("/orders/:id/status", transaction.UpdateOrderStatus)
	seller.Get("/shipments", transaction.GetShopShipmentOrders)
	seller.Put("/shipments/confirm/:id", transaction.ConfirmReceived)

	// Buyer shipment routes
	buyer := api.Group("/buyer", middleware.Protected, func(c *fiber.Ctx) error {
		role := c.Locals("role")
		if role != "buyer" {
			return c.Status(403).JSON(fiber.Map{"message": "Akses ditolak"})
		}
		return c.Next()
	})
	buyer.Get("/shipments", transaction.GetMyShipmentOrders)
	buyer.Post("/shipments/confirm/:tracking_number", admin.ConfirmPackageReceived) 

	// Courier routes
	courier := api.Group("/courier", middleware.Protected, middleware.IsCourier)
	courier.Get("/shipments", transaction.GetAllShipments)
	courier.Put("/shipments/status", transaction.UpdateShipmentStatus)
	
	// Courier delivery hub routes
	courier.Get("/hub/assignments", admin.GetMyHubAssignments) 
	courier.Put("/hub/pickup/:id", admin.PickupShipment)
	courier.Put("/hub/delivery/:id", admin.UpdateDeliveryStatus)
	courier.Post("/hub/proof/:id", admin.UploadDeliveryProof)
	courier.Get("/hub/history", admin.GetCourierDeliveryHistory)

	// Warehouse staff routes
	warehouse := api.Group("/warehouse", middleware.Protected, middleware.IsWarehouseStaff)
	warehouse.Get("/shipments", transaction.GetAllShipments)
	warehouse.Put("/shipments/location", transaction.UpdateShipmentLocation)

	// Warehouse management routes
	warehouse.Post("/register", admin.RegisterWarehouse)
	warehouse.Get("/my-warehouse", admin.GetMyWarehouse)
	warehouse.Post("/movement", admin.RecordMovement)
	warehouse.Get("/movements", admin.GetWarehouseMovements)
	warehouse.Get("/incoming", admin.GetIncomingShipments)
	warehouse.Get("/stock", admin.GetWarehouseStock)
	warehouse.Get("/staff/available", admin.GetAvailableStaff)
	warehouse.Post("/staff/add", admin.AddStaffToWarehouse)
	warehouse.Get("/all", admin.GetAllWarehouses)
	warehouse.Get("/:id", admin.GetWarehouseByID)

	// Public tracking
	api.Get("/tracking/:tracking_number", transaction.GetTrackingByNumber)
}