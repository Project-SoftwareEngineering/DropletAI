.PHONY: help install build run test clean dev deps

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies and setup environment
	@echo "Installing dependencies..."
	@./install.sh

deps: ## Download Go dependencies
	@echo "Downloading Go dependencies..."
	@go mod download
	@go mod tidy

build: ## Build the backend binary
	@echo "Building backend..."
	@go build -o backend main.go
	@echo "Build complete: ./backend"

run: ## Run the backend server
	@echo "Starting backend server..."
	@go run main.go

dev: ## Run the backend in development mode with live reload (requires air)
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air is not installed. Install it with: go install github.com/cosmtrek/air@latest"; \
		echo "Running without live reload..."; \
		go run main.go; \
	fi

test: ## Run tests
	@echo "Running tests..."
	@go test -v ./...

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@rm -f backend
	@rm -f coverage.out coverage.html
	@echo "Clean complete"

format: ## Format Go code
	@echo "Formatting code..."
	@go fmt ./...

lint: ## Run linter
	@if command -v golangci-lint > /dev/null; then \
		golangci-lint run; \
	else \
		echo "golangci-lint is not installed. Install it from https://golangci-lint.run/"; \
	fi

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	@docker build -t droplet-backend .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	@docker run -p 8080:8080 --env-file .env droplet-backend

setup-dev: deps ## Setup development environment
	@echo "Setting up development environment..."
	@mkdir -p user_models logs
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@echo "Development environment ready!"
	@echo "Don't forget to configure .env file"

db-shell: ## Connect to MongoDB shell (requires mongosh)
	@if command -v mongosh > /dev/null; then \
		mongosh "$(MONGODB_URI)"; \
	else \
		echo "mongosh is not installed. Install MongoDB Shell from https://www.mongodb.com/try/download/shell"; \
	fi

.DEFAULT_GOAL := help
