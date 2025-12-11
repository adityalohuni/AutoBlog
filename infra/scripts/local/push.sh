#!/bin/bash

# Load env vars if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
elif [ -f "../../.env" ]; then
  export $(grep -v '^#' ../../.env | xargs)
elif [ -f "../../../.env" ]; then
  export $(grep -v '^#' ../../../.env | xargs)
fi

# Validate required variables
if [ -z "$AWS_REGION" ] || [ -z "$ECR_REPO_URI" ]; then
  echo "Error: AWS_REGION and ECR_REPO_URI must be set in .env"
  exit 1
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | sudo docker login --username AWS --password-stdin $ECR_REPO_URI

# Build and Push Backend
echo "Building Backend..."
# Assumes script is run from infra/scripts/local/
sudo docker build --platform linux/amd64 -t $ECR_REPO_URI:backend-latest ../../../backend
echo "Pushing Backend..."
sudo docker push $ECR_REPO_URI:backend-latest

# Build and Push Frontend
echo "Building Frontend..."
sudo docker build --platform linux/amd64 -t $ECR_REPO_URI:frontend-latest ../../../frontend
echo "Pushing Frontend..."
sudo docker push $ECR_REPO_URI:frontend-latest

echo "✅ Build and Push Complete!"
echo "Now SSH into your server and run ./deploy.sh"
