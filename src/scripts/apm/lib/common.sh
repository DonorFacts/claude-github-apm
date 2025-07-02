#!/bin/bash
# Common functions for APM CLI

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

# Session management
get_session_registry() {
    local apm_sessions="${APM_SESSIONS:-../apm/sessions}"
    echo "$apm_sessions/registry.json"
}

ensure_session_registry() {
    local registry_file="$(get_session_registry)"
    if [[ ! -f "$registry_file" ]]; then
        echo '{"sessions": []}' > "$registry_file"
        log_info "Created session registry at $registry_file"
    fi
}

# Generate session ID
generate_session_id() {
    local role="${1:-unknown}"
    local specialization="${2:-general}"
    local timestamp=$(date +"%Y%m%d-%H%M%S")
    echo "${role}-${specialization}-${timestamp}"
}

# Get current timestamp
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# Check if session is stale (no heartbeat >2 minutes)
is_session_stale() {
    local last_heartbeat="$1"
    local current_time=$(date +%s)
    local heartbeat_time=$(date -d "$last_heartbeat" +%s 2>/dev/null || echo 0)
    local diff=$((current_time - heartbeat_time))
    
    # Stale if >120 seconds (2 minutes)
    [[ $diff -gt 120 ]]
}

# VS Code window detection
get_vscode_windows() {
    # Simple approach: get terminal session info
    # This would be enhanced with actual VS Code window detection
    echo "VS Code - $(basename $(pwd))"
}

# Git context
get_git_context() {
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local uncommitted=$(git status --porcelain 2>/dev/null | wc -l)
    echo "branch:$branch,uncommitted:$uncommitted"
}