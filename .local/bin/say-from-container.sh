#!/bin/bash

# Say from Container
# Allows Docker containers to use macOS 'say' command via host execution
# Usage: say-from-container.sh "message to speak"

MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
    echo "Usage: $0 \"message to speak\""
    exit 1
fi

# Check if running in container
if [ "$APM_CONTAINERIZED" = "true" ]; then
    # In container: write to shared speech queue
    SPEECH_QUEUE="/workspace/.local/speech-queue"
    echo "$MESSAGE" >> "$SPEECH_QUEUE"
    echo "🔊 Speech queued: $MESSAGE"
else
    # On host: use macOS say command directly
    say "$MESSAGE"
    echo "🔊 Spoke: $MESSAGE"
fi