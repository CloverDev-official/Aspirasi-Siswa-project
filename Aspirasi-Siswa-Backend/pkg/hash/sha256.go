package hash

import (
	"crypto/sha256"
	"encoding/hex"
)

func HashSHA256(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
