# Architecture

## Overview
This project is a simple auto-generated blog built with React, Node.js, and PostgreSQL, deployed on AWS EC2 using Docker.

## Components

### Frontend
- **Tech Stack**: React (Vite)
- **Containerization**: Docker (Nginx)
- **Functionality**: Displays list of articles and single article view. Fetches data from Backend API.

### Backend
- **Tech Stack**: Node.js (Express)
- **Containerization**: Docker (Node:alpine)
- **Database**: PostgreSQL
- **AI Integration**: HuggingFace Inference API (Free Tier)
- **Automation**: `node-cron` schedules daily article generation.

### Database
- **Tech Stack**: PostgreSQL
- **Storage**: Docker volume (or RDS if configured)

## Deployment Pipeline

1. **Source Control**: GitHub
2. **Build**: AWS CodeBuild
   - Triggers on push to main branch.
   - Builds Docker images for Frontend and Backend.
   - Pushes images to AWS ECR.
3. **Deploy**: AWS EC2
   - EC2 instance runs Docker.
   - Pulls latest images from ECR.
   - Runs containers using Docker Compose or shell script.

## Folder Structure
- `backend/`: Node.js application
- `frontend/`: React application
- `infra/`: Infrastructure configuration (Docker Compose, Buildspec, Scripts)
