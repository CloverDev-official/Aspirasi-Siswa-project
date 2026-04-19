package util

import "github.com/gin-gonic/gin"

type APIResponse struct {
	Success bool        `json:"success"`
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func RespondSuccess(c *gin.Context, status int, code, message string, data interface{}) {
	c.JSON(status, APIResponse{
		Success: true,
		Code:    code,
		Message: message,
		Data:    data,
	})
}

func RespondError(c *gin.Context, status int, code, message, detail string) {
	resp := APIResponse{
		Success: false,
		Code:    code,
		Message: message,
	}

	if detail != "" {
		resp.Error = detail
	}

	c.JSON(status, resp)
}
