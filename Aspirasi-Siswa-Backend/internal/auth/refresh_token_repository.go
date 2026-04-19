package auth

import (
	"time"

	"gorm.io/gorm"
)

type RefreshTokenRepository interface {
	Create(token RefreshToken) error
	FindActiveByHash(tokenHash string, now time.Time) (RefreshToken, error)
	Rotate(oldID uint, oldHash string, usedAt time.Time, newToken RefreshToken) error
	RevokeActiveByHash(tokenID uint, tokenHash string, revokedAt time.Time) error
}

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(token RefreshToken) error {
	return r.db.Create(&token).Error
}

func (r *refreshTokenRepository) FindActiveByHash(tokenHash string, now time.Time) (RefreshToken, error) {
	var token RefreshToken
	if err := r.db.
		Where("token_hash = ?", tokenHash).
		Where("used_at IS NULL").
		Where("revoked_at IS NULL").
		Where("expires_at > ?", now).
		First(&token).Error; err != nil {
		return RefreshToken{}, err
	}

	return token, nil
}

func (r *refreshTokenRepository) Rotate(oldID uint, oldHash string, usedAt time.Time, newToken RefreshToken) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		res := tx.Model(&RefreshToken{}).
			Where("id = ?", oldID).
			Where("token_hash = ?", oldHash).
			Where("used_at IS NULL").
			Where("revoked_at IS NULL").
			Where("expires_at > ?", usedAt).
			Update("used_at", usedAt)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected != 1 {
			return gorm.ErrRecordNotFound
		}

		if err := tx.Create(&newToken).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *refreshTokenRepository) RevokeActiveByHash(tokenID uint, tokenHash string, revokedAt time.Time) error {
	res := r.db.Model(&RefreshToken{}).
		Where("id = ?", tokenID).
		Where("token_hash = ?", tokenHash).
		Where("used_at IS NULL").
		Where("revoked_at IS NULL").
		Where("expires_at > ?", revokedAt).
		Update("revoked_at", revokedAt)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected != 1 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
