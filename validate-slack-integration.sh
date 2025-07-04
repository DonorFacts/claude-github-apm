#!/bin/bash

# Comprehensive Slack Integration Validation Script
echo "🔬 APM Slack Integration Validation"
echo "===================================="

# Check config file
echo "1. Checking configuration..."
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json missing"
    exit 1
fi

BOT_TOKEN=$(grep -o '"bot_token": *"[^"]*"' .slack-config.json | cut -d'"' -f4)
if [ "$BOT_TOKEN" = "PASTE_YOUR_BOT_TOKEN_HERE" ] || [ "$BOT_TOKEN" = "your-slack-bot-token-here" ]; then
    echo "❌ Bot token not configured"
    echo "   Update .slack-config.json with your actual Slack bot token"
    exit 1
fi

if [[ ! "$BOT_TOKEN" =~ ^xox ]]; then
    echo "❌ Bot token doesn't look valid (should start with 'xox')"
    exit 1
fi

echo "✅ Configuration looks valid"

# Test dependencies
echo "2. Checking dependencies..."
if ! pnpm list @slack/web-api > /dev/null 2>&1; then
    echo "❌ @slack/web-api not installed"
    exit 1
fi
echo "✅ Dependencies installed"

# Test webhook server startup
echo "3. Testing webhook server..."
tsx src/scripts/slack/webhook-server.ts &
SERVER_PID=$!
sleep 3

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health 2>/dev/null)
if [[ ! "$HEALTH_RESPONSE" =~ "healthy" ]]; then
    echo "❌ Webhook server health check failed"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo "✅ Webhook server running"

# Test Slack connectivity
echo "4. Testing Slack connectivity..."
SLACK_BOT_TOKEN="$BOT_TOKEN" tsx src/scripts/slack/channel-manager.ts list > /dev/null 2>&1
SLACK_EXIT_CODE=$?

# Clean up server
kill $SERVER_PID 2>/dev/null || true

if [ $SLACK_EXIT_CODE -ne 0 ]; then
    echo "❌ Slack API connection failed"
    echo "   Check your bot token and workspace permissions"
    exit 1
fi
echo "✅ Slack API connected"

# Test channel creation
echo "5. Testing channel creation..."
echo "   Creating meta channels..."
SLACK_BOT_TOKEN="$BOT_TOKEN" tsx src/scripts/slack/channel-manager.ts setup-meta
echo "   Creating project channels..."
SLACK_BOT_TOKEN="$BOT_TOKEN" tsx src/scripts/slack/channel-manager.ts setup-project claude-github-apm

echo ""
echo "🎉 All tests passed! APM Slack Integration is ready"
echo ""
echo "Next steps:"
echo "1. Start coordination: ./start-slack-coordinator.sh"
echo "2. In another terminal: tsx src/scripts/slack/cc-adapter.ts connect claude-github-apm frontend"
echo "3. Test status update: tsx src/scripts/slack/cc-adapter.ts status \"Testing APM integration\""
echo ""
echo "Check your Slack workspace for the new channels!"