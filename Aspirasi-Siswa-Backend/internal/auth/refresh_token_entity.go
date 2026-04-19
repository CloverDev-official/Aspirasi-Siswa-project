package auth

import "time"

// RefreshToken stores hashed refresh tokens for rotation and revocation.
type RefreshToken struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	AdminID   uint       `gorm:"not null;index" json:"admin_id"`
	TokenHash string     `gorm:"type:char(64);not null;uniqueIndex" json:"-"`
	ExpiresAt time.Time  `gorm:"type:datetime(6);not null;index" json:"expires_at"`
	UsedAt    *time.Time `gorm:"type:datetime(6);index" json:"used_at,omitempty"`
	RevokedAt *time.Time `gorm:"type:datetime(6);index" json:"revoked_at,omitempty"`
	CreatedAt time.Time  `gorm:"type:datetime(6);autoCreateTime;<-:create" json:"created_at"`
	UpdatedAt time.Time  `gorm:"type:datetime(6);autoUpdateTime" json:"updated_at"`
}

func (RefreshToken) TableName() string {
	return "auth_refresh_tokens"
}
