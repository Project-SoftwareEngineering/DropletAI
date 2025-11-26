package handlers

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/droplet/backend/config"
	"github.com/droplet/backend/database"
	"github.com/droplet/backend/metrics"
	"github.com/droplet/backend/models"
	"github.com/droplet/backend/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"gopkg.in/yaml.v3"
)

type JobHandler struct {
	cfg               *config.Config
	jobs              map[string]*models.TrainingJob
	mu                sync.RWMutex
	concurrencySem    chan struct{} // Limit concurrent jobs
	maxConcurrentJobs int
}

func NewJobHandler(cfg *config.Config) *JobHandler {
	maxJobs := 5 // Default max concurrent jobs
	h := &JobHandler{
		cfg:               cfg,
		jobs:              make(map[string]*models.TrainingJob),
		concurrencySem:    make(chan struct{}, maxJobs),
		maxConcurrentJobs: maxJobs,
	}

	// Clean up any stuck jobs from previous server instance
	h.cleanupStuckJobs()

	return h
}

// cleanupStuckJobs marks any jobs stuck in "running" status as failed
// This happens when the server crashes or is restarted during training
func (h *JobHandler) cleanupStuckJobs() {
	jobsCollection := database.GetCollection("training_jobs")
	ctx := context.Background()

	// Find all jobs that are still marked as running
	cursor, err := jobsCollection.Find(ctx, bson.M{
		"status": models.JobStatusRunning,
	})
	if err != nil {
		log.Printf("Failed to query stuck jobs: %v", err)
		return
	}
	defer cursor.Close(ctx)

	stuckCount := 0
	for cursor.Next(ctx) {
		var job models.TrainingJob
		if err := cursor.Decode(&job); err != nil {
			continue
		}

		// Mark as failed with appropriate message
		_, err := jobsCollection.UpdateOne(
			ctx,
			bson.M{"_id": job.ID},
			bson.M{
				"$set": bson.M{
					"status":     models.JobStatusFailed,
					"error":      "Job was interrupted (server restart or crash)",
					"end_time":   time.Now(),
					"updated_at": time.Now(),
				},
			},
		)
		if err != nil {
			log.Printf("Failed to update stuck job %s: %v", job.JobID, err)
		} else {
			stuckCount++
			log.Printf("Marked stuck job %s as failed", job.JobID)
		}
	}

	if stuckCount > 0 {
		log.Printf("Cleaned up %d stuck jobs", stuckCount)
	}
}

func (h *JobHandler) CreateJob(c *gin.Context) {
	username := c.GetString("username")
	userID := c.GetString("user_id")

	var req models.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate training mode and data mode combinations
	if req.TrainingMode != models.FineTuneMode && req.TrainingMode != models.RAGMode {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid training mode"})
		return
	}
	if req.DataMode != models.QAMode && req.DataMode != models.KnowledgeBaseMode {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data mode"})
		return
	}

	// Check for duplicate model name for this user
	jobsCollection := database.GetCollection("training_jobs")
	var existingJob models.TrainingJob
	err := jobsCollection.FindOne(context.Background(), bson.M{
		"username":   username,
		"model_name": req.ModelName,
	}).Decode(&existingJob)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Model name already exists. Please choose a different name."})
		return
	}

	// Create job
	jobID := uuid.New().String()
	now := time.Now()

	job := &models.TrainingJob{
		JobID:        jobID,
		UserID:       userID,
		Username:     username,
		ModelName:    req.ModelName,
		TrainingMode: req.TrainingMode,
		DataMode:     req.DataMode,
		Status:       models.JobStatusPending,
		Progress:     0,
		StartTime:    now,
		Config:       req.Config,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Save to database
	result, err := jobsCollection.InsertOne(context.Background(), job)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	job.ID = result.InsertedID.(primitive.ObjectID)

	// Store in memory for tracking
	h.mu.Lock()
	h.jobs[jobID] = job
	h.mu.Unlock()

	// Record metrics
	metrics.TrainingJobsTotal.WithLabelValues(string(req.TrainingMode), string(req.DataMode)).Inc()
	metrics.TrainingJobsActive.Inc()

	// Start job asynchronously
	go h.executeJob(job)

	c.JSON(http.StatusCreated, job.ToResponse())
}

func (h *JobHandler) GetJob(c *gin.Context) {
	jobID := c.Param("id")
	username := c.GetString("username")

	// Try to get from memory first
	h.mu.RLock()
	job, exists := h.jobs[jobID]
	h.mu.RUnlock()

	if exists && job.Username == username {
		c.JSON(http.StatusOK, job.ToResponse())
		return
	}

	// Otherwise query database
	jobsCollection := database.GetCollection("training_jobs")
	var dbJob models.TrainingJob
	err := jobsCollection.FindOne(context.Background(), bson.M{
		"job_id":   jobID,
		"username": username,
	}).Decode(&dbJob)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, dbJob.ToResponse())
}

func (h *JobHandler) ListJobs(c *gin.Context) {
	username := c.GetString("username")

	jobsCollection := database.GetCollection("training_jobs")
	cursor, err := jobsCollection.Find(context.Background(), bson.M{"username": username})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch jobs"})
		return
	}
	defer cursor.Close(context.Background())

	var jobs []models.TrainingJob
	if err := cursor.All(context.Background(), &jobs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode jobs"})
		return
	}

	responses := make([]models.JobResponse, len(jobs))
	for i := range jobs {
		responses[i] = jobs[i].ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

func (h *JobHandler) ListModels(c *gin.Context) {
	username := c.GetString("username")

	// Get completed jobs for this user
	jobsCollection := database.GetCollection("training_jobs")
	cursor, err := jobsCollection.Find(context.Background(), bson.M{
		"username": username,
		"status":   models.JobStatusCompleted,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch models"})
		return
	}
	defer cursor.Close(context.Background())

	var jobs []models.TrainingJob
	if err := cursor.All(context.Background(), &jobs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode models"})
		return
	}

	type ModelInfo struct {
		ModelName    string              `json:"model_name"`
		TrainingMode models.TrainingMode `json:"training_mode"`
		DataMode     models.DataMode     `json:"data_mode"`
		ModelPath    string              `json:"model_path"`
		CreatedAt    time.Time           `json:"created_at"`
	}

	userModels := make([]ModelInfo, 0)
	for i := range jobs {
		if jobs[i].ModelPath != "" {
			userModels = append(userModels, ModelInfo{
				ModelName:    jobs[i].ModelName,
				TrainingMode: jobs[i].TrainingMode,
				DataMode:     jobs[i].DataMode,
				ModelPath:    jobs[i].ModelPath,
				CreatedAt:    jobs[i].CreatedAt,
			})
		}
	}

	c.JSON(http.StatusOK, userModels)
}

func (h *JobHandler) ListBaseModels(c *gin.Context) {
	baseModelsDir := h.cfg.BaseModelsDir

	// Read directory
	entries, err := os.ReadDir(baseModelsDir)
	if err != nil {
		log.Printf("Error reading base models directory: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read base models directory"})
		return
	}

	type BaseModelInfo struct {
		Name string `json:"name"`
		Path string `json:"path"`
	}

	baseModels := make([]BaseModelInfo, 0)
	for _, entry := range entries {
		if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
			modelPath := filepath.Join(baseModelsDir, entry.Name())
			baseModels = append(baseModels, BaseModelInfo{
				Name: entry.Name(),
				Path: modelPath,
			})
		}
	}

	c.JSON(http.StatusOK, baseModels)
}

func (h *JobHandler) CancelJob(c *gin.Context) {
	jobID := c.Param("id")
	username := c.GetString("username")

	// Get job from database
	jobsCollection := database.GetCollection("training_jobs")
	var job models.TrainingJob
	err := jobsCollection.FindOne(context.Background(), bson.M{
		"job_id":   jobID,
		"username": username,
	}).Decode(&job)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	// Only allow cancelling pending or running jobs
	if job.Status != models.JobStatusPending && job.Status != models.JobStatusRunning {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only cancel pending or running jobs"})
		return
	}

	// Update status to cancelled
	job.UpdateStatus(models.JobStatusCancelled)
	job.SetEndTime(time.Now())

	// Update in database
	update := bson.M{
		"$set": bson.M{
			"status":     models.JobStatusCancelled,
			"end_time":   job.EndTime,
			"updated_at": time.Now(),
		},
	}

	_, err = jobsCollection.UpdateOne(
		context.Background(),
		bson.M{"job_id": jobID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel job"})
		return
	}

	// Update in memory if exists
	h.mu.Lock()
	if memJob, exists := h.jobs[jobID]; exists {
		memJob.UpdateStatus(models.JobStatusCancelled)
		memJob.SetEndTime(time.Now())
	}
	h.mu.Unlock()

	log.Printf("Job %s cancelled by user %s", jobID, username)
	c.JSON(http.StatusOK, gin.H{"message": "Job cancelled successfully"})
}

func (h *JobHandler) DownloadModel(c *gin.Context) {
	jobID := c.Param("id")
	username := c.GetString("username")

	// Get job from database
	jobsCollection := database.GetCollection("training_jobs")
	var job models.TrainingJob
	err := jobsCollection.FindOne(context.Background(), bson.M{
		"job_id":   jobID,
		"username": username,
	}).Decode(&job)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	// Only allow downloading completed jobs
	if job.Status != models.JobStatusCompleted {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Can only download completed jobs"})
		return
	}

	if job.ModelPath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Model path not found"})
		return
	}

	// Create zip file of the model directory
	modelDir := job.ModelPath
	if _, err := os.Stat(modelDir); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Model directory not found"})
		return
	}

	// Create a temporary zip file
	zipFileName := fmt.Sprintf("%s_%s.zip", job.ModelName, job.JobID)
	zipFilePath := filepath.Join(os.TempDir(), zipFileName)

	// Create zip command
	cmd := exec.Command("zip", "-r", zipFilePath, ".")
	cmd.Dir = modelDir

	if err := cmd.Run(); err != nil {
		log.Printf("Failed to create zip file: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create download package"})
		return
	}

	// Ensure cleanup after download
	defer os.Remove(zipFilePath)

	// Send the file
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", zipFileName))
	c.Header("Content-Type", "application/zip")
	c.File(zipFilePath)

	log.Printf("Model downloaded for job %s by user %s", jobID, username)
}

func (h *JobHandler) executeJob(job *models.TrainingJob) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Job %s panicked: %v", job.JobID, r)
			job.UpdateStatus(models.JobStatusFailed)
			job.UpdateError(fmt.Sprintf("Job panicked: %v", r))
			h.updateJobInDB(job)
		}
	}()

	// Acquire semaphore slot (blocks if max concurrent jobs reached)
	h.concurrencySem <- struct{}{}
	defer func() {
		<-h.concurrencySem // Release slot when done
	}()

	log.Printf("Starting job %s for user %s (active jobs: %d/%d)", job.JobID, job.Username, len(h.concurrencySem), h.maxConcurrentJobs)

	job.UpdateStatus(models.JobStatusRunning)
	h.updateJobInDB(job)

	// Create user directories
	// Structure: user_models/username/{qa|rag}/models/modelName
	//            user_models/username/{qa|rag}/datasets/
	trainingModeStr := string(job.TrainingMode) // "fine_tune" or "rag"
	userModelDir := utils.GetUserModelDir(h.cfg.ModelsStoragePath, job.Username, job.ModelName, trainingModeStr)
	userDatasetDir := utils.GetUserDatasetDir(h.cfg.ModelsStoragePath, job.Username, trainingModeStr)

	if err := utils.EnsureDir(userModelDir); err != nil {
		job.UpdateStatus(models.JobStatusFailed)
		job.UpdateError(fmt.Sprintf("Failed to create model directory: %v", err))
		h.updateJobInDB(job)
		return
	}

	if err := utils.EnsureDir(userDatasetDir); err != nil {
		job.UpdateStatus(models.JobStatusFailed)
		job.UpdateError(fmt.Sprintf("Failed to create dataset directory: %v", err))
		h.updateJobInDB(job)
		return
	}

	// Step 1: Generate synthetic data (20% progress)
	job.UpdateProgress(10)
	h.updateJobInDB(job)

	// Check if job was cancelled
	if job.GetStatus() == models.JobStatusCancelled {
		log.Printf("Job %s was cancelled, stopping execution", job.JobID)
		return
	}

	// Start progress tracking goroutine for data generation
	stopTracking := make(chan bool)
	go h.trackDataGenProgress(job, userDatasetDir, stopTracking)

	datasetPath, err := h.generateData(job, userDatasetDir)

	// Stop progress tracking
	close(stopTracking)

	if err != nil {
		job.UpdateStatus(models.JobStatusFailed)
		job.UpdateError(fmt.Sprintf("Data generation failed: %v", err))
		h.updateJobInDB(job)
		return
	}

	job.DatasetPath = datasetPath
	job.UpdateProgress(20)
	h.updateJobInDB(job)

	// Check if job was cancelled
	if job.GetStatus() == models.JobStatusCancelled {
		log.Printf("Job %s was cancelled, stopping execution", job.JobID)
		return
	}

	// Step 2: Train or setup model (80% progress)
	job.UpdateProgress(30)
	h.updateJobInDB(job)

	modelPath, err := h.trainModel(job, userModelDir, datasetPath)
	if err != nil {
		job.UpdateStatus(models.JobStatusFailed)
		job.UpdateError(fmt.Sprintf("Model training failed: %v", err))
		h.updateJobInDB(job)

		// Record failure metrics
		duration := time.Since(job.StartTime).Seconds()
		metrics.TrainingJobsFailedTotal.WithLabelValues(string(job.TrainingMode), string(job.DataMode)).Inc()
		metrics.TrainingJobsActive.Dec()
		metrics.TrainingJobDuration.WithLabelValues(string(job.TrainingMode), string(job.DataMode), "failed").Observe(duration)
		return
	}

	job.SetModelPath(modelPath)
	job.UpdateProgress(100)
	job.UpdateStatus(models.JobStatusCompleted)
	job.SetEndTime(time.Now())
	h.updateJobInDB(job)

	// Record completion metrics
	duration := time.Since(job.StartTime).Seconds()
	metrics.TrainingJobsCompletedTotal.WithLabelValues(string(job.TrainingMode), string(job.DataMode)).Inc()
	metrics.TrainingJobsActive.Dec()
	metrics.TrainingJobDuration.WithLabelValues(string(job.TrainingMode), string(job.DataMode), "completed").Observe(duration)

	log.Printf("Job %s completed successfully", job.JobID)
}

func (h *JobHandler) generateData(job *models.TrainingJob, outputDir string) (string, error) {
	log.Printf("Generating %s data for job %s", job.DataMode, job.JobID)

	// Create pipeline config for ocean2droplet
	configPath := filepath.Join(outputDir, fmt.Sprintf("config_%s.yaml", job.JobID))

	// Determine output path based on mode
	var outputDatasetPath string
	if job.DataMode == models.KnowledgeBaseMode {
		// Knowledge base mode outputs .md file
		domain := job.Config.Domain
		if domain == "" {
			domain = "knowledge_base"
		}
		// Simple sanitization (matching Python's sanitize_filename)
		safeName := strings.Map(func(r rune) rune {
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
				return r
			}
			return '_'
		}, domain)
		outputDatasetPath = filepath.Join(outputDir, safeName+".md")
	} else {
		// Q&A mode outputs .jsonl file
		outputDatasetPath = filepath.Join(outputDir, fmt.Sprintf("dataset_%s.jsonl", job.JobID))
	}

	// Create flat config structure (update_args expects flat keys, not nested)
	config := map[string]interface{}{
		"mode":                        string(job.DataMode),
		"service_llm_provider":        "google", // Use "google" for synthetic_water ServiceLLMClient
		"service_model_name":          h.cfg.GeminiModel,
		"synth_ds_id":                 outputDatasetPath,
		"push_synth_ds_to_hf_hub":     false,
		"domain":                      job.Config.Domain,
		"service_llm_gen_config_path": filepath.Join(h.cfg.Ocean2DropletPath, "config/service_gen_configs.yaml"),
		"prompt_tmpl_path":            filepath.Join(h.cfg.Ocean2DropletPath, "config/prompts.toml"),
	}

	if job.DataMode == models.QAMode {
		// Q&A mode - needs topic, num_samples, and sample Q&A pairs
		// Map audience to topic for Q&A mode
		if job.Config.Audience != "" {
			config["topic"] = job.Config.Audience
		} else {
			config["topic"] = "General Assistant" // default topic
		}

		if job.Config.NumSamples > 0 {
			config["num_samples"] = job.Config.NumSamples
		} else {
			config["num_samples"] = 100 // default
		}

		// Include sample Q&A pairs if provided
		if len(job.Config.SampleQAPairs) > 0 {
			samplePairs := make([]map[string]string, len(job.Config.SampleQAPairs))
			for i, pair := range job.Config.SampleQAPairs {
				samplePairs[i] = map[string]string{
					"question": pair.Question,
					"answer":   pair.Answer,
				}
			}
			config["sample_qa_pairs"] = samplePairs
		}

		// No reference dataset needed anymore - synthetic_water generates from scratch
	} else {
		// Knowledge Base mode - needs audience, min/max topics and words
		config["audience"] = job.Config.Audience
		if job.Config.MinTopics > 0 {
			config["min_topics"] = job.Config.MinTopics
		}
		if job.Config.MaxTopics > 0 {
			config["max_topics"] = job.Config.MaxTopics
		}
		if job.Config.MinWords > 0 {
			config["min_words"] = job.Config.MinWords
		}
		if job.Config.MaxWords > 0 {
			config["max_words"] = job.Config.MaxWords
		}
	}

	// Write config file
	data, err := yaml.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write config: %w", err)
	}

	// Run data generation using ocean2droplet
	cmd := exec.Command(
		h.cfg.PythonBin,
		filepath.Join(h.cfg.Ocean2DropletPath, "data_generator.py"),
		"--from-config", configPath,
	)

	// Set environment variables
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("GEMINI_API_KEY=%s", h.cfg.GeminiAPIKey),
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("data generation failed: %w, output: %s", err, string(output))
	}

	log.Printf("Data generation output: %s", string(output))

	return outputDatasetPath, nil
}

func (h *JobHandler) trainModel(job *models.TrainingJob, modelDir, datasetPath string) (string, error) {
	log.Printf("Training model for job %s using %s", job.JobID, job.TrainingMode)

	// Determine base model path
	baseModelPath := filepath.Join(h.cfg.BaseModelsDir, job.Config.BaseModel)
	if job.Config.BaseModel == "" {
		// Default to first available model if not specified
		entries, err := os.ReadDir(h.cfg.BaseModelsDir)
		if err != nil || len(entries) == 0 {
			return "", fmt.Errorf("no base models found in %s", h.cfg.BaseModelsDir)
		}
		for _, entry := range entries {
			if entry.IsDir() && !strings.HasPrefix(entry.Name(), ".") {
				baseModelPath = filepath.Join(h.cfg.BaseModelsDir, entry.Name())
				break
			}
		}
	}

	// Create training config
	configPath := filepath.Join(modelDir, "training_config.yaml")

	config := map[string]interface{}{
		"model_training": map[string]interface{}{
			"mode":            string(job.TrainingMode),
			"base_model_path": baseModelPath,
			"output_dir":      modelDir,
			"model_name":      job.ModelName,
		},
		"data_generation": map[string]interface{}{
			"mode": string(job.DataMode),
		},
	}

	if job.TrainingMode == models.FineTuneMode {
		fineTuneConfig := map[string]interface{}{
			"max_seq_length": 2048,
			"load_in_4bit":   true,
			"lora_r":         16,
			"lora_alpha":     16,
			"lora_dropout":   0,
			"target_modules": []string{"q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"},
			"epochs":         job.Config.Epochs,
			"learning_rate":  job.Config.LearningRate,
			"batch_size":     job.Config.BatchSize,
		}

		// Set defaults if not provided
		if job.Config.Epochs == 0 {
			fineTuneConfig["epochs"] = 3
		}
		if job.Config.LearningRate == 0 {
			fineTuneConfig["learning_rate"] = 2e-4
		}
		if job.Config.BatchSize == 0 {
			fineTuneConfig["batch_size"] = 4
		}

		config["model_training"].(map[string]interface{})["fine_tune"] = fineTuneConfig
	} else {
		// RAG mode - setup vector database path
		vectorDbDir := filepath.Join(modelDir, "vector_db")

		ragConfig := map[string]interface{}{
			"embedding_model":   "sentence-transformers/all-MiniLM-L6-v2",
			"chunk_size":        job.Config.ChunkSize,
			"chunk_overlap":     job.Config.ChunkOverlap,
			"top_k":             job.Config.TopK,
			"persist_directory": vectorDbDir,
			"max_new_tokens":    512,
			"temperature":       0.7,
			"top_p":             0.9,
		}

		// Set defaults if not provided
		if job.Config.ChunkSize == 0 {
			ragConfig["chunk_size"] = 500
		}
		if job.Config.ChunkOverlap == 0 {
			ragConfig["chunk_overlap"] = 50
		}
		if job.Config.TopK == 0 {
			ragConfig["top_k"] = 5
		}

		config["model_training"].(map[string]interface{})["rag"] = ragConfig
	}

	// Write config
	data, err := yaml.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("failed to marshal training config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write training config: %w", err)
	}

	// Run training using ocean2droplet
	cmd := exec.Command(
		h.cfg.PythonBin,
		filepath.Join(h.cfg.Ocean2DropletPath, "src/model_training/train_model.py"),
		"--config", configPath,
		"--dataset", datasetPath,
		"--mode", string(job.DataMode), // Pass the data mode (qa or knowledge_base)
	)

	// Capture stdout for real-time progress tracking
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("failed to create stdout pipe: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("failed to start training: %w", err)
	}

	// Track training progress from output
	done := make(chan bool)
	var outputBuffer bytes.Buffer

	go func() {
		scanner := bufio.NewScanner(io.MultiReader(stdout, stderr))
		epochPattern := regexp.MustCompile(`\{'loss':|'train_loss':`)
		currentProgress := 30.0
		progressPerEpoch := 65.0 / float64(job.Config.Epochs)
		if job.Config.Epochs == 0 {
			progressPerEpoch = 65.0 / 3.0 // default 3 epochs
		}

		for scanner.Scan() {
			line := scanner.Text()
			outputBuffer.WriteString(line + "\n")
			log.Printf("Training: %s", line)

			// Detect epoch completion
			if epochPattern.MatchString(line) {
				currentProgress += progressPerEpoch
				if currentProgress > 95 {
					currentProgress = 95
				}
				job.UpdateProgress(currentProgress)
				h.updateJobInDB(job)
				log.Printf("Job %s training progress: %.1f%%", job.JobID, currentProgress)
			}
		}
		done <- true
	}()

	// Wait for command to complete
	err = cmd.Wait()
	<-done // Wait for output processing to finish

	if err != nil {
		return "", fmt.Errorf("model training failed: %w, output: %s", err, outputBuffer.String())
	}

	log.Printf("Model training completed successfully")

	return modelDir, nil
}

// trackDataGenProgress monitors the data generation output file and updates progress based on actual content
func (h *JobHandler) trackDataGenProgress(job *models.TrainingJob, datasetDir string, stop <-chan bool) {
	// Determine output file path based on mode
	var datasetPath string
	if job.DataMode == models.KnowledgeBaseMode {
		// Knowledge base outputs .md file with sanitized domain name
		domain := job.Config.Domain
		if domain == "" {
			domain = "knowledge_base"
		}
		// Simple sanitization (matching Python's sanitize_filename)
		safeName := strings.Map(func(r rune) rune {
			if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
				return r
			}
			return '_'
		}, domain)
		datasetPath = filepath.Join(datasetDir, safeName+".md")
	} else {
		// Q&A mode outputs .jsonl file
		datasetPath = filepath.Join(datasetDir, fmt.Sprintf("dataset_%s.jsonl", job.JobID))
	}

	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Get target values from job config
	var maxWords, maxTopics int
	if job.DataMode == models.KnowledgeBaseMode {
		maxWords = job.Config.MaxWords
		maxTopics = job.Config.MaxTopics
		if maxWords == 0 {
			maxWords = 10000 // default
		}
		if maxTopics == 0 {
			maxTopics = 25 // default
		}
	} else {
		// For Q&A mode, use num_samples as the target
		maxTopics = job.Config.NumSamples
		if maxTopics == 0 {
			maxTopics = 100 // default
		}
		maxWords = 0 // not applicable for Q&A
	}

	for {
		select {
		case <-stop:
			log.Printf("Stopping progress tracking for job %s", job.JobID)
			return
		case <-ticker.C:
			// Check if job was cancelled or failed
			status := job.GetStatus()
			if status != models.JobStatusRunning {
				return
			}

			// Try to read the file
			content, err := os.ReadFile(datasetPath)
			if err != nil {
				// File doesn't exist yet, continue waiting
				continue
			}

			var wordCount, topicCount int

			if job.DataMode == models.KnowledgeBaseMode {
				// Count words in markdown content
				text := string(content)
				words := strings.Fields(text)
				wordCount = len(words)

				// Count topics (markdown headings with ## - main sections)
				lines := strings.Split(text, "\n")
				topicsMap := make(map[string]bool)
				for _, line := range lines {
					trimmed := strings.TrimSpace(line)
					// Match ## headings (not # or ###)
					if strings.HasPrefix(trimmed, "## ") && !strings.HasPrefix(trimmed, "### ") {
						topic := strings.TrimPrefix(trimmed, "## ")
						topic = strings.TrimSpace(topic)
						if topic != "" {
							topicsMap[topic] = true
						}
					}
				}
				topicCount = len(topicsMap)
			} else {
				// Q&A mode: parse JSONL
				lines := strings.Split(string(content), "\n")
				for _, line := range lines {
					line = strings.TrimSpace(line)
					if line == "" {
						continue
					}

					// Count this as a sample
					topicCount++

					// Parse JSON to count words
					var data map[string]interface{}
					if err := json.Unmarshal([]byte(line), &data); err != nil {
						continue
					}

					// Count words in question and answer
					if question, ok := data["question"].(string); ok {
						wordCount += len(strings.Fields(question))
					}
					if answer, ok := data["answer"].(string); ok {
						wordCount += len(strings.Fields(answer))
					}
				}
			}

			// Calculate progress (10% base + up to 10% for data generation)
			// Progress is based on how close we are to the targets
			var progress float64 = 10.0 // base progress

			if job.DataMode == models.KnowledgeBaseMode {
				// For knowledge base: average of word progress and topic progress
				wordProgress := 0.0
				if maxWords > 0 {
					wordProgress = float64(wordCount) / float64(maxWords)
					if wordProgress > 1.0 {
						wordProgress = 1.0
					}
				}

				topicProgress := float64(topicCount) / float64(maxTopics)
				if topicProgress > 1.0 {
					topicProgress = 1.0
				}

				avgProgress := (wordProgress + topicProgress) / 2.0
				progress += avgProgress * 10.0 // up to 10% for data generation
			} else {
				// For Q&A mode: based on number of samples
				sampleProgress := float64(topicCount) / float64(maxTopics)
				if sampleProgress > 1.0 {
					sampleProgress = 1.0
				}
				progress += sampleProgress * 10.0
			}

			// Update progress in job
			job.UpdateProgress(progress)
			h.updateJobInDB(job)

			log.Printf("Job %s data gen progress: %.1f%% (words: %d/%d, topics/samples: %d/%d)",
				job.JobID, progress, wordCount, maxWords, topicCount, maxTopics)
		}
	}
}

func (h *JobHandler) updateJobInDB(job *models.TrainingJob) {
	jobsCollection := database.GetCollection("training_jobs")

	// Create thread-safe snapshot of job data
	snapshot := job.ToResponse()

	update := bson.M{
		"$set": bson.M{
			"status":     snapshot.Status,
			"progress":   snapshot.Progress,
			"error":      snapshot.Error,
			"model_path": snapshot.ModelPath,
			"end_time":   snapshot.EndTime,
			"updated_at": time.Now(),
		},
	}

	_, err := jobsCollection.UpdateOne(
		context.Background(),
		bson.M{"job_id": snapshot.JobID},
		update,
	)

	if err != nil {
		log.Printf("Failed to update job %s in database: %v", snapshot.JobID, err)
	}
}
