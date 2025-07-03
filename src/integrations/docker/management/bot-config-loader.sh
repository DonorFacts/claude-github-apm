#!/bin/bash
# Bot Configuration Loader
# Reads bot git configuration from host and exports environment variables

# Function to extract git config value from file
extract_git_config() {
    local file="$1"
    local key="$2"
    
    if [ -f "$file" ]; then
        grep -A 10 "\[user\]" "$file" | grep "$key" | sed 's/.*= *//' | tr -d ' '
    fi
}

# Load bot configuration from host ~/.gitconfig-bot
load_bot_config() {
    local bot_config_file="$HOME/.gitconfig-bot"
    
    if [ ! -f "$bot_config_file" ]; then
        echo "⚠️  Bot configuration file not found: $bot_config_file"
        echo "💡 Create ~/.gitconfig-bot with bot user credentials"
        return 1
    fi
    
    echo "📖 Loading bot configuration from $bot_config_file"
    
    # Extract bot credentials from gitconfig-bot file
    export BOT_GIT_NAME=$(extract_git_config "$bot_config_file" "name")
    export BOT_GIT_EMAIL=$(extract_git_config "$bot_config_file" "email")
    
    # Extract username from credential section
    export BOT_GIT_USERNAME=$(grep -A 5 '\[credential "https://github.com"\]' "$bot_config_file" | grep "username" | sed 's/.*= *//' | tr -d ' ')
    
    if [ -n "$BOT_GIT_NAME" ] && [ -n "$BOT_GIT_EMAIL" ] && [ -n "$BOT_GIT_USERNAME" ]; then
        echo "✅ Bot configuration loaded:"
        echo "   Name: $BOT_GIT_NAME"
        echo "   Email: $BOT_GIT_EMAIL"
        echo "   GitHub Username: $BOT_GIT_USERNAME"
        return 0
    else
        echo "❌ Incomplete bot configuration in $bot_config_file"
        echo "   Expected: [user] name, email, and [credential] username"
        return 1
    fi
}

# Load bot config when sourced
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
    # Being sourced
    load_bot_config
else
    # Being executed directly
    echo "Bot Configuration Loader"
    echo "Usage: source bot-config-loader.sh"
    load_bot_config
    echo ""
    echo "Environment variables set:"
    echo "BOT_GIT_NAME='$BOT_GIT_NAME'"
    echo "BOT_GIT_EMAIL='$BOT_GIT_EMAIL'" 
    echo "BOT_GIT_USERNAME='$BOT_GIT_USERNAME'"
fi