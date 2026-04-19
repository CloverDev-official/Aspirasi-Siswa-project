package middleware

import (
	"fmt"
	"menfess/pkg/util"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ipRateLimiter struct {
	mu      sync.Mutex
	history map[string][]time.Time
	limit   int
	window  time.Duration
}

func NewIPRateLimitMiddleware(limit int, window time.Duration) gin.HandlerFunc {
	if limit < 1 {
		limit = 1
	}

	if window <= 0 {
		window = time.Minute
	}

	limiter := &ipRateLimiter{
		history: make(map[string][]time.Time),
		limit:   limit,
		window:  window,
	}

	return func(c *gin.Context) {
		key := fmt.Sprintf("%s|%s", c.ClientIP(), c.FullPath())
		now := time.Now()

		limiter.mu.Lock()
		entries := limiter.history[key]
		filtered := entries[:0]
		threshold := now.Add(-limiter.window)
		for _, ts := range entries {
			if ts.After(threshold) {
				filtered = append(filtered, ts)
			}
		}

		if len(filtered) >= limiter.limit {
			limiter.history[key] = filtered
			limiter.mu.Unlock()
			c.Header("Retry-After", fmt.Sprintf("%d", int(limiter.window.Seconds())))
			util.RespondError(c, http.StatusTooManyRequests, "TOO_MANY_REQUESTS", "too many requests", "terlalu banyak request, coba lagi nanti")
			c.Abort()
			return
		}

		filtered = append(filtered, now)
		limiter.history[key] = filtered
		limiter.mu.Unlock()

		c.Next()
	}
}
