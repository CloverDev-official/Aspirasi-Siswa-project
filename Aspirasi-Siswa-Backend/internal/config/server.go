package config

import "os"

type Server struct {
	Host string
	Port string
}

func loadServerConfig() Server {
	return Server{
		Host: os.Getenv("APP_HOST"),
		Port: os.Getenv("APP_PORT"),
	}
}