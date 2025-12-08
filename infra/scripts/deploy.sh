#!/bin/bash

# Variables
AWS_REGION="us-east-1" # Change as needed
ECR_REPO_URI="<YOUR_ECR_REPO_URI>"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URI

# Pull latest images
docker pull $ECR_REPO_URI:backend-latest
docker pull $ECR_REPO_URI:frontend-latest

# Stop existing containers
docker stop backend frontend || true
docker rm backend frontend || true

# Run Backend
docker run -d --name backend \
  --network blog-net \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=blog_db \
  $ECR_REPO_URI:backend-latest

# Run Frontend
docker run -d --name frontend \
  --network blog-net \
  -p 80:80 \
  $ECR_REPO_URI:frontend-latest

# Prune old images
docker image prune -f
