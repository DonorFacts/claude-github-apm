#!/bin/bash
# Watch for events and process them automatically
# Usage: ./watch-events.sh

set -e

EVENT_QUEUE="apm/events/queue.jsonl"
POLL_INTERVAL=5  # seconds

echo "Watching for events in $EVENT_QUEUE..."
echo "Press Ctrl+C to stop"

# Ensure event directory exists
mkdir -p "$(dirname "$EVENT_QUEUE")"

# Main watch loop
while true; do
    if [ -s "$EVENT_QUEUE" ]; then
        echo "Processing new events..."
        ./scripts/session-tools/process-events.sh
    fi
    
    sleep "$POLL_INTERVAL"
done