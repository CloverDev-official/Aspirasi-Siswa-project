package config

import (
	"os"
	"strconv"
)

type JWT struct {
	JWTSecret        string
	JWTIssuer        string
	JWTExpireMinutes int
}

func loadJWTConfig() JWT {
	secret := os.Getenv("JWT_SECRET")
	issuer := os.Getenv("JWT_ISSUER")
	expireMinutesStr := os.Getenv("JWT_EXPIRE_MINUTES")
	expireMinutes, err := strconv.Atoi(expireMinutesStr)
	if err != nil {
		expireMinutes = 60 // Default to 60 minutes if conversion fails
	}
	
	return JWT{
		JWTSecret:        secret,
		JWTIssuer:        issuer,
		JWTExpireMinutes: expireMinutes,
	}
}