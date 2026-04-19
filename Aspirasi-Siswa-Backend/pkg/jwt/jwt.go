package jwt

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWT struct {
	secret []byte
	issuer string
	expire time.Duration

	now func() time.Time
}

type CustomClaims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type RefreshClaims struct {
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func New(secret string) *JWT {
	// Default: 24 hours.
	return &JWT{
		secret: []byte(secret),
		expire: 24 * time.Hour,
		now:    time.Now,
	}
}

// NewWithConfig creates JWT helper using app config values.
// If expireMinutes <= 0 it falls back to 60 minutes.
func NewWithConfig(secret, issuer string, expireMinutes int) *JWT {
	exp := time.Duration(expireMinutes) * time.Minute
	if expireMinutes <= 0 {
		exp = 60 * time.Minute
	}

	return &JWT{
		secret: []byte(secret),
		issuer: issuer,
		expire: exp,
		now:    time.Now,
	}
}

func (j *JWT) GenerateToken(userID uint, role string) (string, error) {
	now := j.now()
	claims := CustomClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.expire)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}

func (j *JWT) GenerateRefreshToken(userID uint) (string, error) {
	now := j.now()

	claims := RefreshClaims{
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
			Subject:   fmt.Sprintf("%d", userID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}

func (j *JWT) ValidateRefreshToken(tokenStr string) (uint, time.Time, error) {
	if tokenStr == "" {
		return 0, time.Time{}, errors.New("token is empty")
	}

	options := []jwt.ParserOption{
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	}

	if j.issuer != "" {
		options = append(options, jwt.WithIssuer(j.issuer))
	}

	token, err := jwt.ParseWithClaims(
		tokenStr,
		&RefreshClaims{},
		func(token *jwt.Token) (interface{}, error) {
			return j.secret, nil
		},
		options...,
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return 0, time.Time{}, errors.New("token expired")
		}
		return 0, time.Time{}, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*RefreshClaims)
	if !ok || !token.Valid {
		return 0, time.Time{}, errors.New("invalid token")
	}

	if claims.TokenType != "refresh" {
		return 0, time.Time{}, errors.New("invalid token type")
	}

	userID, err := strconv.ParseUint(claims.Subject, 10, 64)
	if err != nil || userID == 0 {
		return 0, time.Time{}, errors.New("invalid token subject")
	}

	if claims.ExpiresAt == nil {
		return 0, time.Time{}, errors.New("invalid token expiry")
	}

	return uint(userID), claims.ExpiresAt.Time, nil
}

func (j *JWT) ValidateToken(tokenStr string) (*CustomClaims, error) {
	if tokenStr == "" {
		return nil, errors.New("token is empty")
	}

	options := []jwt.ParserOption{
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	}

	if j.issuer != "" {
		options = append(options, jwt.WithIssuer(j.issuer))
	}

	token, err := jwt.ParseWithClaims(
		tokenStr,
		&CustomClaims{},
		func(token *jwt.Token) (interface{}, error) {
			return j.secret, nil
		},
		options...,
	)

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token expired")
		}
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
