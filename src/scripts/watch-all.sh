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

# Start host sound daemon with prefixed output (if it exists)
if [ -f "$PROJECT_ROOT/.local/bin/host-sound-daemon.sh" ]; then
    echo -e "${YELLOW}[WATCH-ALL]${NC} Starting sound daemon..."
    "$PROJECT_ROOT/.local/bin/host-sound-daemon.sh" 2>&1 | prefix_output "SOUND" "$RED" &
    SOUND_PID=$!
else
    echo -e "${YELLOW}[WATCH-ALL]${NC} Sound daemon not found (Docker-only feature)"
    SOUND_PID=""
fi

# Start host speech daemon with prefixed output (if it exists)
if [ -f "$PROJECT_ROOT/.local/bin/host-speech-daemon.sh" ]; then
    echo -e "${YELLOW}[WATCH-ALL]${NC} Starting speech daemon..."
    "$PROJECT_ROOT/.local/bin/host-speech-daemon.sh" 2>&1 | prefix_output "SPEECH" "$GREEN" &
    SPEECH_PID=$!
else
    echo -e "${YELLOW}[WATCH-ALL]${NC} Speech daemon not found (Docker-only feature)"
    SPEECH_PID=""
fi

# Start command sync watcher with prefixed output
echo -e "${YELLOW}[WATCH-ALL]${NC} Starting command sync watcher..."
cd "$PROJECT_ROOT" && pnpm run watch:commands 2>&1 | prefix_output "COMMANDS" "$BLUE" &
COMMANDS_PID=$!

# Future: Add more processes here
# Example:
# echo -e "${YELLOW}[WATCH-ALL]${NC} Starting event processor..."
# /workspace/src/scripts/watch-events.sh 2>&1 | prefix_output "EVENTS" "$YELLOW" &
# EVENTS_PID=$!

echo -e "${YELLOW}[WATCH-ALL]${NC} All processes started successfully."
echo -e "${YELLOW}[WATCH-ALL]${NC} Process PIDs:"
[ -n "$SOUND_PID" ] && echo -e "  ${RED}[SOUND]${NC}    PID: $SOUND_PID"
[ -n "$SPEECH_PID" ] && echo -e "  ${GREEN}[SPEECH]${NC}   PID: $SPEECH_PID"
echo -e "  ${BLUE}[COMMANDS]${NC} PID: $COMMANDS_PID"
echo -e "${YELLOW}[WATCH-ALL]${NC} Press Ctrl+C to stop all processes."

# Wait for all background processes
wait