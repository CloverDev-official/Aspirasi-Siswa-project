package database

import (
	"menfess/internal/admin"
	"menfess/internal/aspiration"
	"menfess/internal/auth"
	"menfess/internal/menfess"
	"menfess/internal/schedule"
	"menfess/internal/songfess"

	"gorm.io/gorm"
)

var entitiesList = []interface{}{
	&aspiration.Aspiration{},
	&admin.Admin{},
	&auth.RefreshToken{},
	&menfess.Menfess{},
	&songfess.Songfess{},
	&schedule.ScheduleSetting{},
}

func Migrate(db *gorm.DB) error {
	if err := db.AutoMigrate(entitiesList...); err != nil {
		return err
	}

	return nil
}

func MigrateFresh(db *gorm.DB) error {
	if err := db.Migrator().DropTable(entitiesList...); err != nil {
		return err
	}

	return Migrate(db)
}
