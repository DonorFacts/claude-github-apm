#!/bin/bash
# Watch Processes Module
# Manages background watch processes for APM system

# PID file for tracking watch processes
WATCH_PID_FILE="/tmp/apm-watch-processes.pid"

# Function to start watch processes on host if not already running
start_watch_processes() {
    # Start host-bridge daemon
    if [ -f "$WATCH_PID_FILE" ]; then
        WATCH_PID=$(cat "$WATCH_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$WATCH_PID" ] && kill -0 "$WATCH_PID" 2>/dev/null; then
            echo "📋 Host-bridge daemon already running (PID: $WATCH_PID)"
        else
            echo "🔄 Cleaning up stale PID file..."
            rm -f "$WATCH_PID_FILE"
            start_host_bridge_daemon
        fi
    else
        start_host_bridge_daemon
    fi
    
    # Start command watcher
    start_command_watcher_process
}

# Function to start host-bridge daemon
start_host_bridge_daemon() {
    echo "🚀 Starting host-bridge daemon on host..."
    # Ensure we're in the main directory where package.json exists
    if [ -d "$PROJECT_ROOT/main" ]; then
        cd "$PROJECT_ROOT/main"
    else
        cd "$PROJECT_ROOT"
    fi
    nohup pnpm start > /tmp/apm-host-bridge.log 2>&1 &
    WATCH_PID=$!
    echo "$WATCH_PID" > "$WATCH_PID_FILE"
    echo "✅ Host-bridge daemon started (PID: $WATCH_PID, logs: /tmp/apm-host-bridge.log)"
}

# Function to start command watcher
start_command_watcher_process() {
    # First stop any existing command watcher
    echo "🛑 Stopping any existing command watcher..."
    # Ensure we're in the main directory where package.json exists
    if [ -d "$PROJECT_ROOT/main" ]; then
        cd "$PROJECT_ROOT/main"
    else
        cd "$PROJECT_ROOT"
    fi
    pnpm run stop-command-watcher >/dev/null 2>&1 || true
    
    # Start new command watcher in background
    echo "🚀 Starting command watcher..."
    nohup pnpm run start-command-watcher > /tmp/apm-command-watcher.log 2>&1 &
    COMMAND_WATCHER_PID=$!
    echo "✅ Command watcher started (PID: $COMMAND_WATCHER_PID, logs: /tmp/apm-command-watcher.log)"
}

# Function to stop all watch processes
stop_watch_processes() {
    echo "🛑 Stopping all watch processes..."
    
    # Stop host-bridge daemon
    if [ -f "$WATCH_PID_FILE" ]; then
        WATCH_PID=$(cat "$WATCH_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$WATCH_PID" ] && kill -0 "$WATCH_PID" 2>/dev/null; then
            echo "🛑 Stopping host-bridge daemon (PID: $WATCH_PID)..."
            kill "$WATCH_PID" 2>/dev/null || true
        fi
        rm -f "$WATCH_PID_FILE"
    fi
    
    # Stop command watcher
    if [ -d "$PROJECT_ROOT/main" ]; then
        cd "$PROJECT_ROOT/main"
    else
        cd "$PROJECT_ROOT"
    fi
    pnpm run stop-command-watcher >/dev/null 2>&1 || true
    
    echo "✅ All watch processes stopped"
}