#!/bin/bash

# Read JSON input from stdin
input_json=$(cat)

# Parse session_id and transcript_path using jq
session_id=$(echo "$input_json" | jq -r '.session_id // empty')
transcript_path=$(echo "$input_json" | jq -r '.transcript_path // empty')
tool_name=$(echo "$input_json" | jq -r '.tool_name // empty')

# Only proceed if we have essential data
if [[ -z "$session_id" || -z "$transcript_path" ]]; then
    exit 0
fi

# Create conversations directory structure
conversations_dir=".claude/conversations"
session_dir="$conversations_dir/$session_id"
session_file="$session_dir/conversation.json"

mkdir -p "$session_dir"

# Check if already captured
if [[ -f "$session_file" ]]; then
    echo "✓ Session already captured: $session_id" >&2
    exit 0
fi

# Create session data JSON
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
cat > "$session_file" <<EOF
{
  "sessionId": "$session_id",
  "transcriptPath": "$transcript_path",
  "capturedAt": "$timestamp",
  "firstToolUse": "$tool_name"
}
EOF

echo "✓ Session data captured: $session_id" >&2
exit 0