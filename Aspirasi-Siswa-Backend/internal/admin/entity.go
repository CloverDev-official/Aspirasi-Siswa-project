package admin

type Admin struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Username  string `gorm:"unique;not null" json:"username" binding:"required,alphanum,min=3,max=255"`
	Password  string `gorm:"not null" json:"-" binding:"required,min=8"`
	Role      string `gorm:"not null" json:"role" binding:"required,oneof=admin"`
	CreatedAt int64  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt int64  `gorm:"autoUpdateTime" json:"updated_at"`
}