package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/droplet/backend/config"
	"github.com/gin-gonic/gin"
)

type PlaygroundHandler struct {
	cfg         *config.Config
	rateLimiter *RateLimiter
}

type PlaygroundChatRequest struct {
	Model   string                   `json:"model" binding:"required"`
	Message string                   `json:"message" binding:"required"`
	History []map[string]interface{} `json:"history"`
}

type PlaygroundChatResponse struct {
	Message   string    `json:"message"`
	Model     string    `json:"model"`
	Timestamp time.Time `json:"timestamp"`
}

type RateLimiter struct {
	mu         sync.Mutex
	tokens     int
	maxTokens  int
	refillRate time.Duration
	lastRefill time.Time
}

func NewRateLimiter(maxTokens int, refillRate time.Duration) *RateLimiter {
	return &RateLimiter{
		tokens:     maxTokens,
		maxTokens:  maxTokens,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

func (rl *RateLimiter) Allow() bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Refill tokens based on time elapsed
	now := time.Now()
	elapsed := now.Sub(rl.lastRefill)
	tokensToAdd := int(elapsed / rl.refillRate)

	if tokensToAdd > 0 {
		rl.tokens = min(rl.maxTokens, rl.tokens+tokensToAdd)
		rl.lastRefill = now
	}

	if rl.tokens > 0 {
		rl.tokens--
		return true
	}

	return false
}

func NewPlaygroundHandler(cfg *config.Config) *PlaygroundHandler {
	// 5 requests, refills 1 token per minute
	rateLimiter := NewRateLimiter(5, time.Minute)

	return &PlaygroundHandler{
		cfg:         cfg,
		rateLimiter: rateLimiter,
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Chat handles chat requests to the playground models
func (h *PlaygroundHandler) Chat(c *gin.Context) {
	// Check rate limit
	if !h.rateLimiter.Allow() {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":   "Rate limit exceeded. Please wait a moment before trying again.",
			"message": "You can send up to 5 messages. The limit refills gradually over time.",
		})
		return
	}

	var req PlaygroundChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Only support healthcare-qlora model now
	if req.Model != "healthcare-qlora" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid model selection. Only healthcare-qlora is supported."})
		return
	}

	// Use Gemini API for responses
	response, err := h.queryGeminiAPI(req.Message, req.History)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get response: %v", err)})
		return
	}

	c.JSON(http.StatusOK, PlaygroundChatResponse{
		Message:   response,
		Model:     req.Model,
		Timestamp: time.Now(),
	})
}

// GeminiRequest represents the request structure for Gemini API
type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

// queryGeminiAPI queries the Gemini API for responses
func (h *PlaygroundHandler) queryGeminiAPI(message string, history []map[string]interface{}) (string, error) {
	if h.cfg.GeminiAPIKey == "" {
		return "", fmt.Errorf("Gemini API key not configured")
	}

	// Build conversation context
	var conversationText string
	conversationText = "You are a helpful healthcare assistant specializing in medical information and healthcare advice. Provide accurate, compassionate, and informative responses.\n\n"

	for _, msg := range history {
		role := msg["role"]
		content := msg["content"]
		if role == "user" {
			conversationText += fmt.Sprintf("User: %v\n", content)
		} else if role == "assistant" {
			conversationText += fmt.Sprintf("Assistant: %v\n", content)
		}
	}
	conversationText += fmt.Sprintf("User: %s\nAssistant:", message)

	// Prepare Gemini API request
	geminiReq := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: conversationText},
				},
			},
		},
	}

	jsonData, err := json.Marshal(geminiReq)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %v", err)
	}

	// Make API request
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		h.cfg.GeminiModel, h.cfg.GeminiAPIKey)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call Gemini API: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Gemini API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var geminiResp GeminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini API")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}
