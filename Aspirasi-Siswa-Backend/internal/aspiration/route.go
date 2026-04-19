package aspiration

import (
	"menfess/internal/auth"
	"menfess/internal/middleware"
	"menfess/pkg/jwt"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, handler Handler, jwtHelper *jwt.JWT) {
	publicRateLimit := middleware.NewIPRateLimitMiddleware(6, time.Minute)
	scheduleGuard := middleware.RequireSubmissionSchedule("aspiration")
	rg.POST("/aspiration", publicRateLimit, scheduleGuard, handler.Create)

	admin := rg.Group("/admin")
	admin.Use(auth.AuthMiddleware(jwtHelper), auth.RoleMiddleware("admin"))
	admin.GET("/aspiration", handler.FindAll)
	admin.GET("/aspiration/:id", handler.FindByID)
	admin.GET("/aspiration/media/:id", handler.PreviewMedia)
	admin.POST("/aspiration/bulk-delete", handler.DeleteBulk)
	admin.PATCH("/aspiration/:id", handler.Update)
	admin.DELETE("/aspiration/:id", handler.Delete)
}
