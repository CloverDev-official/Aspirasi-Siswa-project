package aspiration

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Service interface {
	FindAll(query ListQuery) (ListResult, error)
	FindByID(id uint) (Aspiration, error)
	Create(aspiration Aspiration) (uint, error)
	Update(aspiration Aspiration) error
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

func (s *service) FindByID(id uint) (Aspiration, error) {
	return s.repository.FindByID(id)
}

func (s *service) Create(aspiration Aspiration) (uint, error) {
	return s.repository.Create(aspiration)
}

func (s *service) Update(aspiration Aspiration) error {
	return s.repository.Update(aspiration)
}

func (s *service) Delete(id uint) error {
	aspiration, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}

	if err := s.repository.Delete(id); err != nil {
		return err
	}

	if err := deleteMediaFileIfExists(aspiration.FilePath); err != nil {
		return err
	}

	return nil
}

func (s *service) DeleteBulk(ids []uint) (int, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	aspirations, err := s.repository.FindByIDs(ids)
	if err != nil {
		return 0, err
	}

	if len(aspirations) == 0 {
		return 0, nil
	}

	foundIDs := make([]uint, 0, len(aspirations))
	for _, aspiration := range aspirations {
		foundIDs = append(foundIDs, aspiration.ID)
	}

	deletedCount, err := s.repository.DeleteMany(foundIDs)
	if err != nil {
		return 0, err
	}

	mediaErrors := make([]string, 0)
	for _, aspiration := range aspirations {
		if err := deleteMediaFileIfExists(aspiration.FilePath); err != nil {
			mediaErrors = append(mediaErrors, err.Error())
		}
	}

	if len(mediaErrors) > 0 {
		return int(deletedCount), fmt.Errorf("gagal menghapus sebagian media aspirasi: %s", strings.Join(mediaErrors, "; "))
	}

	return int(deletedCount), nil
}

func deleteMediaFileIfExists(filePath string) error {
	trimmedPath := strings.TrimSpace(filePath)
	if trimmedPath == "" {
		return nil
	}

	baseDirAbs, err := filepath.Abs("internal/storage/private/aspiration")
	if err != nil {
		return err
	}

	fileAbs, err := filepath.Abs(trimmedPath)
	if err != nil {
		return err
	}

	prefix := baseDirAbs + string(os.PathSeparator)
	if fileAbs != baseDirAbs && !strings.HasPrefix(fileAbs, prefix) {
		return fmt.Errorf("invalid aspiration media path: %s", trimmedPath)
	}

	err = os.Remove(fileAbs)
	if err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return nil
}
