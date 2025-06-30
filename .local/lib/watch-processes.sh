#!/bin/bash
# Watch Processes Module
# Manages background watch processes for APM system

# PID file for tracking watch processes
WATCH_PID_FILE="/tmp/apm-watch-processes.pid"

# Function to start watch processes on host if not already running
start_watch_processes() {
    if [ -f "$WATCH_PID_FILE" ]; then
        WATCH_PID=$(cat "$WATCH_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$WATCH_PID" ] && kill -0 "$WATCH_PID" 2>/dev/null; then
            echo "📋 Watch processes already running (PID: $WATCH_PID)"
            return 0
        else
            echo "🔄 Cleaning up stale PID file..."
            rm -f "$WATCH_PID_FILE"
        fi
    fi
    
    echo "🚀 Starting watch processes on host..."
    cd "$PROJECT_ROOT"
    nohup pnpm start > /tmp/apm-watch.log 2>&1 &
    WATCH_PID=$!
    echo "$WATCH_PID" > "$WATCH_PID_FILE"
    echo "✅ Watch processes started (PID: $WATCH_PID, logs: /tmp/apm-watch.log)"
}