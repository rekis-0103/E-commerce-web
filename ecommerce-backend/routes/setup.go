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

	protected := api.Group("/user", middleware.Protected)
	protected.Get("/profile", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"user_id": c.Locals("user_id"), "role": c.Locals("role")})
	})
	protected.Post("/shop/register", controllers.CreateShop)
	protected.Post("/cart", controllers.AddToCart)
	protected.Get("/cart", controllers.GetMyCart)
	protected.Put("/cart/:id", controllers.UpdateCartQuantity) 
	protected.Delete("/cart/:id", controllers.DeleteCartItem)
	protected.Post("/checkout", controllers.Checkout)
	protected.Get("/orders", controllers.GetMyOrders)

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
}