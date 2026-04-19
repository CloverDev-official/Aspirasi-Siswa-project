package middleware

import (
	"menfess/internal/schedule"
	"menfess/pkg/util"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireSubmissionSchedule(featureRaw string) gin.HandlerFunc {
	feature := schedule.NormalizeFeature(featureRaw)

	return func(c *gin.Context) {
		if feature == "" {
			util.RespondError(c, http.StatusInternalServerError, "SCHEDULE_CONFIG_ERROR", "schedule misconfigured", "fitur jadwal tidak valid")
			c.Abort()
			return
		}

		now := schedule.Now()
		if schedule.IsOpenForFeature(feature, now) {
			c.Next()
			return
		}

		status := schedule.StatusForFeature(feature, now)
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"code":    "SUBMISSION_CLOSED",
			"message": "jadwal pengiriman sedang tutup",
			"error":   schedule.ClosedDetail(feature, now),
			"data": gin.H{
				"status": status,
			},
		})
		c.Abort()
	}
}
