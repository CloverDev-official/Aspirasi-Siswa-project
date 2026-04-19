package menfess

import (
	"menfess/internal/auth"
	"menfess/internal/middleware"
	"menfess/pkg/jwt"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, handler Handler, jwtHelper *jwt.JWT) {
	publicRateLimit := middleware.NewIPRateLimitMiddleware(6, time.Minute)
	scheduleGuard := middleware.RequireSubmissionSchedule("menfess")
	rg.POST("/menfess", publicRateLimit, scheduleGuard, handler.Create)

	admin := rg.Group("/admin")
	admin.Use(auth.AuthMiddleware(jwtHelper), auth.RoleMiddleware("admin"))
	admin.GET("/menfess", handler.FindAll)
	admin.GET("/menfess/:id", handler.FindByID)
	admin.POST("/menfess/bulk-delete", handler.DeleteBulk)
	admin.PATCH("/menfess/:id", handler.Update)
	admin.DELETE("/menfess/:id", handler.Delete)
	admin.GET("/menfess/image/:id", handler.GenerateImage)
}
