package helper

import (
	"os"
	"path/filepath"
	"time"
)

func CleanupExpiredFiles(dir string, maxAge time.Duration) error {
	files, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	now := time.Now()

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		fullPath := filepath.Join(dir, file.Name())

		info, err := file.Info()
		if err != nil {
			continue
		}

		// cek umur file
		if now.Sub(info.ModTime()) > maxAge {
			os.Remove(fullPath)
		}
	}

	return nil
}
