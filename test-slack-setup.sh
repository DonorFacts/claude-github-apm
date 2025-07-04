#!/bin/bash

# Test APM Slack Integration Setup
echo "🧪 Testing Slack setup..."

# Check config file
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json missing"
    exit 1
fi

# Check if dependencies are installed
if ! pnpm list @slack/web-api > /dev/null 2>&1; then
    echo "❌ @slack/web-api not installed"
    exit 1
fi

# Check if scripts exist
if [ ! -f "src/scripts/slack/webhook-server.ts" ]; then
    echo "❌ webhook-server.ts missing"
    exit 1
fi

echo "✅ Basic setup validation passed"
echo "   Next: Update .slack-config.json with your bot token"
echo "   Then: ./start-slack-coordinator.sh"
