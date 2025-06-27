#!/bin/bash

# APM Slack Coordinator Startup Script
# Usage: ./start-slack-coordinator.sh

echo "🚀 Starting APM Slack Coordinator..."

# Check for configuration
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json not found"
    echo "   Please run: tsx src/scripts/slack/setup-phase1.ts"
    exit 1
fi

# Start webhook server
echo "🔗 Starting webhook server..."
tsx src/scripts/slack/webhook-server.ts &
WEBHOOK_PID=$!

# Start channel manager and invite current user if possible
echo "📺 Setting up channels..."
if [ -n "$USER" ]; then
    echo "Attempting to invite user '$USER' to channels..."
    tsx src/scripts/slack/channel-manager.ts setup-meta "$USER" 2>/dev/null || \
    tsx src/scripts/slack/channel-manager.ts setup-meta
else
    tsx src/scripts/slack/channel-manager.ts setup-meta
fi

echo "✅ Slack coordination system running"
echo "   Webhook server PID: $WEBHOOK_PID"
echo "   Use Ctrl+C to stop"

# Wait for webhook server
wait $WEBHOOK_PID
