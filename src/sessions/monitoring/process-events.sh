#!/bin/bash
# Process events from the APM event queue
# Can be run manually or via cron/file watcher

set -e

EVENT_QUEUE="apm/events/queue.jsonl"
PROCESSED_DIR="apm/events/processed"
LOCK_FILE="apm/events/.processing.lock"

# Ensure directories exist
mkdir -p "$PROCESSED_DIR"

# Prevent concurrent processing
if [ -f "$LOCK_FILE" ]; then
    echo "Another process is already running"
    exit 0
fi

trap "rm -f $LOCK_FILE" EXIT
touch "$LOCK_FILE"

# Process each event
while IFS= read -r event; do
    [ -z "$event" ] && continue
    
    EVENT_TYPE=$(echo "$event" | jq -r '.event')
    TIMESTAMP=$(echo "$event" | jq -r '.timestamp')
    
    case "$EVENT_TYPE" in
        "session_start")
            ROLE=$(echo "$event" | jq -r '.role')
            SESSION_ID=$(echo "$event" | jq -r '.session_id')
            echo "[${TIMESTAMP}] Session started: $ROLE ($SESSION_ID)"
            ;;
            
        "session_end")
            ROLE=$(echo "$event" | jq -r '.role')
            SESSION_ID=$(echo "$event" | jq -r '.session_id')
            echo "[${TIMESTAMP}] Session ended: $ROLE ($SESSION_ID)"
            
            # Trigger post-processing
            if [ -f "src/scripts/session-tools/post-process-session.sh" ]; then
                echo "Running post-processing for session $SESSION_ID..."
                ./src/scripts/session-tools/post-process-session.sh "$SESSION_ID" "$ROLE"
            fi
            ;;
            
        "session_idle")
            DURATION=$(echo "$event" | jq -r '.duration_minutes')
            echo "[${TIMESTAMP}] Session idle for $DURATION minutes"
            ;;
            
        "milestone")
            DESC=$(echo "$event" | jq -r '.description')
            echo "[${TIMESTAMP}] Milestone: $DESC"
            ;;
            
        "commit")
            SHA=$(echo "$event" | jq -r '.sha')
            MSG=$(echo "$event" | jq -r '.message')
            echo "[${TIMESTAMP}] Commit: $SHA - $MSG"
            ;;
            
        *)
            echo "[${TIMESTAMP}] Unknown event type: $EVENT_TYPE"
            ;;
    esac
    
done < "$EVENT_QUEUE"

# Archive processed events
if [ -s "$EVENT_QUEUE" ]; then
    ARCHIVE_FILE="$PROCESSED_DIR/events_$(date +%Y%m%d_%H%M%S).jsonl"
    mv "$EVENT_QUEUE" "$ARCHIVE_FILE"
    echo "Archived events to $ARCHIVE_FILE"
fi

# Create new empty queue
touch "$EVENT_QUEUE"