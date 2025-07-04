#!/bin/bash
# Command Watcher Module
# Starts command watcher for current worktree

# Get current worktree name
WORKTREE_NAME=$(basename "$PWD")
COMMAND_WATCHER_PID_FILE="/tmp/apm-command-watcher-${WORKTREE_NAME}.pid"

# Function to start command watcher for current worktree
start_command_watcher() {
    if [ -f "$COMMAND_WATCHER_PID_FILE" ]; then
        WATCHER_PID=$(cat "$COMMAND_WATCHER_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$WATCHER_PID" ] && kill -0 "$WATCHER_PID" 2>/dev/null; then
            echo "📋 Command watcher already running for $WORKTREE_NAME (PID: $WATCHER_PID)"
            return 0
        else
            echo "🔄 Cleaning up stale command watcher PID file..."
            rm -f "$COMMAND_WATCHER_PID_FILE"
        fi
    fi
    
    echo "🚀 Starting command watcher for $WORKTREE_NAME..."
    
    # Skip testing for now to avoid Ctrl+C issues - just verify prerequisites
    if ! command -v node >/dev/null 2>&1; then
        echo "❌ node not found in PATH"
        return 1
    fi
    
    if ! test -f ./src/utilities/system/host-command-watcher.js; then
        echo "❌ host-command-watcher.js not found"
        return 1
    fi
    
    echo "✅ Prerequisites verified, starting command watcher..."
    echo "📄 Logs will be saved to: /tmp/apm-command-watcher-${WORKTREE_NAME}.log"
    echo "🛑 Press Ctrl+C to stop the watcher"
    echo ""
    
    # Run in foreground and also log to file
    ./src/utilities/system/host-command-watcher.js 2>&1 | tee "/tmp/apm-command-watcher-${WORKTREE_NAME}.log"
}

# Function to stop command watcher for current worktree
stop_command_watcher() {
    echo "🛑 Stopping command watcher for $WORKTREE_NAME..."
    
    # Method 1: Try PID file if it exists
    if [ -f "$COMMAND_WATCHER_PID_FILE" ]; then
        WATCHER_PID=$(cat "$COMMAND_WATCHER_PID_FILE" 2>/dev/null || echo "")
        if [ -n "$WATCHER_PID" ] && kill -0 "$WATCHER_PID" 2>/dev/null; then
            echo "🎯 Found PID $WATCHER_PID, killing..."
            kill "$WATCHER_PID" 2>/dev/null
            sleep 1
            # Force kill if still running
            if kill -0 "$WATCHER_PID" 2>/dev/null; then
                echo "🔨 Force killing PID $WATCHER_PID..."
                kill -9 "$WATCHER_PID" 2>/dev/null
            fi
        fi
        rm -f "$COMMAND_WATCHER_PID_FILE"
    fi
    
    # Method 2: Kill by process name/command line (more reliable for host)
    echo "🔍 Searching for command watcher processes..."
    
    # Find processes running host-command-watcher.js
    PIDS=$(pgrep -f "host-command-watcher.js" 2>/dev/null || echo "")
    if [ -n "$PIDS" ]; then
        echo "🎯 Found host-command-watcher processes: $PIDS"
        for PID in $PIDS; do
            echo "🛑 Killing PID: $PID"
            kill "$PID" 2>/dev/null
        done
        sleep 1
        # Force kill any remaining
        REMAINING=$(pgrep -f "host-command-watcher.js" 2>/dev/null || echo "")
        if [ -n "$REMAINING" ]; then
            echo "🔨 Force killing remaining: $REMAINING"
            pkill -9 -f "host-command-watcher.js" 2>/dev/null
        fi
    fi
    
    # Also kill any tsx processes running command-processing
    PIDS=$(pgrep -f "command-processing.*--watch" 2>/dev/null || echo "")
    if [ -n "$PIDS" ]; then
        echo "🎯 Found command-processing processes: $PIDS"
        for PID in $PIDS; do
            echo "🛑 Killing PID: $PID"
            kill "$PID" 2>/dev/null
        done
        sleep 1
        # Force kill any remaining
        REMAINING=$(pgrep -f "command-processing.*--watch" 2>/dev/null || echo "")
        if [ -n "$REMAINING" ]; then
            echo "🔨 Force killing remaining: $REMAINING"
            pkill -9 -f "command-processing.*--watch" 2>/dev/null
        fi
    fi
    
    echo "✅ Command watcher cleanup completed"
}

# Check command line arguments
case "${1:-start}" in
    start)
        start_command_watcher
        ;;
    stop)
        stop_command_watcher
        ;;
    status)
        if [ -f "$COMMAND_WATCHER_PID_FILE" ]; then
            WATCHER_PID=$(cat "$COMMAND_WATCHER_PID_FILE" 2>/dev/null || echo "")
            if [ -n "$WATCHER_PID" ] && kill -0 "$WATCHER_PID" 2>/dev/null; then
                echo "📋 Command watcher running for $WORKTREE_NAME (PID: $WATCHER_PID)"
                echo "📄 Logs: /tmp/apm-command-watcher-${WORKTREE_NAME}.log"
            else
                echo "📋 Command watcher not running for $WORKTREE_NAME"
            fi
        else
            echo "📋 Command watcher not running for $WORKTREE_NAME"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status}"
        echo "  start   - Start command watcher for current worktree"
        echo "  stop    - Stop command watcher for current worktree"
        echo "  status  - Show command watcher status for current worktree"
        exit 1
        ;;
esac