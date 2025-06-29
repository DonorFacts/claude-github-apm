#!/bin/bash

# Host Sound Daemon
# Watches for sound requests from Docker containers and plays them on macOS

# Use the worktree's .local directory for the queue file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOUND_QUEUE="$(dirname "$SCRIPT_DIR")/sound-queue"
mkdir -p "$(dirname "$SOUND_QUEUE")"

echo "🎵 Host sound daemon started. Watching for container sound requests..."
echo "   Queue file: $SOUND_QUEUE"

# Simple polling loop - check every 0.5 seconds
while true; do
    if [ -f "$SOUND_QUEUE" ] && [ -s "$SOUND_QUEUE" ]; then
        # File exists and is not empty
        echo "🔔 Sound request detected!"
        # Play the Hero sound
        afplay /System/Library/Sounds/Hero.aiff
        # Clear the queue
        > "$SOUND_QUEUE"
        echo "✅ Played Hero.aiff"
    fi
    sleep 0.5
done