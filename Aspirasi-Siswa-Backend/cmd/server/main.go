package main

import (
	"menfess/internal/app"
	"menfess/internal/auth"
	"menfess/internal/config"
	"menfess/internal/database"
	"menfess/internal/route"
	"menfess/pkg/helper"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadEnv()
	server := gin.Default()
	server.MaxMultipartMemory = 20 << 20 // 20 MB
	db, err := database.NewDatabaseConnection(cfg.Database)
	if err != nil {
		panic(err)
	}
	app := app.InitializeApp(db, cfg)

	route.RegisterRoutes(server, app)

	helper.CleanupExpiredFiles("internal/storage/private/menfess/png", 30*time.Minute)
	helper.CleanupExpiredFiles("internal/storage/private/songfess/png", 30*time.Minute)
	public := server.Group("/private")
	public.Use(auth.AuthMiddleware(app.JWTHelper), auth.RoleMiddleware("admin"))
	{
		public.Static("/", "./internal/storage/private")
	}

	server.Run(cfg.Server.Host + ":" + cfg.Server.Port)
}
