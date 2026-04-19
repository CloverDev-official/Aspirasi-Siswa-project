package database

import (
	"errors"
	"fmt"
	"menfess/internal/admin"
	"menfess/pkg/hash"
	"strings"

	"gorm.io/gorm"
)

func SeedAdmin(db *gorm.DB, username, password, role string) error {
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)
	role = strings.TrimSpace(role)

	if username == "" {
		return errors.New("username admin tidak boleh kosong")
	}

	if password == "" {
		return errors.New("password admin tidak boleh kosong")
	}

	if role == "" {
		role = "admin"
	}

	var existingAdmin admin.Admin
	err := db.Where("username = ?", username).First(&existingAdmin).Error
	if err == nil {
		return nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("gagal cek admin existing: %w", err)
	}

	hashedPassword, err := hash.HashBcrypt(password)
	if err != nil {
		return fmt.Errorf("gagal hash password admin: %w", err)
	}

	newAdmin := admin.Admin{
		Username: username,
		Password: hashedPassword,
		Role:     role,
	}

	if err := db.Create(&newAdmin).Error; err != nil {
		return fmt.Errorf("gagal membuat admin: %w", err)
	}

	return nil
}
