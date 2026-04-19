package songfess

import (
	"menfess/internal/auth"
	"menfess/internal/middleware"
	"menfess/pkg/jwt"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, handler Handler, jwtHelper *jwt.JWT) {
	publicRateLimit := middleware.NewIPRateLimitMiddleware(6, time.Minute)
	scheduleGuard := middleware.RequireSubmissionSchedule("songfess")
	rg.POST("/songfess", publicRateLimit, scheduleGuard, handler.Create)

	admin := rg.Group("/admin")
	admin.Use(auth.AuthMiddleware(jwtHelper), auth.RoleMiddleware("admin"))
	admin.GET("/songfess", handler.FindAll)
	admin.GET("/songfess/:id", handler.FindByID)
	admin.POST("/songfess/bulk-delete", handler.DeleteBulk)
	admin.PATCH("/songfess/:id", handler.Update)
	admin.DELETE("/songfess/:id", handler.Delete)
	admin.GET("/songfess/image/:id", handler.GenerateImage)
}
