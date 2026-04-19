package aspiration

import (
	"errors"
	"fmt"
	"menfess/pkg/util"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler interface {
	FindAll(c *gin.Context)
	FindByID(c *gin.Context)
	Create(c *gin.Context)
	PreviewMedia(c *gin.Context)
	DeleteBulk(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
}

type handler struct {
	service Service
}

type bulkDeleteRequest struct {
	IDs []int `json:"ids"`
}

func NewHandler(service Service) *handler {
	return &handler{service}
}

func parsePositiveInt(value string, fallback int) int {
	number, err := strconv.Atoi(value)
	if err != nil || number < 1 {
		return fallback
	}

	return number
}

func parseOptionalInt(value string) (int, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return 0, nil
	}

	number, err := strconv.Atoi(trimmed)
	if err != nil {
		return 0, err
	}

	return number, nil
}

func (h *handler) FindAll(c *gin.Context) {
	page := parsePositiveInt(c.DefaultQuery("page", "1"), 1)
	limit := parsePositiveInt(c.DefaultQuery("limit", "10"), 10)
	if limit > 50 {
		limit = 50
	}

	year, err := parseOptionalInt(c.Query("year"))
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "year harus berupa angka")
		return
	}

	month, err := parseOptionalInt(c.Query("month"))
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "month harus berupa angka")
		return
	}

	if month < 0 || month > 12 {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "month harus 1-12")
		return
	}

	result, err := h.service.FindAll(ListQuery{
		Page:  page,
		Limit: limit,
		Name:  c.Query("name"),
		Query: c.Query("q"),
		Year:  year,
		Month: month,
	})
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_LIST_FAILED", "failed to retrieve aspirations", "failed to retrieve aspirations")
		return
	}

	totalPages := int((result.Total + int64(result.Limit) - 1) / int64(result.Limit))
	if totalPages == 0 {
		totalPages = 1
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_LIST_SUCCESS", "success", gin.H{
		"items": result.Items,
		"pagination": gin.H{
			"page":        result.Page,
			"limit":       result.Limit,
			"total":       result.Total,
			"total_pages": totalPages,
		},
	})
}

func (h *handler) FindByID(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	aspiration, err := h.service.FindByID(uint(id))
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_GET_FAILED", "failed to retrieve aspiration", "failed to retrieve aspiration")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_GET_SUCCESS", "success", aspiration)
}

func (h *handler) Create(c *gin.Context) {
	request := Aspiration{
		Name:    strings.TrimSpace(c.PostForm("name")),
		Message: strings.TrimSpace(c.PostForm("message")),
	}

	if request.Message == "" {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	fileHeader, err := c.FormFile("file")
	if err == nil && fileHeader != nil {
		filePath, err := saveUploadedMedia(fileHeader)
		if err != nil {
			util.RespondError(c, http.StatusBadRequest, "UPLOAD_MEDIA_FAILED", "gagal upload media", err.Error())
			return
		}
		request.FilePath = filePath
	} else if err != nil && !errors.Is(err, http.ErrMissingFile) {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", err.Error())
		return
	}

	id, err := h.service.Create(request)
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_CREATE_FAILED", "failed to create aspiration", "failed to create aspiration")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_CREATE_SUCCESS", "aspiration created", gin.H{
		"message": "Aspiration created",
		"id":      id,
	})
}

func (h *handler) PreviewMedia(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	aspiration, err := h.service.FindByID(uint(id))
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_GET_FAILED", "failed to retrieve aspiration", "failed to retrieve aspiration")
		return
	}

	filePath := strings.TrimSpace(aspiration.FilePath)
	if filePath == "" {
		util.RespondError(c, http.StatusNotFound, "ASPIRATION_MEDIA_NOT_FOUND", "media tidak ditemukan", "media tidak ditemukan")
		return
	}

	baseDirAbs, _ := filepath.Abs("internal/storage/private/aspiration")
	fileAbs, _ := filepath.Abs(filePath)
	prefix := baseDirAbs + string(os.PathSeparator)
	if fileAbs != baseDirAbs && !strings.HasPrefix(fileAbs, prefix) {
		util.RespondError(c, http.StatusForbidden, "FORBIDDEN", "forbidden", fmt.Sprintf("invalid media path: %s", filePath))
		return
	}

	if _, err := os.Stat(fileAbs); err != nil {
		util.RespondError(c, http.StatusNotFound, "ASPIRATION_MEDIA_NOT_FOUND", "media tidak ditemukan", "media tidak ditemukan")
		return
	}

	c.File(fileAbs)
}

func (h *handler) Update(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	var request Aspiration
	if err := c.ShouldBindJSON(&request); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	request.ID = uint(id)

	err = h.service.Update(request)
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_UPDATE_FAILED", "failed to update aspiration", "failed to update aspiration")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_UPDATE_SUCCESS", "aspiration updated", nil)
}

func (h *handler) DeleteBulk(c *gin.Context) {
	var request bulkDeleteRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "format payload tidak valid")
		return
	}

	if len(request.IDs) == 0 {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "ids minimal 1")
		return
	}

	seen := make(map[int]struct{})
	ids := make([]uint, 0, len(request.IDs))
	for _, id := range request.IDs {
		if id < 1 {
			util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "id harus lebih besar dari 0")
			return
		}

		if _, exists := seen[id]; exists {
			continue
		}

		seen[id] = struct{}{}
		ids = append(ids, uint(id))
	}

	deletedCount, err := h.service.DeleteBulk(ids)
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_DELETE_FAILED", "failed to delete aspiration", err.Error())
		return
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_BULK_DELETE_SUCCESS", "aspiration deleted", gin.H{
		"deleted_count": deletedCount,
	})
}

func (h *handler) Delete(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)

	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	err = h.service.Delete(uint(id))
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "ASPIRATION_DELETE_FAILED", "failed to delete aspiration", "failed to delete aspiration")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "ASPIRATION_DELETE_SUCCESS", "aspiration deleted", nil)
}
