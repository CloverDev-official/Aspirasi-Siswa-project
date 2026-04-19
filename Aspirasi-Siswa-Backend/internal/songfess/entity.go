package songfess

import (
	"time"
)

type Songfess struct {
	ID        	uint   		   `gorm:"primaryKey;autoIncrement" json:"id"`
	To      	string 		   `gorm:"type:varchar(255)" json:"to,omitempty" binding:"omitempty,max=255"`
	From      	string 		   `gorm:"type:varchar(255)" json:"from,omitempty" binding:"omitempty,max=255"`
	Message 	string         `gorm:"type:text;not null" json:"message" binding:"required"`
	SongName 	string         `gorm:"type:text;not null" json:"song_name" binding:"required"`
	CreatedAt 	time.Time  	   `gorm:"type:datetime(6);autoCreateTime;<-:create" json:"created_at"`
	UpdatedAt 	time.Time  	   `gorm:"type:datetime(6);autoUpdateTime" json:"updated_at"`
}