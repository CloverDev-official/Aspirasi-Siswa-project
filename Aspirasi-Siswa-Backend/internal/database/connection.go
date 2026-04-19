package database

import (
	"fmt"
	"menfess/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func NewDatabaseConnection(cfg config.Database) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Asia%%2FMakassar",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Name,
	)

	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}