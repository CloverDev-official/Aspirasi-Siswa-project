package auth

import (
	"menfess/pkg/jwt"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, handler Handler, jwtHelper *jwt.JWT) {
	auth := rg.Group("/auth")
	auth.POST("/login", handler.Login)
	// auth.POST("/register", handler.Register)
	auth.POST("/refresh", handler.Refresh)
	auth.POST("/logout", handler.Logout)
	auth.GET("/validate", AuthMiddleware(jwtHelper), handler.ValidateAccessToken)
}
