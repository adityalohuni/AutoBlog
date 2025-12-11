#!/bin/bash

# Load env vars if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
elif [ -f "../../.env" ]; then
  export $(grep -v '^#' ../../.env | xargs)
elif [ -f "../../../backend/.env" ]; then
  # Fallback to backend/.env if running from scripts dir
  export $(grep -v '^#' "../../../backend/.env" | xargs)
fi

# Validate required variables
if [ -z "$AWS_REGION" ] || [ -z "$ECR_REPO_URI" ]; then
  echo "Error: AWS_REGION and ECR_REPO_URI must be set in .env"
  exit 1
fi


# Debug: Check AWS Identity
echo "Checking AWS Identity..."
aws sts get-caller-identity || { echo "❌ AWS credentials not found!"; exit 1; }

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REPO_URI

# Pull latest images
echo "Pulling images..."
sudo docker pull $ECR_REPO_URI:backend-latest
sudo docker pull $ECR_REPO_URI:frontend-latest

# Stop existing containers
sudo docker stop backend frontend || true
sudo docker rm backend frontend || true

# Ensure network exists
sudo docker network create blog-net || true

# Run Backend
# Requires ADMIN_USERNAME, ADMIN_PASSWORD to be set in environment or .env
sudo docker run -d --name backend \
  --network blog-net \
  --restart always \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=postgres \
  -e DB_USER="${POSTGRES_USER}" \
  -e DB_PASSWORD="${POSTGRES_PASSWORD}" \
  -e DB_NAME="${POSTGRES_DB}" \
  -e ADMIN_USERNAME="${ADMIN_USERNAME}" \
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD}" \
  -v models_cache:/app/models_cache \
  $ECR_REPO_URI:backend-latest

# Run Frontend
# Maps host port 80 to container port 8080 (nginx default in Dockerfile)
sudo docker run -d --name frontend \
  --network blog-net \
  --restart always \
  -p 80:8080 \
  $ECR_REPO_URI:frontend-latest

# Prune old images
sudo docker image prune -f
