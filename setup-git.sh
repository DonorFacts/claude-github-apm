#!/bin/bash
# Git configuration setup for container
# Reads .env file and configures git with bot credentials

set -e

echo "🔧 Setting up git configuration..."

# Check if .env file exists in main branch directory
ENV_FILE=""
if [ -f /workspace/main/.env ]; then
    ENV_FILE="/workspace/main/.env"
elif [ -f .env ]; then
    ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
    echo "📖 Loading git configuration from $ENV_FILE..."
    
    # Source the .env file
    source "$ENV_FILE"
    
    # Validate required variables
    if [ -n "$GIT_USER" ] && [ -n "$GIT_EMAIL" ] && [ -n "$GIT_TOKEN" ]; then
        # Configure git
        git config --global user.name "$GIT_USER"
        git config --global user.email "$GIT_EMAIL"
        git config --global credential.helper store
        git config --global init.defaultBranch main
        git config --global pull.rebase false
        
        # Sanitize token (remove any hidden characters)
        CLEAN_TOKEN=$(echo "$GIT_TOKEN" | tr -d '[:space:]' | tr -d '\0' | tr -d '\r\n')
        
        # Set up authentication
        echo "https://$GIT_USER:$CLEAN_TOKEN@github.com" > ~/.git-credentials
        chmod 600 ~/.git-credentials
        
        echo "✅ Git configured successfully for $GIT_USER ($GIT_EMAIL)"
        echo "🔐 GitHub authentication configured"
    else
        echo "❌ Missing required variables in .env file"
        echo "   Required: GIT_USER, GIT_EMAIL, GIT_TOKEN"
    fi
else
    echo "⚠️  No .env file found (checked /workspace/main/.env and .env)"
    echo "💡 Create .env file in /workspace/main/ with GIT_USER, GIT_EMAIL, GIT_TOKEN"
fi