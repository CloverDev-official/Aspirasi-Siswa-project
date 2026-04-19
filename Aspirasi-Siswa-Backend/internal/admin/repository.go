package admin

import (
	"gorm.io/gorm"
)

type Repository interface {
	FindByUsername(username string) (Admin, error)
	FindByID(id uint) (Admin, error)
	Create(admin Admin) error
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *repository {
	return &repository{db: db}
}

func (r *repository) FindByUsername(username string) (Admin, error) {
	var admin Admin
	if err := r.db.Where("username = ?", username).First(&admin).Error; err != nil {
		return Admin{}, err
	}
	return admin, nil
}

func (r *repository) FindByID(id uint) (Admin, error) {
	var admin Admin
	if err := r.db.First(&admin, id).Error; err != nil {
		return Admin{}, err
	}
	return admin, nil
}

func (r *repository) Create(admin Admin) error {
	if err := r.db.Create(&admin).Error; err != nil {
		return err
	}
	return nil
}