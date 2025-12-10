#!/bin/bash
# Update system and install Docker & Git
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose (Standalone)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Docker Buildx (Required for Compose Build)
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL "https://github.com/docker/buildx/releases/latest/download/buildx-linux-amd64" -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

# Load env vars if .env exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
elif [ -f "../.env" ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Create network
sudo docker network create blog-net || true

# Run Postgres
sudo docker run -d --name postgres \
  --network blog-net \
  --restart always \
  -e POSTGRES_USER="${POSTGRES_USER}" \
  -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  -e POSTGRES_DB="${POSTGRES_DB}" \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:13-alpine
