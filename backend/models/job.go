package models

import (
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type TrainingMode string
type DataMode string

const (
	// Training modes
	FineTuneMode TrainingMode = "fine_tune"
	RAGMode      TrainingMode = "rag"

	// Data modes
	QAMode            DataMode = "qa"
	KnowledgeBaseMode DataMode = "knowledge_base"
)

type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusCompleted JobStatus = "completed"
	JobStatusFailed    JobStatus = "failed"
	JobStatusCancelled JobStatus = "cancelled"
)

type TrainingJob struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	JobID        string             `json:"job_id" bson:"job_id"`
	UserID       string             `json:"user_id" bson:"user_id"`
	Username     string             `json:"username" bson:"username"`
	ModelName    string             `json:"model_name" bson:"model_name"`
	TrainingMode TrainingMode       `json:"training_mode" bson:"training_mode"`
	DataMode     DataMode           `json:"data_mode" bson:"data_mode"`
	Status       JobStatus          `json:"status" bson:"status"`
	Progress     float64            `json:"progress" bson:"progress"`
	StartTime    time.Time          `json:"start_time" bson:"start_time"`
	EndTime      *time.Time         `json:"end_time,omitempty" bson:"end_time,omitempty"`
	ModelPath    string             `json:"model_path,omitempty" bson:"model_path,omitempty"`
	DatasetPath  string             `json:"dataset_path,omitempty" bson:"dataset_path,omitempty"`
	Error        string             `json:"error,omitempty" bson:"error,omitempty"`
	Config       TrainingConfig     `json:"config" bson:"config"`
	CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
	mu           sync.RWMutex       `json:"-" bson:"-"`
}

type QAPair struct {
	Question string `json:"question" bson:"question"`
	Answer   string `json:"answer" bson:"answer"`
}

type TrainingConfig struct {
	// Model selection
	BaseModel string `json:"base_model,omitempty" bson:"base_model,omitempty"`

	// Data generation settings
	NumSamples       int      `json:"num_samples" bson:"num_samples"`
	SampleQAPairs    []QAPair `json:"sample_qa_pairs,omitempty" bson:"sample_qa_pairs,omitempty"`
	ReferenceDataset string   `json:"reference_dataset,omitempty" bson:"reference_dataset,omitempty"`
	Domain           string   `json:"domain,omitempty" bson:"domain,omitempty"`
	Audience         string   `json:"audience,omitempty" bson:"audience,omitempty"`
	MinTopics        int      `json:"min_topics,omitempty" bson:"min_topics,omitempty"`
	MaxTopics        int      `json:"max_topics,omitempty" bson:"max_topics,omitempty"`
	MinWords         int      `json:"min_words,omitempty" bson:"min_words,omitempty"`
	MaxWords         int      `json:"max_words,omitempty" bson:"max_words,omitempty"`

	// Training settings (fine-tune)
	Epochs       int     `json:"epochs,omitempty" bson:"epochs,omitempty"`
	LearningRate float64 `json:"learning_rate,omitempty" bson:"learning_rate,omitempty"`
	BatchSize    int     `json:"batch_size,omitempty" bson:"batch_size,omitempty"`

	// RAG settings
	ChunkSize    int `json:"chunk_size,omitempty" bson:"chunk_size,omitempty"`
	ChunkOverlap int `json:"chunk_overlap,omitempty" bson:"chunk_overlap,omitempty"`
	TopK         int `json:"top_k,omitempty" bson:"top_k,omitempty"`
}

type CreateJobRequest struct {
	ModelName    string         `json:"model_name" binding:"required"`
	TrainingMode TrainingMode   `json:"training_mode" binding:"required,oneof=fine_tune rag"`
	DataMode     DataMode       `json:"data_mode" binding:"required,oneof=qa knowledge_base"`
	Config       TrainingConfig `json:"config" binding:"required"`
}

type JobResponse struct {
	ID           string       `json:"id"`
	JobID        string       `json:"job_id"`
	ModelName    string       `json:"model_name"`
	TrainingMode TrainingMode `json:"training_mode"`
	DataMode     DataMode     `json:"data_mode"`
	Status       JobStatus    `json:"status"`
	Progress     float64      `json:"progress"`
	StartTime    time.Time    `json:"start_time"`
	EndTime      *time.Time   `json:"end_time,omitempty"`
	ModelPath    string       `json:"model_path,omitempty"`
	Error        string       `json:"error,omitempty"`
}

// Thread-safe methods
func (j *TrainingJob) UpdateStatus(status JobStatus) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.Status = status
	j.UpdatedAt = time.Now()
}

func (j *TrainingJob) UpdateProgress(progress float64) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.Progress = progress
	j.UpdatedAt = time.Now()
}

func (j *TrainingJob) UpdateError(err string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.Error = err
	j.UpdatedAt = time.Now()
}

func (j *TrainingJob) SetModelPath(path string) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.ModelPath = path
	j.UpdatedAt = time.Now()
}

func (j *TrainingJob) SetEndTime(t time.Time) {
	j.mu.Lock()
	defer j.mu.Unlock()
	j.EndTime = &t
	j.UpdatedAt = time.Now()
}

func (j *TrainingJob) GetStatus() JobStatus {
	j.mu.RLock()
	defer j.mu.RUnlock()
	return j.Status
}

func (j *TrainingJob) GetProgress() float64 {
	j.mu.RLock()
	defer j.mu.RUnlock()
	return j.Progress
}

func (j *TrainingJob) ToResponse() JobResponse {
	j.mu.RLock()
	defer j.mu.RUnlock()

	resp := JobResponse{
		ID:           j.ID.Hex(),
		JobID:        j.JobID,
		ModelName:    j.ModelName,
		TrainingMode: j.TrainingMode,
		DataMode:     j.DataMode,
		Status:       j.Status,
		Progress:     j.Progress,
		StartTime:    j.StartTime,
		ModelPath:    j.ModelPath,
		Error:        j.Error,
	}

	if j.EndTime != nil {
		endTime := *j.EndTime
		resp.EndTime = &endTime
	}

	return resp
}
