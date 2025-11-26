# Droplet — Quick Guide

Droplet delivers a new class of practical, privacy-preserving AI pipelines.
We combine the reasoning power of frontier LLMs with the deployability of compact, self-hosted models—giving enterprises the accuracy they want without the operational expense they fear.

Our platform converts specialised domain requirements into efficient small-model solutions, enabling you to run secure, tailored AI systems entirely on your own infrastructure.

**NOTE: THIS PROJECT REQUIRES HIGH COMPUTE & CUDA CORES, WE PREFER RUNNING THIS ON STRONG GPU**

![WhatsApp Image 2025-11-25 at 20 34 40](https://github.com/user-attachments/assets/37cd954f-c773-48ba-867a-386bacc9228e)

![WhatsApp Image 2025-11-25 at 20 34 41](https://github.com/user-attachments/assets/5e27a080-0193-4700-8af4-c4145eca4275)

![WhatsApp Image 2025-11-26 at 00 18 12](https://github.com/user-attachments/assets/774082d4-b3be-421c-9aef-f00e26a30015)

![WhatsApp Image 2025-11-26 at 12 07 51](https://github.com/user-attachments/assets/f4bd0869-0b83-49f5-8c93-0058e4154d83)

Prerequisites

- MongoDB Atlas: create a free Atlas cluster and note the connection string (URI). Use that as `MONGODB_URI` when running the backend.
- Download a base model from Hugging Face (we used `Llama-3.2-3B-Instruct` for testing). Place the model files on disk where the backend can access them, for example `backend/base models/llama-3.2-3b-instruct/`.
- Docker (optional) to run Prometheus/Grafana or local services.

Environment (create these in your shell)

Create environment variables in your shell or in your deployment platform — do not commit secrets to source control. Example (values are placeholders):

export MONGODB_URI="<your-mongodb-atlas-connection-string>"
export MODEL_PATH="/absolute/path/to/backend/base models/llama-3.2-3b-instruct"
export PORT="8080"
export LOG_LEVEL="info"
export SECRET_KEY="<random-secret>"

Quick start

- Frontend

  - cd `frontend`
  - Install dependencies: `npm install` or `pnpm install`
  - Start dev server: `npm run dev`

- Backend

  - cd `backend`
  - Ensure `MONGODB_URI` and `MODEL_PATH` are exported in your shell (or set in your environment)
  - Run: `go run ./main.go` (or build and run the binary). Adjust `PORT` if needed.

- Monitoring
  - cd `monitoring`
  - Review `docker-compose.yml` and start: `docker compose up`

Notes

- Download models from Hugging Face and ensure the backend `MODEL_PATH` points to the downloaded files. Large model files are not included here.
- Use MongoDB Atlas as the database for ease of setup — supply the Atlas connection string in `MONGODB_URI`.
- Do not add `.env` or other secret-containing files to the repository. Keep credentials in your environment or a secure secrets manager.

![WhatsApp Image 2025-11-25 at 20 35 15](https://github.com/user-attachments/assets/d48ad4ae-a885-4941-aec2-b49ba06e79f4)

![WhatsApp Image 2025-11-25 at 20 35 15 (1)](https://github.com/user-attachments/assets/efb9c9ee-17e1-4d59-841f-8db6c0a829af)

**Tech Stack**

- **Backend:** Go (server) and Python (inference & tooling). Core HTTP/API server is implemented in Go; model inference and training utilities use Python.
- **Frontend:** Next.js (React + TypeScript)
- **Models & ML:** Hugging Face model hosting (download models such as `Llama-3.2-3B-Instruct`), PyTorch, Transformers, PEFT/QLoRA, Accelerate, BitsAndBytes.
- **RAG / Vector DB:** Chroma / Chromadb and SentenceTransformers for embeddings.
- **Monitoring & Alerting:** Prometheus and Grafana (Docker / Docker Compose friendly)
- **CI / CD & Automation:** Jenkins pipelines and Docker images; Docker Compose for local development environments.
- **Database:** MongoDB Atlas (recommended)
