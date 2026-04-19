package menfess

import "gorm.io/gorm"

func InitModule(db *gorm.DB) *handler {
	repository := NewRepository(db)
	service := NewService(repository)

	return NewHandler(service)
}