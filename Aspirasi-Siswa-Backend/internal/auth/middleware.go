package auth

import (
	"net/http"
	"strings"

	"menfess/pkg/jwt"
	"menfess/pkg/util"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware(jwtHelper *jwt.JWT) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			util.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "access token tidak ditemukan", "authorization header is required")
			c.Abort()
			return
		}

		parts := strings.Fields(authHeader)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			util.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "format authorization tidak valid", "expected format: Bearer <access_token>")
			c.Abort()
			return
		}

		tokenStr := parts[1]

		claims, err := jwtHelper.ValidateToken(tokenStr)
		if err != nil {
			if err.Error() == "token expired" {
				util.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "access token expired", "token expired")
				c.Abort()
				return
			}

			util.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "access token tidak valid", err.Error())
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		if claims.ExpiresAt != nil {
			c.Set("expires_at", claims.ExpiresAt.Time.Unix())
		}

		c.Next()
	}
}

func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role := c.GetString("role")

		if role == "" {
			util.RespondError(c, http.StatusUnauthorized, "UNAUTHORIZED", "unauthorized", "unauthorized")
			c.Abort()
			return
		}

		for _, r := range allowedRoles {
			if role == r {
				c.Next()
				return
			}
		}

		util.RespondError(c, http.StatusForbidden, "FORBIDDEN", "forbidden", "forbidden")
		c.Abort()
	}
}
