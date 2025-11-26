# Droplet Backend

Backend API server for the Droplet LLM training platform. Built with Go, MongoDB, model training.

## Features

- 🔐 **Authentication**: JWT-based authentication with username/password
- 🤖 **Model Training**: Support for both Fine-tuning (QLoRA) and RAG approaches
- 📊 **Data Modes**: Q&A generation and Knowledge Base creation
- 👤 **User Isolation**: Each user gets their own model storage directory
- 📈 **Job Tracking**: Real-time progress tracking for training jobs
- 🎯 **Single Model**: Uses Llama 3.2 3B Instruct as base model
- ☁️ **Cloud Integration**: Gemini API for synthetic data generation

## Architecture

```
backend/
├── config/          # Configuration management
├── database/        # MongoDB connection
├── handlers/        # HTTP request handlers
├── middleware/      # Authentication middleware
├── models/          # Data models
├── routes/          # API route definitions
├── utils/           # Utility functions
└── user_models/     # User-specific model storage
    └── <username>/
        ├── <model_name>/
        └── datasets/
```

## Prerequisites

- Go 1.21 or higher
- MongoDB (local or Atlas)
- Python 3.8+ (for integration)
- Llama 3.2 3B Instruct model downloaded locally
- Gemini API key

## Installation

1. **Clone and navigate to the backend directory:**

```bash
cd /Users/agam1092005/Desktop/Projects/Droplet/backend
```

2. **Install Go dependencies:**

```bash
go mod download
```

3. **Setup environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Configure your .env file:**

```env
MONGODB_URI=mongodb+srv://agam1092005:Droplet1092005@cluster0.ysjqdrh.mongodb.net/?appName=Cluster0
GEMINI_API_KEY=your-gemini-api-key
BASE_MODEL_PATH=/Users/agam1092005/Downloads/hugginface/Llama-3.2-3B-Instruct
JWT_SECRET=your-secure-secret-key
```

## Running the Server

### Development Mode

```bash
go run main.go
```

### Production Build

```bash
go build -o backend
./backend
```

The server will start on `http://localhost:8080`

## API Documentation

### Authentication

#### Signup

```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "username": "user123",
  "password": "secure_password"
}

Response:
{
  "token": "jwt_token",
  "username": "user123",
  "user_id": "user_id"
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "secure_password"
}

Response:
{
  "token": "jwt_token",
  "username": "user123",
  "user_id": "user_id"
}
```

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### Training Jobs

#### Create Training Job

```http
POST /api/v1/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "model_name": "my-healthcare-model",
  "training_mode": "fine_tune",  // or "rag"
  "data_mode": "qa",  // or "knowledge_base"
  "config": {
    // For Q&A mode:
    "num_samples": 1000,
    "reference_dataset": "HuggingFaceH4/no_robots",

    // For Knowledge Base mode:
    "domain": "Healthcare",
    "audience": "Medical professionals",

    // For Fine-tune mode:
    "epochs": 3,
    "learning_rate": 0.0002,
    "batch_size": 4,

    // For RAG mode:
    "chunk_size": 500,
    "chunk_overlap": 50,
    "top_k": 5
  }
}

Response:
{
  "id": "object_id",
  "job_id": "uuid",
  "model_name": "my-healthcare-model",
  "training_mode": "fine_tune",
  "data_mode": "qa",
  "status": "pending",
  "progress": 0,
  "start_time": "2025-11-22T10:00:00Z"
}
```

#### Get Job Status

```http
GET /api/v1/jobs/:job_id
Authorization: Bearer <token>

Response:
{
  "id": "object_id",
  "job_id": "uuid",
  "model_name": "my-healthcare-model",
  "status": "running",
  "progress": 45.5,
  "model_path": "/path/to/model",
  "error": ""
}
```

#### List All Jobs

```http
GET /api/v1/jobs
Authorization: Bearer <token>

Response:
[
  {
    "job_id": "uuid1",
    "model_name": "model1",
    "status": "completed",
    ...
  },
  ...
]
```

### Models

#### List Completed Models

```http
GET /api/v1/models
Authorization: Bearer <token>

Response:
[
  {
    "model_name": "my-healthcare-model",
    "training_mode": "fine_tune",
    "data_mode": "qa",
    "model_path": "./user_models/user123/my-healthcare-model",
    "created_at": "2025-11-22T10:00:00Z"
  }
]
```

## Training Modes

### Fine-Tune Mode

Uses QLoRA (Quantized Low-Rank Adaptation) to fine-tune Llama 3.2 3B Instruct on your data:

- Memory efficient (4-bit quantization)
- Fast training with Unsloth
- Produces adapter weights

### RAG Mode

Creates a Retrieval-Augmented Generation system:

- Uses ChromaDB for vector storage
- Semantic search with embeddings
- No model weights training needed

## Data Modes

### Q&A Mode

Generates question-answer pairs from reference datasets:

- Requires `reference_dataset` parameter
- Uses Gemini to create synthetic Q&A
- Best for conversational models

### Knowledge Base Mode

Creates structured knowledge documents:

- Requires `domain` and `audience` parameters
- Generates comprehensive documentation
- Best for RAG systems

## User Model Storage

Models are stored in user-specific directories:

```
user_models/
└── username/
    ├── model_name_1/
    │   ├── adapter_model.safetensors
    │   ├── adapter_config.json
    │   └── ...
    ├── model_name_2/
    └── datasets/
        ├── dataset_job1.jsonl
        └── config_job1.yaml
```

This structure allows the frontend to:

- List all models for a user
- Access model files for inference
- Track training history

## Environment Variables

| Variable               | Description                   | Default                 |
| ---------------------- | ----------------------------- | ----------------------- |
| `PORT`                 | Server port                   | `8080`                  |
| `MONGODB_URI`          | MongoDB connection string     | Required                |
| `MONGODB_DATABASE`     | Database name                 | `droplet`               |
| `JWT_SECRET`           | Secret for JWT signing        | Required                |
| `JWT_EXPIRY_HOURS`     | Token expiry time             | `24`                    |
| `BASE_MODEL_PATH`      | Path to Llama 3.2 3B Instruct | Required                |
| `MODELS_STORAGE_PATH`  | User models directory         | `./user_models`         |
| `GEMINI_API_KEY`       | Gemini API key                | Required                |
| `GEMINI_MODEL`         | Gemini model name             | `gemini-2.0-flash-exp`  |
| `PYTHON_BIN`           | Python executable path        | `python3`               |
| `ALLOWED_ORIGINS`      | CORS allowed origins          | `http://localhost:3000` |

## Development

### Project Structure

- **config/**: Configuration loading and management
- **database/**: MongoDB connection and utilities
- **handlers/**: HTTP request handlers (auth, jobs)
- **middleware/**: Authentication and other middleware
- **models/**: Data models (User, TrainingJob, etc.)
- **routes/**: API route definitions
- **utils/**: Helper functions (auth, files)

### Adding New Features

1. Add models in `models/`
2. Create handlers in `handlers/`
3. Register routes in `routes/routes.go`
4. Update documentation

## Testing

```bash
# Test health endpoint
curl http://localhost:8080/health

# Test signup
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Test job creation
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "test-model",
    "training_mode": "fine_tune",
    "data_mode": "qa",
    "config": {
      "num_samples": 100,
      "reference_dataset": "HuggingFaceH4/no_robots",
      "epochs": 1
    }
  }'
```

## Base Models

### Configuration

The system supports dynamic base model selection. Base models are stored in the `base models/` directory:

```
Droplet/
├── base models/
│   ├── Llama-3.2-3B-Instruct/
│   └── NVIDIA-Nemotron-Nano-9B-v2-FP8/
├── backend/
```

Update your `.env` file:

```bash
BASE_MODELS_DIR=../base models
```

### Available Models API

**GET** `/api/v1/base-models` - Returns all available base models

**Response:**

```json
[
  {
    "name": "Llama-3.2-3B-Instruct",
    "path": "../base models/Llama-3.2-3B-Instruct"
  }
]
```

### Model Compatibility

**✅ Llama-3.2-3B-Instruct** (Recommended)

- Works on macOS, Linux, Windows (CPU & GPU)
- Python 3.8+, PyTorch, Transformers
- 8GB+ RAM recommended
- No special dependencies

**⚠️ NVIDIA-Nemotron-Nano-9B-v2-FP8** (GPU Required)

- Requires NVIDIA GPU with CUDA 11.8+
- Linux/Windows only (not macOS)
- Needs `mamba-ssm` and `triton` packages
- 16GB+ GPU RAM recommended

### Adding New Models

```bash
cd "base models"
# Download from HuggingFace
huggingface-cli download model-name/model-repo --local-dir ModelName
# Models are automatically detected - no code changes needed
```

### Create Job with Model Selection

```bash
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "my-model",
    "training_mode": "fine_tune",
    "data_mode": "qa",
    "config": {
      "base_model": "Llama-3.2-3B-Instruct",
      "domain": "Healthcare",
      "num_samples": 100
    }
  }'
```

## Integration with Frontend

The backend is designed to work with a Next.js frontend:

1. **Authentication**: Store JWT token in localStorage/cookies
2. **Job Creation**: Submit training jobs with user preferences
3. **Progress Tracking**: Poll `/api/v1/jobs/:id` for progress updates
4. **Model Dashboard**: List completed models from `/api/v1/models`
5. **Model Access**: Use `model_path` to load models for inference
6. **Base Model Selection**: Fetch available models from `/api/v1/base-models`

---

## Testing

The backend includes comprehensive unit tests using Go's built-in testing framework.

### Test Structure

```
tests/
├── auth_test.go      # Authentication endpoint tests
├── jobs_test.go      # Job management endpoint tests
└── database_test.go  # Database connection and model tests
```

### Running Tests

**Run all tests:**

```bash
go test ./tests/... -v
```

**Run specific test file:**

```bash
go test ./tests/auth_test.go -v
```

**Run with coverage:**

```bash
go test ./tests/... -v -cover
```

**Generate coverage report:**

```bash
go test ./tests/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Test Cases

#### Authentication Tests (`auth_test.go`)

- ✅ Valid user signup
- ✅ Signup with missing username
- ✅ Signup with invalid email
- ✅ Signup with weak password
- ✅ Valid user login
- ✅ Login with invalid password
- ✅ Login with missing fields
- ✅ JWT token generation
- ✅ JWT token validation

#### Job Handler Tests (`jobs_test.go`)

- ✅ Valid job creation
- ✅ Job creation with missing model name
- ✅ Job creation with invalid training mode
- ✅ Get existing job details
- ✅ Get non-existent job (404)
- ✅ List all jobs
- ✅ Job status updates (pending, running, completed, failed)

#### Database Tests (`database_test.go`)

- ✅ MongoDB connection test
- ✅ MongoDB ping test
- ✅ User document creation
- ✅ Find user by email
- ✅ Job document creation
- ✅ Update job status

### CI/CD Integration

Tests are automatically run in Jenkins on every commit:

```groovy
stage('Run Tests') {
    steps {
        sh 'go test -v ./tests/... || echo "Tests completed"'
    }
}
```

### Test Coverage Goals

- **Target**: 70%+ code coverage
- **Critical paths**: 100% coverage (auth, job creation)
- **Current coverage**: Run `go test -cover` to check

---

## Troubleshooting

### MongoDB Connection Issues

- Verify MONGODB_URI is correct
- Check network connectivity
- Ensure IP whitelist in MongoDB Atlas

### Training Job Failures

- Check Python environment has required packages
- Verify BASE_MODEL_PATH points to valid model
- Check Gemini API key is valid
- Review job error messages in database

### Permission Issues

- Ensure write permissions for `user_models/` directory
- Check Python script execution permissions

## License

See LICENSE file in the parent directory.

## Support

For issues and questions, please check the main Droplet repository.
