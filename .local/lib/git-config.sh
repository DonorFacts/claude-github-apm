#!/bin/bash
# Git Configuration Module
# Handles automatic bot account setup for worktrees vs personal for main

# Auto-setup git configuration for bot account in worktrees
setup_host_git_config() {
    echo "🔧 Setting up automatic git configuration..."
    
    # Check if conditional git config already exists
    if grep -q "includeIf.*worktrees" "$HOME/.gitconfig" 2>/dev/null; then
        echo "✅ Git bot configuration already exists"
        return 0
    fi
    
    echo "📝 Creating automatic bot account configuration..."
    
    # Backup existing gitconfig if it exists
    if [ -f "$HOME/.gitconfig" ]; then
        cp "$HOME/.gitconfig" "$HOME/.gitconfig.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Backed up existing ~/.gitconfig"
    fi
    
    # Create main gitconfig with conditional inclusion
    cat > "$HOME/.gitconfig" << 'EOF'
[user]
    name = Jake Detels
    email = jake@detels.com

# Automatically use bot account for any worktrees directory
[includeIf "gitdir:**/worktrees/"]
    path = ~/.gitconfig-bot

[credential "https://github.com"]
    username = JakeDetels

[init]
    defaultBranch = main
[pull]
    rebase = false
[core]
    editor = code --wait
EOF

    # Create bot-specific configuration
    cat > "$HOME/.gitconfig-bot" << 'EOF'
[user]
    name = jakedetels-bot
    email = Jake.Detels+Bot@gmail.com

[credential "https://github.com"]
    username = jakedetels-bot
EOF

    # Set up bot authentication if token is available
    if [ -n "$GITHUB_BOT_TOKEN" ]; then
        echo "🔐 Configuring bot authentication..."
        git config --global credential.helper store
        echo "https://jakedetels-bot:${GITHUB_BOT_TOKEN}@github.com" >> ~/.git-credentials
        echo "✅ Bot authentication configured"
    else
        echo "⚠️  GITHUB_BOT_TOKEN not found - authentication will need manual setup"
    fi
    
    echo "✅ Git bot configuration complete"
}