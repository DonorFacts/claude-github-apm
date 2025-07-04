#!/bin/bash
# Simulate an agent sending a heartbeat update

set -e

session_id="${1:-ui-dev-002-20250701}"
echo "💓 Simulating heartbeat for session: $session_id"

# Update the session's last_heartbeat to current time
registry_file="../apm/sessions/registry.json"
temp_file="/tmp/apm_registry_temp.json"
current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update the heartbeat for the specified session
jq --arg session_id "$session_id" --arg timestamp "$current_time" '
  .sessions = (.sessions | map(
    if .id == $session_id 
    then .last_heartbeat = $timestamp 
    else . 
    end
  ))
' "$registry_file" > "$temp_file"

mv "$temp_file" "$registry_file"

echo "✅ Updated heartbeat for $session_id to $current_time"
echo ""
echo "Now run: ./apm/scripts/apm list"