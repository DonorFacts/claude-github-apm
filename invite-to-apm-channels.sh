#!/bin/bash

# Invite user to all APM channels
# Usage: ./invite-to-apm-channels.sh [username]

USERNAME=${1:-"jake"}

echo "🎯 Inviting '$USERNAME' to all APM channels..."

if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "❌ SLACK_BOT_TOKEN environment variable not set"
    echo "   Set it or ensure .slack-config.json has a valid token with users:read scope"
    exit 1
fi

echo "📺 Meta channels..."
SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" tsx src/scripts/slack/channel-manager.ts setup-meta "$USERNAME"

echo "📋 Project channels..."
SLACK_BOT_TOKEN="$SLACK_BOT_TOKEN" tsx src/scripts/slack/channel-manager.ts setup-project claude-github-apm "$USERNAME"

echo "✅ Invitation complete!"
echo ""
echo "Check your Slack sidebar - the APM channels should now appear!"
echo "If you still don't see them, manually join via Slack's 'Browse channels' feature."