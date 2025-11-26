package utils

import (
	"os"
	"path/filepath"
)

// EnsureDir creates a directory if it doesn't exist
func EnsureDir(path string) error {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return os.MkdirAll(path, 0755)
	}
	return nil
}

// GetUserBaseDir returns the base directory for a user
// Structure: baseDir/username
func GetUserBaseDir(baseDir, username string) string {
	return filepath.Join(baseDir, username)
}

// GetUserModelDir returns the path for a user's model directory
// Structure: baseDir/username/{qa|rag}/models/modelName
func GetUserModelDir(baseDir, username, modelName, trainingMode string) string {
	return filepath.Join(baseDir, username, trainingMode, "models", modelName)
}

// GetUserDatasetDir returns the path for a user's dataset directory
// Structure: baseDir/username/{qa|rag}/datasets
func GetUserDatasetDir(baseDir, username, trainingMode string) string {
	return filepath.Join(baseDir, username, trainingMode, "datasets")
}
