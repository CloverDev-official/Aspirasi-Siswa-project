package auth

import (
	"menfess/internal/admin"
	"menfess/internal/config"
	jwtpkg "menfess/pkg/jwt"

	"gorm.io/gorm"
)

type Module struct {
	Handler   Handler
	JWTHelper *jwtpkg.JWT
}

func InitModule(db *gorm.DB, cfg *config.Config) *Module {
	adminRepo := admin.NewRepository(db)
	refreshTokenRepo := NewRefreshTokenRepository(db)

	jwtHelper := jwtpkg.NewWithConfig(
		cfg.JWT.JWTSecret,
		cfg.JWT.JWTIssuer,
		cfg.JWT.JWTExpireMinutes,
	)

	authService := NewService(adminRepo, refreshTokenRepo, jwtHelper)
	authHandler := NewHandler(authService)

	return &Module{
		Handler:   authHandler,
		JWTHelper: jwtHelper,
	}
}
