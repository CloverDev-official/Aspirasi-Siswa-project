package main

import (
	"log"
	"menfess/internal/config"
	"menfess/internal/database"
	"os"
)

func getEnvOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func main() {
	cfg := config.LoadEnv()
	db, err := database.NewDatabaseConnection(cfg.Database)
	if err != nil {
		log.Fatal(err)
	}

	cmd := ""
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	switch cmd {
	case "fresh":
		log.Println("Running migrate fresh...")
		if err := database.MigrateFresh(db); err != nil {
			log.Fatal(err)
		}

	case "seed-admin":
		log.Println("Running migrate before seeding admin...")
		if err := database.Migrate(db); err != nil {
			log.Fatal(err)
		}

		seedUsername := getEnvOrDefault("SEED_ADMIN_USERNAME", "admin")
		seedPassword := getEnvOrDefault("SEED_ADMIN_PASSWORD", "admin12345")
		seedRole := getEnvOrDefault("SEED_ADMIN_ROLE", "admin")

		if err := database.SeedAdmin(db, seedUsername, seedPassword, seedRole); err != nil {
			log.Fatal(err)
		}

		log.Printf("Seed admin selesai. username=%s role=%s", seedUsername, seedRole)

	default:
		log.Println("Running migrate...")
		if err := database.Migrate(db); err != nil {
			log.Fatal(err)
		}
	}

}
