#!/bin/bash
# Git Configuration Module
# Handles automatic bot account setup for worktrees vs personal for main

# Container git configuration - bot credentials only
setup_container_git_config() {
    echo "🔧 Setting up container bot git configuration..."
    
    # In container, git config is already set up via Dockerfile
    # Just verify credentials are configured if token is available
    if [ -n "$GITHUB_BOT_TOKEN" ] && [ ! -f ~/.git-credentials ]; then
        echo "🔐 Configuring bot authentication..."
        echo "https://jakedetels-bot:${GITHUB_BOT_TOKEN}@github.com" > ~/.git-credentials
        chmod 600 ~/.git-credentials
        echo "✅ Bot authentication configured"
    fi
    
    echo "✅ Container git configuration verified"
}

# Legacy function for host setup (now containerized)
setup_host_git_config() {
    echo "⚠️  Host git configuration disabled - using container-only bot credentials"
    echo "💡 Use container for all git operations to maintain bot identity"
}