#!/bin/bash

# Host-Bridge Daemon
# Unified container-host communication daemon
# Processes requests for vscode, audio, and speech services

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/host-bridge"
REQUESTS_DIR="$BRIDGE_DIR/requests"
RESPONSES_DIR="$BRIDGE_DIR/responses"
CONFIG_DIR="$BRIDGE_DIR/config"
LOGS_DIR="$BRIDGE_DIR/logs"
PID_FILE="$CONFIG_DIR/daemon.pid"
LOG_FILE="$LOGS_DIR/bridge.log"

# Ensure directories exist
mkdir -p "$REQUESTS_DIR" "$RESPONSES_DIR" "$CONFIG_DIR" "$LOGS_DIR"

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Check if daemon is already running
if [ -f "$PID_FILE" ]; then
    if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log "ERROR" "Daemon already running (PID: $(cat "$PID_FILE"))"
        exit 1
    else
        log "INFO" "Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Store daemon PID
echo $$ > "$PID_FILE"

# Cleanup function
cleanup() {
    log "INFO" "Shutting down host-bridge daemon"
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGTERM SIGINT

log "INFO" "Host-Bridge daemon started (PID: $$)"
log "INFO" "Bridge directory: $BRIDGE_DIR"
log "INFO" "Processing requests for: vscode, audio, speech"

# Path translation for container-to-host paths
translate_container_path() {
    local container_path="$1"
    local project_root="$(cd "$SCRIPT_DIR/../.." && pwd)"
    
    if [[ "$container_path" == /workspace/main* ]]; then
        echo "${project_root}${container_path#/workspace/main}"
    elif [[ "$container_path" == /workspace/worktrees/* ]]; then
        local worktree_name="${container_path#/workspace/worktrees/}"
        echo "$(dirname "${project_root}")/worktrees/${worktree_name}"
    elif [[ "$container_path" == /workspace* ]]; then
        echo "${project_root}${container_path#/workspace}"
    else
        echo "$container_path"
    fi
}

# Service handlers
handle_vscode() {
    local request="$1"
    local action=$(echo "$request" | jq -r '.action')
    local path=$(echo "$request" | jq -r '.payload.path')
    local request_id=$(echo "$request" | jq -r '.id')
    
    log "INFO" "VS Code request: $action $path"
    
    case "$action" in
        "open")
            local host_path=$(translate_container_path "$path")
            log "INFO" "Translated path: $path -> $host_path"
            
            if [ ! -d "$host_path" ]; then
                local error_msg="Path does not exist: $host_path"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/vscode.response"
                return 1
            fi
            
            if ! command -v code &> /dev/null; then
                local error_msg="VS Code command not found"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/vscode.response"
                return 1
            fi
            
            if code "$host_path"; then
                log "INFO" "VS Code opened successfully: $host_path"
                echo "{\"id\":\"$request_id\",\"status\":\"success\",\"message\":\"VS Code opened successfully\",\"data\":{\"path\":\"$host_path\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/vscode.response"
            else
                local error_msg="Failed to open VS Code"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/vscode.response"
                return 1
            fi
            ;;
        *)
            local error_msg="Unknown VS Code action: $action"
            log "ERROR" "$error_msg"
            echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/vscode.response"
            return 1
            ;;
    esac
}

handle_audio() {
    local request="$1"
    local action=$(echo "$request" | jq -r '.action')
    local sound=$(echo "$request" | jq -r '.payload.sound')
    local volume=$(echo "$request" | jq -r '.payload.volume // 1.0')
    local request_id=$(echo "$request" | jq -r '.id')
    
    log "INFO" "Audio request: $action $sound (volume: $volume)"
    
    case "$action" in
        "play")
            # Try different sound locations
            local sound_paths=(
                "/System/Library/Sounds/$sound"
                "/System/Library/Sounds/$sound.aiff"
                "$sound"
            )
            
            local sound_file=""
            for path in "${sound_paths[@]}"; do
                if [ -f "$path" ]; then
                    sound_file="$path"
                    break
                fi
            done
            
            if [ -z "$sound_file" ]; then
                local error_msg="Sound file not found: $sound"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/audio.response"
                return 1
            fi
            
            if afplay "$sound_file"; then
                log "INFO" "Audio played successfully: $sound_file"
                echo "{\"id\":\"$request_id\",\"status\":\"success\",\"message\":\"Audio played successfully\",\"data\":{\"sound\":\"$sound_file\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/audio.response"
            else
                local error_msg="Failed to play audio"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/audio.response"
                return 1
            fi
            ;;
        *)
            local error_msg="Unknown audio action: $action"
            log "ERROR" "$error_msg"
            echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/audio.response"
            return 1
            ;;
    esac
}

handle_speech() {
    local request="$1"
    local action=$(echo "$request" | jq -r '.action')
    local message=$(echo "$request" | jq -r '.payload.message')
    local voice=$(echo "$request" | jq -r '.payload.voice // "system"')
    local rate=$(echo "$request" | jq -r '.payload.rate // 200')
    local request_id=$(echo "$request" | jq -r '.id')
    
    log "INFO" "Speech request: $action '$message' (voice: $voice, rate: $rate)"
    
    case "$action" in
        "say")
            local say_args=()
            if [ "$voice" != "system" ]; then
                say_args+=("-v" "$voice")
            fi
            if [ "$rate" != "200" ]; then
                say_args+=("-r" "$rate")
            fi
            
            if say ${say_args[@]+"${say_args[@]}"} "$message"; then
                log "INFO" "Speech completed successfully"
                echo "{\"id\":\"$request_id\",\"status\":\"success\",\"message\":\"Speech completed successfully\",\"data\":{\"message\":\"$message\",\"voice\":\"$voice\"},\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/speech.response"
            else
                local error_msg="Failed to speak message"
                log "ERROR" "$error_msg"
                echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/speech.response"
                return 1
            fi
            ;;
        *)
            local error_msg="Unknown speech action: $action"
            log "ERROR" "$error_msg"
            echo "{\"id\":\"$request_id\",\"status\":\"error\",\"message\":\"$error_msg\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >> "$RESPONSES_DIR/speech.response"
            return 1
            ;;
    esac
}

# Process a queue file for a specific service
process_queue() {
    local service="$1"
    local queue_file="$REQUESTS_DIR/$service.queue"
    
    if [ -f "$queue_file" ] && [ -s "$queue_file" ]; then
        log "DEBUG" "Processing $service queue"
        
        while IFS= read -r request_line; do
            if [ -n "$request_line" ]; then
                if ! echo "$request_line" | jq . >/dev/null 2>&1; then
                    log "ERROR" "Invalid JSON in $service queue: $request_line"
                    continue
                fi
                
                case "$service" in
                    "vscode")
                        handle_vscode "$request_line"
                        ;;
                    "audio")
                        handle_audio "$request_line"
                        ;;
                    "speech")
                        handle_speech "$request_line"
                        ;;
                    *)
                        log "ERROR" "Unknown service: $service"
                        ;;
                esac
            fi
        done < "$queue_file"
        
        # Clear the queue after processing
        > "$queue_file"
    fi
}

# Check for required dependencies
if ! command -v jq &> /dev/null; then
    log "ERROR" "jq is required but not installed"
    exit 1
fi

# Main processing loop
log "INFO" "Starting main processing loop"
while true; do
    for service in vscode audio speech; do
        process_queue "$service"
    done
    sleep 0.1
done