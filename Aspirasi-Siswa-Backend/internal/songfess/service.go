package songfess

import (
	"menfess/pkg/helper"
	"menfess/pkg/webdriver"
	"os"
	"path/filepath"
	"time"
)

type Service interface {
	FindAll(query ListQuery) (ListResult, error)
	FindByID(id uint) (Songfess, error)
	GenerateImage(id uint) (string, error)
	Create(songfess Songfess) (uint, error)
	Update(songfess Songfess) error
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

func (s *service) FindByID(id uint) (Songfess, error) {
	return s.repository.FindByID(id)
}

func (s *service) GenerateImage(id uint) (string, error) {
	songfess, err := s.repository.FindByID(id)
	if err != nil {
		return "", err
	}

	imgPath := "internal/storage/private/img/SONGFESS.webp"
	fontPath := "internal/storage/private/font/onelittlefont-regular.woff2"

	absImg, _ := filepath.Abs(imgPath)
	absFont, _ := filepath.Abs(fontPath)

	result := map[string]string{
		"CHANGE FROM":       songfess.From,
		"CHANGE TO":         songfess.To,
		"CHANGE MESSAGE":    songfess.Message,
		"CHANGE SONG":       songfess.SongName,
		"CHANGE IMAGE PATH": "file:///" + filepath.ToSlash(absImg),
		"CHANGE FONT PATH":  "file:///" + filepath.ToSlash(absFont),
	}

	buf, err := webdriver.ConvertHTMLToImage("frame_photo", result)
	if err != nil {
		return "", err
	}

	dir := "internal/storage/private/songfess/png"
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

	privatePath := "/private/songfess/png/" + name + ".png"

	return privatePath, nil
}

func (s *service) Create(songfess Songfess) (uint, error) {
	return s.repository.Create(songfess)
}

func (s *service) Update(songfess Songfess) error {
	return s.repository.Update(songfess)
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
