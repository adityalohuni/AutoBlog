#!/bin/bash

# Ensure we are in the infra directory
cd "$(dirname "$0")"

# Helper function to show usage
show_help() {
    echo "AutoBlog Infrastructure CLI"
    echo "---------------------------"
    echo "Usage: ./manage.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy   --key <path>   Deploy to remote server (Push + Sync + Deploy)"
    echo "  push                    Build and push Docker images to ECR"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./manage.sh deploy --key ~/.ssh/my-key.pem"
    echo "  ./manage.sh push"
}

# Check if no arguments provided
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

COMMAND="$1"
shift

case "$COMMAND" in
    deploy)
        # Check for key argument
        KEY_PATH=""
        while [[ "$#" -gt 0 ]]; do
            case $1 in
                --key) KEY_PATH="$2"; shift ;;
                *) echo "Unknown parameter: $1"; exit 1 ;;
            esac
            shift
        done

        if [ -z "$KEY_PATH" ]; then
            echo "Error: --key <path_to_pem> is required for deployment."
            exit 1
        fi

        # Convert key path to absolute path if it's relative, because we change directory below
        if [[ "$KEY_PATH" != /* ]]; then
            KEY_PATH="$(pwd)/$KEY_PATH"
        fi

        echo "🚀 Starting Deployment..."
        # Run from scripts/local so relative paths inside the scripts work
        cd scripts/local && ./remote-deploy.sh --path "$KEY_PATH"
        ;;
    
    push)
        echo "📦 Starting Build & Push..."
        cd scripts/local && ./push.sh
        ;;
        
    help)
        show_help
        ;;
        
    *)
        echo "Unknown command: $COMMAND"
        show_help
        exit 1
        ;;
esac
