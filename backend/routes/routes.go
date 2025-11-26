package routes

import (
	"github.com/droplet/backend/config"
	"github.com/droplet/backend/handlers"
	"github.com/droplet/backend/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, cfg *config.Config) {
	// Initialize handlers
	authHandler := handlers.NewAuthHandler(cfg)
	jobHandler := handlers.NewJobHandler(cfg)
	playgroundHandler := handlers.NewPlaygroundHandler(cfg)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes - Authentication
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
		}

		// Public routes - Playground (no auth required for testing)
		playground := v1.Group("/playground")
		{
			playground.POST("/chat", playgroundHandler.Chat)
		}

		// Protected routes - require authentication
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// User profile
			protected.GET("/profile", authHandler.GetProfile)

			// Training jobs
			jobs := protected.Group("/jobs")
			{
				jobs.POST("", jobHandler.CreateJob)
				jobs.GET("", jobHandler.ListJobs)
				jobs.GET("/:id", jobHandler.GetJob)
				jobs.GET("/:id/download", jobHandler.DownloadModel)
				jobs.DELETE("/:id", jobHandler.CancelJob)
			}

			// Models
			models := protected.Group("/models")
			{
				models.GET("", jobHandler.ListModels)
			}

			// Base Models
			baseModels := protected.Group("/base-models")
			{
				baseModels.GET("", jobHandler.ListBaseModels)
			}
		}
	}
}
