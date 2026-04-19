package menfess

import (
	"menfess/pkg/util"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type Handler interface {
	FindAll(c *gin.Context)
	FindByID(c *gin.Context)
	Create(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
	DeleteBulk(c *gin.Context)
	GenerateImage(c *gin.Context)
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
		From:  c.Query("from"),
		To:    c.Query("to"),
		Query: c.Query("q"),
		Year:  year,
		Month: month,
	})
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_LIST_FAILED", "failed to retrieve menfess", "failed to retrieve menfess")
		return
	}

	totalPages := int((result.Total + int64(result.Limit) - 1) / int64(result.Limit))
	if totalPages == 0 {
		totalPages = 1
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_LIST_SUCCESS", "success", gin.H{
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

	menfess, err := h.service.FindByID(uint(id))
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_GET_FAILED", "failed to retrieve menfess", "failed to retrieve menfess")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_GET_SUCCESS", "success", menfess)
}

func (h *handler) Create(c *gin.Context) {
	var request Menfess
	if err := c.ShouldBindJSON(&request); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	_, err := h.service.Create(request)
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_CREATE_FAILED", "failed to create menfess", "failed to create menfess")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_CREATE_SUCCESS", "menfess created", nil)
}

func (h *handler) Update(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	var request Menfess
	if err := c.ShouldBindJSON(&request); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "invalid request")
		return
	}

	request.ID = uint(id)

	err = h.service.Update(request)
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_UPDATE_FAILED", "failed to update menfess", "failed to update menfess")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_UPDATE_SUCCESS", "menfess updated", nil)
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
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_DELETE_FAILED", "failed to delete menfess", "failed to delete menfess")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_DELETE_SUCCESS", "menfess deleted", nil)
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
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_DELETE_FAILED", "failed to delete menfess", err.Error())
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_BULK_DELETE_SUCCESS", "menfess deleted", gin.H{
		"deleted_count": deletedCount,
	})
}

func (h *handler) GenerateImage(c *gin.Context) {
	idParam := c.Param("id")

	id, err := strconv.Atoi(idParam)
	if err != nil {
		util.RespondError(c, http.StatusBadRequest, "INVALID_ID", "invalid ID", "invalid ID")
		return
	}

	privatePath, err := h.service.GenerateImage(uint(id))
	if err != nil {
		util.RespondError(c, http.StatusInternalServerError, "MENFESS_IMAGE_FAILED", "failed to generate image", "failed to generate image")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "MENFESS_IMAGE_SUCCESS", "gambar telah dibuat", gin.H{"path": privatePath})
}
