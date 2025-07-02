#!/bin/bash
# Container Git Configuration Initialization
# Automatically configures git with proper GitHub credentials for containerized environment

set -e

echo "🐳 Initializing container git configuration..."

# Detect if we're in a container
if [ -f /.dockerenv ] || [ -n "$APM_CONTAINERIZED" ]; then
    echo "✅ Container environment detected"
    
    # Check if git is already configured with real values (not placeholders)
    CURRENT_NAME=$(git config --global user.name 2>/dev/null || echo "")
    CURRENT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
    
    if [ "$CURRENT_NAME" = "Your Name" ] || [ "$CURRENT_NAME" = "" ] || 
       [ "$CURRENT_EMAIL" = "your.email@example.com" ] || [ "$CURRENT_EMAIL" = "" ]; then
        
        echo "⚠️  Git not configured or using placeholder values"
        echo "   Current name: '$CURRENT_NAME'"
        echo "   Current email: '$CURRENT_EMAIL'"
        
        # Try to detect from host git config (prioritize global, then repo-level)
        HOST_GLOBAL_NAME=""
        HOST_GLOBAL_EMAIL=""
        
        # Check if host git global config is accessible via mounted volumes
        if [ -f /host/home/.gitconfig ]; then
            # If host .gitconfig is mounted, copy it to container for proper includeIf processing
            cp /host/home/.gitconfig /home/user/.gitconfig 2>/dev/null || true
            
            # Also copy bot config if it exists
            if [ -f /host/home/.gitconfig-bot ]; then
                cp /host/home/.gitconfig-bot /home/user/.gitconfig-bot 2>/dev/null || true
                echo "🤖 Bot configuration detected and copied"
            fi
            
            # Test current directory git config (may be bot config if in worktrees)
            HOST_GLOBAL_NAME=$(git config user.name 2>/dev/null || echo "")
            HOST_GLOBAL_EMAIL=$(git config user.email 2>/dev/null || echo "")
        elif [ -f "$HOME/.gitconfig" ] && [ "$HOME" != "/home/user" ]; then
            # If running with host user's home directory mounted
            HOST_GLOBAL_NAME=$(git config --global user.name 2>/dev/null || echo "")
            HOST_GLOBAL_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
        fi
        
        # Check repository-level config as fallback
        if [ -f /workspace/.git/config ]; then
            REPO_NAME=$(git config user.name 2>/dev/null || echo "")
            REPO_EMAIL=$(git config user.email 2>/dev/null || echo "")
        fi
        
        # Prioritize host global config, then repo config, then defaults
        if [ -n "$HOST_GLOBAL_NAME" ] && [ -n "$HOST_GLOBAL_EMAIL" ] && 
           [ "$HOST_GLOBAL_NAME" != "Your Name" ] && [ "$HOST_GLOBAL_EMAIL" != "your.email@example.com" ]; then
            echo "🔍 Using host global git config:"
            echo "   Name: $HOST_GLOBAL_NAME"
            echo "   Email: $HOST_GLOBAL_EMAIL"
            git config --global user.name "$HOST_GLOBAL_NAME"
            git config --global user.email "$HOST_GLOBAL_EMAIL"
        elif [ -n "$REPO_NAME" ] && [ -n "$REPO_EMAIL" ] && 
             [ "$REPO_NAME" != "Your Name" ] && [ "$REPO_EMAIL" != "your.email@example.com" ]; then
            echo "🔍 Using repository-level git config:"
            echo "   Name: $REPO_NAME"
            echo "   Email: $REPO_EMAIL"
            git config --global user.name "$REPO_NAME"
            git config --global user.email "$REPO_EMAIL"
        else
            # Set sensible defaults for Jake's repository
            echo "🔧 Setting default configuration for DonorFacts/claude-github-apm"
            git config --global user.name "Jake Detels"
            git config --global user.email "jake@detels.com"
        fi
        
        # Configure additional git settings for container environment
        git config --global init.defaultBranch main
        git config --global pull.rebase false
        git config --global core.editor "code --wait"
        git config --global credential.helper "!gh auth git-credential"
        
        echo "✅ Git configured successfully"
        git config --global --list | grep user
    else
        echo "✅ Git already configured with real values"
        echo "   Name: $CURRENT_NAME"
        echo "   Email: $CURRENT_EMAIL"
    fi
    
    # Check for GitHub CLI authentication
    if command -v gh >/dev/null 2>&1; then
        if ! gh auth status >/dev/null 2>&1; then
            echo "⚠️  GitHub CLI not authenticated"
            echo "   Run 'gh auth login' to authenticate for push operations"
        else
            echo "✅ GitHub CLI authenticated"
        fi
    fi
    
else
    echo "💻 Host environment detected - skipping container-specific git setup"
fi

echo "🎯 Container git initialization complete"