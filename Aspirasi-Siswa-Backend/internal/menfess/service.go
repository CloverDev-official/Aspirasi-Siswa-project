package menfess

import (
	"menfess/pkg/helper"
	"menfess/pkg/webdriver"
	"os"
	"path/filepath"
	"time"
)

type Service interface {
	FindAll(query ListQuery) (ListResult, error)
	FindByID(id uint) (Menfess, error)
	GenerateImage(id uint) (string, error)
	Create(menfess Menfess) (uint, error)
	Update(menfess Menfess) error
	Delete(id uint) error
	DeleteBulk(ids []uint) (int, error)
}

type service struct {
	repository Repository
}

func NewService(repository Repository) *service {
	return &service{repository}
}

func (s *service) FindAll(query ListQuery) (ListResult, error) {
	return s.repository.FindAll(query)
}

func (s *service) FindByID(id uint) (Menfess, error) {
	return s.repository.FindByID(id)
}

func (s *service) GenerateImage(id uint) (string, error) {
	menfess, err := s.repository.FindByID(id)
	if err != nil {
		return "", err
	}

	imgPath := "internal/storage/private/img/MENFESS.webp"
	fontPath := "internal/storage/private/font/onelittlefont-regular.woff2"

	absImg, _ := filepath.Abs(imgPath)
	absFont, _ := filepath.Abs(fontPath)

	result := map[string]string{
		"CHANGE FROM":       menfess.From,
		"CHANGE TO":         menfess.To,
		"CHANGE MESSAGE":    menfess.Message,
		"CHANGE IMAGE PATH": "file:///" + filepath.ToSlash(absImg),
		"CHANGE FONT PATH":  "file:///" + filepath.ToSlash(absFont),
	}

	buf, err := webdriver.ConvertHTMLToImage("frame_photo", result)
	if err != nil {
		return "", err
	}

	dir := "internal/storage/private/menfess/png"
	os.MkdirAll(dir, os.ModePerm)

	name, err := helper.RandomName()
	if err != nil {
		return "", err
	}

	filePath := filepath.Join(dir, name+".png")

	err = os.WriteFile(filePath, buf, 0644)
	if err != nil {
		return "", err
	}

	go func(path string) {
		time.Sleep(30 * time.Minute)
		os.Remove(path)
	}(filePath)

	privatePath := "/private/menfess/png/" + name + ".png"

	return privatePath, nil
}

func (s *service) Create(menfess Menfess) (uint, error) {
	return s.repository.Create(menfess)
}

func (s *service) Update(menfess Menfess) error {
	return s.repository.Update(menfess)
}

func (s *service) Delete(id uint) error {
	return s.repository.Delete(id)
}

func (s *service) DeleteBulk(ids []uint) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	rows, err := s.repository.DeleteMany(ids)
	if err != nil {
		return 0, err
	}

	return int(rows), nil
}
