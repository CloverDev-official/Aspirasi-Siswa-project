package route

import (
	"menfess/internal/app"
	"menfess/internal/aspiration"
	"menfess/internal/auth"
	"menfess/internal/menfess"
	"menfess/internal/schedule"
	"menfess/internal/songfess"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, app *app.App) {
	v1 := r.Group("/api/v1")

	aspiration.RegisterRoutes(v1, app.AspirationHandler, app.JWTHelper)
	menfess.RegisterRoutes(v1, app.MenfessHandler, app.JWTHelper)
	songfess.RegisterRoutes(v1, app.SongfessHandler, app.JWTHelper)
	schedule.RegisterRoutes(v1, app.JWTHelper)
	auth.RegisterRoutes(v1, app.AuthHandler, app.JWTHelper)
}
