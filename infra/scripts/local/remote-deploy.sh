#!/bin/bash

# Default values
PEM_PATH=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --path) PEM_PATH="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Validate PEM path
if [ -z "$PEM_PATH" ]; then
    echo "Error: --path <pem_file_path> is required"
    echo "Usage: ./remote-deploy.sh --path /path/to/key.pem"
    exit 1
fi

if [ ! -f "$PEM_PATH" ]; then
    echo "Error: PEM file not found at $PEM_PATH"
    exit 1
fi

# Load env vars
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
elif [ -f "../../.env" ]; then
  export $(grep -v '^#' ../../.env | xargs)
elif [ -f "../../../.env" ]; then
  export $(grep -v '^#' ../../../.env | xargs)
fi

# Validate required env vars
if [ -z "$EC2_HOST" ] || [ -z "$SSH_USER" ]; then
  echo "Error: EC2_HOST and SSH_USER must be set in .env"
  exit 1
fi

echo "🚀 Starting Remote Deployment..."

# 1. Build and Push Images
echo "📦 Step 1: Building and Pushing Docker Images..."
./push.sh
if [ $? -ne 0 ]; then
    echo "❌ Build/Push failed."
    exit 1
fi

# 2. Sync Configuration and Scripts
echo "🔄 Step 2: Syncing 'infra' folder to server..."
# Ensure target directory exists
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_HOST" "mkdir -p ~/AutoBlog"

# Sync infra folder (excludes node_modules if any, though unlikely in infra)
# We sync from ../../../infra to ~/AutoBlog/infra
rsync -avz -e "ssh -i $PEM_PATH -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.DS_Store' \
    ../../../infra/ \
    "$SSH_USER@$EC2_HOST:~/AutoBlog/infra/"

if [ $? -ne 0 ]; then
    echo "❌ File sync failed."
    exit 1
fi

# Fetch Local AWS Credentials to pass to server
echo "🔑 Fetching local AWS credentials..."
LOCAL_ACCESS_KEY=$(aws configure get aws_access_key_id)
LOCAL_SECRET_KEY=$(aws configure get aws_secret_access_key)
LOCAL_SESSION_TOKEN=$(aws configure get aws_session_token)
CRED_EXPORTS=""

if [ -n "$LOCAL_ACCESS_KEY" ]; then
    echo "✅ Found local credentials. Passing to server..."
    CRED_EXPORTS="export AWS_ACCESS_KEY_ID='$LOCAL_ACCESS_KEY'; export AWS_SECRET_ACCESS_KEY='$LOCAL_SECRET_KEY';"
    if [ -n "$LOCAL_SESSION_TOKEN" ]; then
        CRED_EXPORTS="$CRED_EXPORTS export AWS_SESSION_TOKEN='$LOCAL_SESSION_TOKEN';"
    fi
    # Also pass the region
    CRED_EXPORTS="$CRED_EXPORTS export AWS_REGION='$AWS_REGION';"
fi

# 3. Execute Deploy Script on Server
echo "🚀 Step 3: Executing deployment on server..."
ssh -i "$PEM_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$EC2_HOST" "$CRED_EXPORTS cd ~/AutoBlog/infra/scripts/server && chmod +x deploy.sh && ./deploy.sh"

echo "✅ Deployment Complete!"
