package auth

import (
	"errors"
	"fmt"
	"menfess/internal/admin"
	"menfess/pkg/hash"
	jwtpkg "menfess/pkg/jwt"
	"time"

	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrLoginInternal      = errors.New("login internal error")
)

type Service interface {
	Login(username, password string) (string, string, error)
	Register(username, password, role string) error
	Refresh(refreshToken string) (string, string, error)
	Logout(refreshToken string) error
}

type service struct {
	adminRepo        admin.Repository
	refreshTokenRepo RefreshTokenRepository
	JWT              *jwtpkg.JWT
}

func NewService(adminRepo admin.Repository, refreshTokenRepo RefreshTokenRepository, jwt *jwtpkg.JWT) Service {
	return &service{
		adminRepo:        adminRepo,
		refreshTokenRepo: refreshTokenRepo,
		JWT:              jwt,
	}
}

func (s *service) Login(username, password string) (string, string, error) {
	admin, err := s.adminRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", ErrInvalidCredentials
		}
		return "", "", fmt.Errorf("%w: %v", ErrLoginInternal, err)
	}

	if !hash.CompareBcrypt(password, admin.Password) {
		return "", "", ErrInvalidCredentials
	}

	accessToken, err := s.JWT.GenerateToken(admin.ID, admin.Role)
	if err != nil {
		return "", "", fmt.Errorf("%w: %v", ErrLoginInternal, err)
	}

	refreshToken, err := s.JWT.GenerateRefreshToken(admin.ID)
	if err != nil {
		return "", "", fmt.Errorf("%w: %v", ErrLoginInternal, err)
	}

	_, refreshExp, err := s.JWT.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", fmt.Errorf("%w: %v", ErrLoginInternal, err)
	}

	if err := s.refreshTokenRepo.Create(RefreshToken{
		AdminID:   admin.ID,
		TokenHash: hash.HashSHA256(refreshToken),
		ExpiresAt: refreshExp,
	}); err != nil {
		return "", "", fmt.Errorf("%w: %v", ErrLoginInternal, err)
	}

	return accessToken, refreshToken, nil
}

func (s *service) Register(username, password, role string) error {
	// cek apakah username sudah ada
	_, err := s.adminRepo.FindByUsername(username)
	if err == nil {
		return errors.New("username sudah digunakan")
	}

	// hash password
	hashedPassword, err := hash.HashBcrypt(password)
	if err != nil {
		return err
	}

	newAdmin := admin.Admin{
		Username: username,
		Password: hashedPassword,
		Role:     role,
	}

	return s.adminRepo.Create(newAdmin)
}

func (s *service) Refresh(refreshToken string) (string, string, error) {
	userID, _, err := s.JWT.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", err
	}

	now := time.Now()
	oldHash := hash.HashSHA256(refreshToken)
	storedToken, err := s.refreshTokenRepo.FindActiveByHash(oldHash, now)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", errors.New("invalid refresh token")
		}
		return "", "", err
	}

	if storedToken.AdminID != userID {
		return "", "", errors.New("invalid refresh token")
	}

	admin, err := s.adminRepo.FindByID(storedToken.AdminID)
	if err != nil {
		return "", "", err
	}

	accessToken, err := s.JWT.GenerateToken(admin.ID, admin.Role)
	if err != nil {
		return "", "", err
	}

	newRefreshToken, err := s.JWT.GenerateRefreshToken(admin.ID)
	if err != nil {
		return "", "", err
	}

	_, newRefreshExp, err := s.JWT.ValidateRefreshToken(newRefreshToken)
	if err != nil {
		return "", "", err
	}

	if err := s.refreshTokenRepo.Rotate(
		storedToken.ID,
		oldHash,
		now,
		RefreshToken{
			AdminID:   admin.ID,
			TokenHash: hash.HashSHA256(newRefreshToken),
			ExpiresAt: newRefreshExp,
		},
	); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", errors.New("invalid refresh token")
		}
		return "", "", err
	}

	return accessToken, newRefreshToken, nil
}

func (s *service) Logout(refreshToken string) error {
	userID, _, err := s.JWT.ValidateRefreshToken(refreshToken)
	if err != nil {
		return errors.New("invalid refresh token")
	}

	now := time.Now()
	tokenHash := hash.HashSHA256(refreshToken)
	storedToken, err := s.refreshTokenRepo.FindActiveByHash(tokenHash, now)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid refresh token")
		}
		return err
	}

	if storedToken.AdminID != userID {
		return errors.New("invalid refresh token")
	}

	if err := s.refreshTokenRepo.RevokeActiveByHash(storedToken.ID, tokenHash, now); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid refresh token")
		}
		return err
	}

	return nil
}
