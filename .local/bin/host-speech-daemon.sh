#!/bin/bash

# Host Speech Daemon
# Processes speech requests from Docker containers using macOS 'say' command

# Use the worktree's .local directory for the queue file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPEECH_QUEUE="$(dirname "$SCRIPT_DIR")/speech-queue"
mkdir -p "$(dirname "$SPEECH_QUEUE")"

echo "🗣️  Host speech daemon started. Waiting for speech requests..."
echo "   Queue file: $SPEECH_QUEUE"
echo "   Press Ctrl+C to stop"

# Process speech queue
while true; do
    if [ -f "$SPEECH_QUEUE" ] && [ -s "$SPEECH_QUEUE" ]; then
        # Read and speak each line
        while IFS= read -r message; do
            if [ -n "$message" ]; then
                echo "🔊 Speaking: $message"
                say "$message"
            fi
        done < "$SPEECH_QUEUE"
        # Clear the queue
        > "$SPEECH_QUEUE"
    fi
    sleep 0.5
done