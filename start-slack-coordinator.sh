#!/bin/bash

# APM Slack Coordinator Startup Script
# Usage: ./start-slack-coordinator.sh

echo "🚀 Starting APM Slack Coordinator..."

# Check for configuration
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json not found"
    echo "   Please update .slack-config.json with your Slack bot token"
    exit 1
fi

# Check for SLACK_BOT_TOKEN in config
BOT_TOKEN=$(grep -o '"bot_token": *"[^"]*"' .slack-config.json | cut -d'"' -f4)
if [ "$BOT_TOKEN" = "your-slack-bot-token-here" ]; then
    echo "❌ Please update .slack-config.json with your actual Slack bot token"
    echo "   Get your token from https://api.slack.com/apps"
    exit 1
fi

# Start webhook server
echo "🔗 Starting webhook server..."
tsx src/scripts/slack/webhook-server.ts &
WEBHOOK_PID=$!

echo "✅ Slack coordination system running"
echo "   Webhook server PID: $WEBHOOK_PID"
echo "   Use Ctrl+C to stop"

# Wait for webhook server
wait $WEBHOOK_PID
