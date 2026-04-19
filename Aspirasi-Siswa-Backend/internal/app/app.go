package app

import (
	"menfess/internal/aspiration"
	"menfess/internal/auth"
	"menfess/internal/config"
	"menfess/internal/menfess"
	"menfess/internal/schedule"
	"menfess/internal/songfess"
	jwtpkg "menfess/pkg/jwt"

	"gorm.io/gorm"
)

type App struct {
	AspirationHandler aspiration.Handler
	MenfessHandler    menfess.Handler
	SongfessHandler   songfess.Handler
	AuthHandler       auth.Handler
	JWTHelper         *jwtpkg.JWT
}

func InitializeApp(db *gorm.DB, cfg *config.Config) *App {
	aspirationModule := aspiration.InitModule(db)
	menfessModule := menfess.InitModule(db)
	songfessModule := songfess.InitModule(db)
	schedule.InitModule(db)
	authModule := auth.InitModule(db, cfg)

	return &App{
		AspirationHandler: aspirationModule,
		MenfessHandler:    menfessModule,
		SongfessHandler:   songfessModule,
		AuthHandler:       authModule.Handler,
		JWTHelper:         authModule.JWTHelper,
	}
}
