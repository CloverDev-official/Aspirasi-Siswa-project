package config

import (
	"log"

	"github.com/joho/godotenv"
)

type Config struct {
	Server 	 Server
	Database Database
	JWT 	 JWT
}

func LoadEnv() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("env file tidak ditemukan, pakai env OS")
	}

	return &Config{
		Server: loadServerConfig(),
		Database: loadDatabaseConfig(),
		JWT: loadJWTConfig(),
	}
}