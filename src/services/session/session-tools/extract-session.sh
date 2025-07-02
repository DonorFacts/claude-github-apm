#!/bin/bash
# Extract agent-specific session from Claude Code logs
# Usage: ./extract-session.sh <session_id> <role>

set -e

SESSION_ID=$1
ROLE=$2
MANIFEST_FILE="apm/agents/${ROLE}/sessions/manifest.jsonl"

if [ -z "$SESSION_ID" ] || [ -z "$ROLE" ]; then
    echo "Usage: $0 <session_id> <role>"
    echo "Example: $0 20241218_143022 prompt-engineer"
    exit 1
fi

# Find the session in manifest
MANIFEST_ENTRY=$(jq -c --arg id "$SESSION_ID" 'select(.session_id == $id)' "$MANIFEST_FILE" 2>/dev/null)

if [ -z "$MANIFEST_ENTRY" ]; then
    echo "Session $SESSION_ID not found for role $ROLE"
    exit 1
fi

# Extract session details
CC_LOG=$(echo "$MANIFEST_ENTRY" | jq -r '.cc_log_path')
START_TIME=$(echo "$MANIFEST_ENTRY" | jq -r '.started')
END_TIME=$(echo "$MANIFEST_ENTRY" | jq -r '.ended // empty')

# Expand the home directory path
CC_LOG_EXPANDED=$(eval echo "$CC_LOG")

if [ ! -f "$CC_LOG_EXPANDED" ]; then
    echo "Claude Code log not found: $CC_LOG_EXPANDED"
    exit 1
fi

echo "Extracting session from Claude Code logs..."
echo "Session: $SESSION_ID"
echo "Period: $START_TIME to ${END_TIME:-'ongoing'}"
echo "---"

# Extract relevant timeframe from CC log
if [ -z "$END_TIME" ]; then
    # Ongoing session - extract from start to now
    jq -c --arg start "$START_TIME" \
        'select(.timestamp >= $start)' \
        "$CC_LOG_EXPANDED"
else
    # Completed session - extract specific timeframe
    jq -c --arg start "$START_TIME" --arg end "$END_TIME" \
        'select(.timestamp >= $start and .timestamp <= $end)' \
        "$CC_LOG_EXPANDED"
fi