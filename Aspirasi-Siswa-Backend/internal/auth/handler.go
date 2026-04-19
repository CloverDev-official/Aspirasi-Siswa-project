package auth

import (
	"errors"
	"menfess/pkg/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler interface {
	Login(c *gin.Context)
	Register(c *gin.Context)
	Refresh(c *gin.Context)
	Logout(c *gin.Context)
	ValidateAccessToken(c *gin.Context)
}

type handler struct {
	service Service
}

func NewHandler(service Service) *handler {
	return &handler{service: service}
}

func (h *handler) Login(c *gin.Context) {
	var req LoginRequest

	// Bind & validate
	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "username dan password wajib diisi", "username dan password wajib diisi")
		return
	}

	accessToken, refreshToken, err := h.service.Login(req.Username, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			util.RespondError(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "username atau password salah", "username atau password salah")
			return
		}

		util.RespondError(c, http.StatusInternalServerError, "LOGIN_FAILED", "gagal memproses login", "gagal memproses login")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "LOGIN_SUCCESS", "login berhasil", gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *handler) Register(c *gin.Context) {
	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "data tidak valid", "data tidak valid")
		return
	}

	err := h.service.Register(req.Username, req.Password, req.Role)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "REGISTER_FAILED", "registrasi gagal", err.Error())
		return
	}

	util.RespondSuccess(c, http.StatusCreated, "REGISTER_SUCCESS", "registrasi berhasil", nil)
}

func (h *handler) Refresh(c *gin.Context) {
	var req RefreshRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	accessToken, refreshToken, err := h.service.Refresh(req.RefreshToken)
	if err != nil {
		util.RespondError(c, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "invalid refresh token", "invalid refresh token")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "REFRESH_SUCCESS", "refresh token berhasil", gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func (h *handler) Logout(c *gin.Context) {
	var req LogoutRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	if err := h.service.Logout(req.RefreshToken); err != nil {
		util.RespondError(c, http.StatusUnauthorized, "INVALID_REFRESH_TOKEN", "invalid refresh token", "invalid refresh token")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "LOGOUT_SUCCESS", "logout berhasil", nil)
}

func (h *handler) ValidateAccessToken(c *gin.Context) {
	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	expiresAt, _ := c.Get("expires_at")

	util.RespondSuccess(c, http.StatusOK, "ACCESS_TOKEN_VALID", "access token valid", gin.H{
		"valid":      true,
		"user_id":    userID,
		"role":       role,
		"expires_at": expiresAt,
	})
}
