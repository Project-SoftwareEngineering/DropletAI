package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port               string
	MongoDBURI         string
	MongoDBDatabase    string
	JWTSecret          string
	JWTExpiryHours     int
	BaseModelsDir      string
	ModelsStoragePath  string
	GeminiAPIKey       string
	GeminiModel        string
	PythonBin          string
	Ocean2DropletPath  string
	SyntheticWaterPath string
	AllowedOrigins     []string
}

func LoadConfig() *Config {
	jwtExpiryHours, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))

	allowedOrigins := strings.Split(getEnv("ALLOWED_ORIGINS", "http://localhost:3000"), ",")
	for i := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(allowedOrigins[i])
	}

	return &Config{
		Port:               getEnv("PORT", "8080"),
		MongoDBURI:         getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		MongoDBDatabase:    getEnv("MONGODB_DATABASE", "droplet"),
		JWTSecret:          getEnv("JWT_SECRET", "default-secret-change-this"),
		JWTExpiryHours:     jwtExpiryHours,
		BaseModelsDir:      getEnv("BASE_MODELS_DIR", "../base models"),
		ModelsStoragePath:  getEnv("MODELS_STORAGE_PATH", "./user_models"),
		GeminiAPIKey:       getEnv("GEMINI_API_KEY", ""),
		GeminiModel:        getEnv("GEMINI_MODEL", "gemini-2.5-flash"),
		PythonBin:          getEnv("PYTHON_BIN", "python3"),
		Ocean2DropletPath:  getEnv("OCEAN2DROPLET_PATH", "../ocean2droplet"),
		SyntheticWaterPath: getEnv("SYNTHETIC_WATER_PATH", "../synthetic_water"),
		AllowedOrigins:     allowedOrigins,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
