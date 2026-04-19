package aspiration

import (
	"time"
)

type Aspiration struct {
	ID        uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string     `gorm:"type:varchar(255)" json:"name,omitempty" binding:"omitempty,max=255"`
	Message   string     `gorm:"type:text;not null" json:"message" binding:"required"`
	FilePath  string     `gorm:"type:varchar(255)" json:"file_path,omitempty" binding:"omitempty,max=255,filepath"`
	CreatedAt time.Time  `gorm:"type:datetime(6);autoCreateTime;<-:create" json:"created_at"`
	UpdatedAt time.Time  `gorm:"type:datetime(6);autoUpdateTime" json:"updated_at"`
}