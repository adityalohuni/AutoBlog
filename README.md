# AutoBlog.ai

A modern, AI-powered blog platform that generates content using local LLMs and external APIs.

## Features

- **AI Content Generation:** Generate blog posts, summaries, and continuations using local models (via Web Workers) or Google Gemini Pro.
- **Text-to-Speech:** Convert articles to audio using local AI models.
- **RAG Pipeline:** Context-aware generation using EuropePMC and Wikipedia search.
- **Modern Stack:** Built with React, Node.js, TypeScript, and Docker.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **AI/ML:** Transformers.js (In-browser), Google Gemini API
- **Infrastructure:** Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (v18+)

### Running with Docker (Recommended)

1. Navigate to the infrastructure folder:
   ```bash
   cd infra
   ```

2. Start the services:
   ```bash
   docker-compose up --build
   ```

The application will be available at:
- Frontend: `http://localhost:80`
- Backend: `http://localhost:3000`

### Local Development

Since this project relies on specific environment configurations and local AI models, we recommend using Docker for all development tasks.

```bash
# Start the entire stack (Frontend, Backend, DB)
cd infra
docker-compose up --build
```

This ensures all dependencies, including the PostgreSQL database and AI model environments, are correctly provisioned.

## Project Structure

- `backend/`: Express.js API with Clean Architecture
- `frontend/`: React application with AI Web Workers
- `infra/`: Docker configuration and deployment scripts
- `docs/`: Architecture documentation
