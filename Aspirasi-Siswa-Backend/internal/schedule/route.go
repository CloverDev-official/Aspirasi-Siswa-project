package schedule

import (
	"errors"
	"menfess/internal/auth"
	jwtpkg "menfess/pkg/jwt"
	"menfess/pkg/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(rg *gin.RouterGroup, jwtHelper *jwtpkg.JWT) {
	rg.GET("/schedule/status", getAllStatus)
	rg.GET("/schedule/status/:feature", getFeatureStatus)

	admin := rg.Group("/admin")
	admin.Use(auth.AuthMiddleware(jwtHelper), auth.RoleMiddleware("admin"))
	admin.GET("/schedule/config", getConfig)
	admin.GET("/schedule/config/:target", getConfigByTarget)
	admin.PATCH("/schedule/config", patchConfig)
	admin.PATCH("/schedule/config/:target", patchConfig)
}

func getAllStatus(c *gin.Context) {
	now := Now()
	util.RespondSuccess(c, http.StatusOK, "SCHEDULE_STATUS_SUCCESS", "success", gin.H{
		"timezone":    "Asia/Jakarta",
		"server_time": now.Format("2006-01-02T15:04:05-07:00"),
		"items":       AllStatuses(now),
	})
}

func getFeatureStatus(c *gin.Context) {
	feature := NormalizeFeature(c.Param("feature"))
	if feature == "" {
		util.RespondError(c, http.StatusBadRequest, "INVALID_FEATURE", "invalid feature", "fitur tidak valid")
		return
	}

	now := Now()
	util.RespondSuccess(c, http.StatusOK, "SCHEDULE_STATUS_SUCCESS", "success", StatusForFeature(feature, now))
}

func getConfig(c *gin.Context) {
	util.RespondSuccess(c, http.StatusOK, "SCHEDULE_CONFIG_SUCCESS", "success", GetAllConfigs())
}

func getConfigByTarget(c *gin.Context) {
	target := NormalizeTarget(c.Param("target"))
	if target == "" {
		util.RespondError(c, http.StatusBadRequest, "INVALID_TARGET", "invalid target", "target jadwal tidak valid")
		return
	}

	util.RespondSuccess(c, http.StatusOK, "SCHEDULE_CONFIG_SUCCESS", "success", GetConfig(target))
}

func patchConfig(c *gin.Context) {
	target := NormalizeTarget(c.Param("target"))
	if target == "" {
		target = TargetShared
	}

	var request UpdateConfigRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request", "format payload tidak valid")
		return
	}

	config, err := UpdateConfig(target, request)
	if err != nil {
		if errors.Is(err, ErrInvalidSchedule) {
			util.RespondError(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid schedule", err.Error())
			return
		}

		if errors.Is(err, ErrInvalidTarget) {
			util.RespondError(c, http.StatusBadRequest, "INVALID_TARGET", "invalid target", err.Error())
			return
		}

		util.RespondError(c, http.StatusInternalServerError, "SCHEDULE_UPDATE_FAILED", "failed to update schedule", err.Error())
		return
	}

	util.RespondSuccess(c, http.StatusOK, "SCHEDULE_UPDATE_SUCCESS", "schedule updated", config)
}
