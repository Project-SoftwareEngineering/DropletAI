#!/bin/bash

# Droplet Backend Installation Script

set -e

echo "🌊 Droplet Backend Installation"
echo "================================"

# Check Go installation
echo "Checking Go installation..."
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.21 or higher."
    exit 1
fi

GO_VERSION=$(go version | awk '{print $3}')
echo "✅ Found Go: $GO_VERSION"

# Check Python installation
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✅ Found $PYTHON_VERSION"

# Install Go dependencies
echo ""
echo "Installing Go dependencies..."
go mod download
echo "✅ Go dependencies installed"

# Create necessary directories
echo ""
echo "Creating directories..."
mkdir -p user_models
mkdir -p logs
echo "✅ Directories created"

# Setup environment file
echo ""
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Verify ocean2droplet and synthetic_water paths
echo ""
echo "Verifying dependencies..."
if [ ! -d "../ocean2droplet" ]; then
    echo "⚠️  ocean2droplet not found at ../ocean2droplet"
    echo "   Please ensure ocean2droplet is in the correct location"
fi

if [ ! -d "../synthetic_water" ]; then
    echo "⚠️  synthetic_water not found at ../synthetic_water"
    echo "   Please ensure synthetic_water is in the correct location"
fi

echo ""
echo "================================"
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   - MONGODB_URI (MongoDB connection string)"
echo "   - GEMINI_API_KEY (Gemini API key)"
echo "   - JWT_SECRET (secure random string)"
echo "   - BASE_MODELS_DIR (path to base models directory, e.g., ../base models)"
echo ""
echo "2. Start the server:"
echo "   go run main.go"
echo ""
echo "3. Build for production:"
echo "   go build -o backend"
echo "   ./backend"
