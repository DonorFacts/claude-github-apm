#!/bin/bash

# Script to run multiple watch processes concurrently with organized output
# Uses bash job control and prefixed output for clarity

set -euo pipefail

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Color codes for different processes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to prefix output with process name and color
prefix_output() {
    local prefix=$1
    local color=$2
    while IFS= read -r line; do
        echo -e "${color}[${prefix}]${NC} ${line}"
    done
}

# Cleanup function to kill all child processes on exit
cleanup() {
    echo -e "\n${YELLOW}[WATCH-ALL]${NC} Shutting down all processes..."
    jobs -p | xargs -r kill 2>/dev/null || true
    wait
    echo -e "${YELLOW}[WATCH-ALL]${NC} All processes stopped."
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

echo -e "${YELLOW}[WATCH-ALL]${NC} Starting concurrent watch processes..."

# Start unified host-bridge daemon with prefixed output (if it exists)
if [ -f "$PROJECT_ROOT/.local/bin/host-bridge-daemon.sh" ]; then
    echo -e "${YELLOW}[WATCH-ALL]${NC} Starting unified host-bridge daemon (VS Code, audio, speech)..."
    "$PROJECT_ROOT/.local/bin/host-bridge-daemon.sh" 2>&1 | prefix_output "HOST-BRIDGE" "$MAGENTA" &
    BRIDGE_PID=$!
else
    echo -e "${YELLOW}[WATCH-ALL]${NC} Host-bridge daemon not found (Docker-only feature)"
    BRIDGE_PID=""
fi

# Start command sync watcher with prefixed output
echo -e "${YELLOW}[WATCH-ALL]${NC} Starting command sync watcher..."
cd "$PROJECT_ROOT" && pnpm run watch:commands 2>&1 | prefix_output "COMMANDS" "$BLUE" &
COMMANDS_PID=$!

<<<<<<< HEAD
# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local max_wait=${2:-10}
    local count=0
    
    while [ $count -lt $max_wait ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done
    return 1
}

# Clipboard bridge service removed - functionality deleted
echo -e "${YELLOW}[WATCH-ALL]${NC} Clipboard bridge service disabled (components removed)"
CLIPBOARD_PID=""

=======
>>>>>>> 5d3291809a761e16acb51670a9738c3d2d31485f
# Future: Add more processes here
# Example:
# echo -e "${YELLOW}[WATCH-ALL]${NC} Starting event processor..."
# /workspace/src/scripts/watch-events.sh 2>&1 | prefix_output "EVENTS" "$YELLOW" &
# EVENTS_PID=$!

echo -e "${YELLOW}[WATCH-ALL]${NC} All processes started successfully."
echo -e "${YELLOW}[WATCH-ALL]${NC} Process PIDs:"
[ -n "$BRIDGE_PID" ] && echo -e "  ${MAGENTA}[HOST-BRIDGE]${NC} PID: $BRIDGE_PID"
echo -e "  ${BLUE}[COMMANDS]${NC}    PID: $COMMANDS_PID"
<<<<<<< HEAD
echo -e "  ${CYAN}[CLIPBOARD]${NC}   Disabled (components removed)"
=======
>>>>>>> 5d3291809a761e16acb51670a9738c3d2d31485f
echo -e "${YELLOW}[WATCH-ALL]${NC} Press Ctrl+C to stop all processes."

# Wait for all background processes
wait