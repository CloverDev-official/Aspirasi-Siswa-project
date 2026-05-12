package aspiration

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	uploadDir     = "internal/storage/private/aspiration"
	maxUploadSize = 2 << 20 // 15MB
)

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".heic": true,
	".heif": true,
	".mp4":  true,
	".mov":  true,
	".avi":  true,
	".mkv":  true,
	".webm": true,
	".3gp":  true,
}

func saveUploadedMedia(fileHeader *multipart.FileHeader) (string, error) {
	if fileHeader == nil {
		return "", nil
	}

	if fileHeader.Size > maxUploadSize {
		return "", fmt.Errorf("file too large (max %d bytes)", maxUploadSize)
	}

	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// sniff first 512 bytes
	head := make([]byte, 512)
	n, err := io.ReadFull(src, head)
	if err != nil && err != io.ErrUnexpectedEOF {
		return "", err
	}
	head = head[:n]

	contentType := http.DetectContentType(head)
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))

	if !isAllowedMediaType(contentType, ext) {
		return "", fmt.Errorf("invalid file type: %s", contentType)
	}

	// reopen to copy full content
	src2, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src2.Close()

	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		return "", err
	}

	if !allowedExtensions[ext] {
		ext = extFromContentType(contentType)
	}

	if ext == "" {
		return "", fmt.Errorf("unsupported file extension")
	}

	filename := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), randHex(8), ext)
	dstPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src2); err != nil {
		return "", err
	}

	return dstPath, nil
}

func extFromContentType(ct string) string {
	switch ct {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	case "image/heic":
		return ".heic"
	case "image/heif":
		return ".heif"
	case "video/mp4":
		return ".mp4"
	case "video/quicktime":
		return ".mov"
	case "video/webm":
		return ".webm"
	case "video/x-msvideo":
		return ".avi"
	case "video/3gpp":
		return ".3gp"
	case "video/x-matroska":
		return ".mkv"
	default:
		return ""
	}
}

func isAllowedMediaType(contentType, ext string) bool {
	if strings.HasPrefix(contentType, "image/") || strings.HasPrefix(contentType, "video/") {
		return true
	}

	if contentType == "application/octet-stream" {
		return allowedExtensions[ext]
	}

	return false
}

func randHex(nBytes int) string {
	b := make([]byte, nBytes)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
