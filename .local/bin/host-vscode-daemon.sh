#!/bin/bash

# Host VS Code Daemon
# Processes VS Code requests from Docker containers and opens them on the host

# Use the worktree's .local directory for queue files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VSCODE_QUEUE="$(dirname "$SCRIPT_DIR")/vscode-queue"
VSCODE_RESPONSE="$(dirname "$SCRIPT_DIR")/vscode-response"
mkdir -p "$(dirname "$VSCODE_QUEUE")"

echo "💻 Host VS Code daemon started. Waiting for VS Code requests..."
echo "   Queue file: $VSCODE_QUEUE"
echo "   Response file: $VSCODE_RESPONSE"

# Function to translate container paths to host paths
translate_container_path() {
    local container_path="$1"
    
    # Get the current script's directory to find the project root
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root="$(cd "$script_dir/../.." && pwd)"
    
    # Translate container paths to host paths
    if [[ "$container_path" == /workspace/main* ]]; then
        # Main workspace path
        echo "${project_root}${container_path#/workspace/main}"
    elif [[ "$container_path" == /workspace/worktrees/* ]]; then
        # Worktree path
        local worktree_name="${container_path#/workspace/worktrees/}"
        echo "$(dirname "${project_root}")/worktrees/${worktree_name}"
    elif [[ "$container_path" == /workspace* ]]; then
        # Other workspace paths
        echo "${project_root}${container_path#/workspace}"
    else
        # Assume it's already a host path
        echo "$container_path"
    fi
}

# Function to process a VS Code request
process_vscode_request() {
    local request_line="$1"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    echo "📂 Processing VS Code request: $request_line"
    
    # Parse JSON request (simple extraction for now)
    # Expected format: {"action": "open", "path": "/path/to/worktree", "timestamp": "..."}
    
    # Extract path using grep and sed (more robust than jq dependency)
    local container_path=$(echo "$request_line" | grep -o '"path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    local action=$(echo "$request_line" | grep -o '"action"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"action"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
    
    if [ -z "$container_path" ] || [ -z "$action" ]; then
        echo "❌ Invalid request format: $request_line"
        echo "{\"status\": \"error\", \"message\": \"Invalid request format\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
        return 1
    fi
    
    # Translate container path to host path
    local path=$(translate_container_path "$container_path")
    
    echo "   Action: $action"
    echo "   Container Path: $container_path"
    echo "   Host Path: $path"
    echo "   DEBUG - project_root: $(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    echo "   DEBUG - dirname of project_root: $(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)")"
    
    case "$action" in
        "open")
            # Check if path exists
            if [ ! -d "$path" ]; then
                echo "❌ Path does not exist: $path"
                echo "{\"status\": \"error\", \"message\": \"Path does not exist: $path\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
                return 1
            fi
            
            # Check if VS Code is available
            if ! command -v code &> /dev/null; then
                echo "❌ VS Code command not found. Please install VS Code CLI tools."
                echo "{\"status\": \"error\", \"message\": \"VS Code command not found\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
                return 1
            fi
            
            # Open VS Code
            echo "🚀 Opening VS Code: $path"
            if code "$path"; then
                echo "✅ VS Code opened successfully"
                echo "{\"status\": \"success\", \"message\": \"VS Code opened successfully\", \"path\": \"$path\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
            else
                echo "❌ Failed to open VS Code"
                echo "{\"status\": \"error\", \"message\": \"Failed to open VS Code\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
                return 1
            fi
            ;;
        *)
            echo "❌ Unknown action: $action"
            echo "{\"status\": \"error\", \"message\": \"Unknown action: $action\", \"timestamp\": \"$timestamp\"}" >> "$VSCODE_RESPONSE"
            return 1
            ;;
    esac
}

# Main processing loop
while true; do
    if [ -f "$VSCODE_QUEUE" ] && [ -s "$VSCODE_QUEUE" ]; then
        # Process each request in the queue
        while IFS= read -r request; do
            if [ -n "$request" ]; then
                process_vscode_request "$request"
            fi
        done < "$VSCODE_QUEUE"
        
        # Clear the queue after processing
        > "$VSCODE_QUEUE"
    fi
    sleep 0.5
done