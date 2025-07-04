#!/bin/bash

# Claude Container Wrapper
# Transparently runs Claude Code in a Docker container
# User experience is identical to running claude directly

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Container configuration
CONTAINER_IMAGE="apm-claude-container:latest"
CONTAINER_NAME="claude-$(basename "$PWD")-$$"

# Logging functions (to stderr)
log_debug() { 
    if [ "${APM_DEBUG:-}" = "true" ]; then
        echo -e "${BLUE}🐳 $1${NC}" >&2
    fi
}
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# Check if Docker is available
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker not found. Please install Docker Desktop."
    log_error "Falling back to direct claude execution..."
    exec claude "$@"
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon not running. Please start Docker Desktop."
    log_error "Falling back to direct claude execution..."
    exec claude "$@"
fi

# Build container image if it doesn't exist or if Dockerfile is newer
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKERFILE_PATH="$SCRIPT_DIR/Dockerfile"
IMAGE_NEEDS_REBUILD=false

if ! docker image inspect "$CONTAINER_IMAGE" >/dev/null 2>&1; then
    IMAGE_NEEDS_REBUILD=true
    log_debug "Container image not found - building..."
else
    # Check if Dockerfile is newer than the image
    if [ -f "$DOCKERFILE_PATH" ]; then
        IMAGE_DATE=$(docker image inspect "$CONTAINER_IMAGE" --format='{{.Created}}' 2>/dev/null)
        if [ -n "$IMAGE_DATE" ]; then
            IMAGE_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${IMAGE_DATE%.*}" "+%s" 2>/dev/null || echo "0")
            DOCKERFILE_TIMESTAMP=$(stat -f "%m" "$DOCKERFILE_PATH" 2>/dev/null || echo "0")
            if [ "$DOCKERFILE_TIMESTAMP" -gt "$IMAGE_TIMESTAMP" ]; then
                IMAGE_NEEDS_REBUILD=true
                log_debug "Dockerfile updated - rebuilding container image..."
            fi
        fi
    fi
fi

if [ "$IMAGE_NEEDS_REBUILD" = true ]; then
    if ! docker build -t "$CONTAINER_IMAGE" "$SCRIPT_DIR" >/dev/null 2>&1; then
        log_error "Failed to build Claude container image."
        log_error "Falling back to direct claude execution..."
        exec claude "$@"
    fi
    log_debug "Claude container image built successfully"
fi

# Detect project root and set up multi-agent collaboration mounts
PROJECT_ROOT=""
MAIN_BRANCH_PATH=""
WORKTREES_PATH=""

# Try to find project root by looking for .git or worktrees structure
if [ -d "${PWD}/.git" ]; then
    # We're in main branch
    PROJECT_ROOT="$PWD"
    MAIN_BRANCH_PATH="$PWD"
    WORKTREES_PATH="$PWD"
elif [ -d "${PWD}/../main/.git" ]; then
    # We're in a worktree, find project root
    PROJECT_ROOT=$(dirname "$PWD")
    MAIN_BRANCH_PATH="${PROJECT_ROOT}/main"
    WORKTREES_PATH="$PROJECT_ROOT"
elif [ -d "${PWD}/../../main/.git" ]; then
    # We're in a nested worktree structure
    PROJECT_ROOT=$(dirname "$(dirname "$PWD")")
    MAIN_BRANCH_PATH="${PROJECT_ROOT}/main"
    WORKTREES_PATH="$(dirname "$PWD")"
else
    # Fallback: assume current directory
    PROJECT_ROOT="$PWD"
    MAIN_BRANCH_PATH="$PWD"
    WORKTREES_PATH="$PWD"
fi

log_debug "Project structure detected:"
log_debug "  Project root: $PROJECT_ROOT"
log_debug "  Main branch: $MAIN_BRANCH_PATH"
log_debug "  Worktrees: $WORKTREES_PATH"

# Set up volume mounts for multi-agent collaboration
# CRITICAL: Mount at same paths as host to preserve git worktree functionality
WORKSPACE_MOUNT="${PWD}:${PWD}"
MAIN_MOUNT=""
WORKTREES_MOUNT=""
CLAUDE_CONFIG_MOUNT=""
APM_MOUNT=""

# Mount main branch at SAME PATH as host
if [ -d "$MAIN_BRANCH_PATH" ] && [ "$MAIN_BRANCH_PATH" != "$PWD" ]; then
    MAIN_MOUNT="-v ${MAIN_BRANCH_PATH}:${MAIN_BRANCH_PATH}:rw"
    log_debug "Mounted main branch at host path: $MAIN_BRANCH_PATH"
fi

# Mount parent directory to ensure git worktree paths work
PARENT_DIR=$(dirname "$PWD")
if [ -d "$PARENT_DIR" ]; then
    PARENT_MOUNT="-v ${PARENT_DIR}:${PARENT_DIR}:rw"
    log_debug "Mounted parent directory for git worktree access: $PARENT_DIR"
fi

# Mount Claude config files if they exist
CLAUDE_CONFIG_MOUNT=""
if [ -f "${HOME}/.claude.json" ]; then
    CLAUDE_CONFIG_MOUNT="-v ${HOME}/.claude.json:/home/claude/.claude.json"
    log_debug "Mounted Claude config file (.claude.json)"
fi
if [ -d "${HOME}/.claude" ]; then
    CLAUDE_CONFIG_MOUNT="$CLAUDE_CONFIG_MOUNT -v ${HOME}/.claude:/home/claude/.claude"
    log_debug "Mounted Claude directory (.claude/)"
fi

# Mount host shell configuration for developer productivity
SHELL_CONFIG_MOUNT=""
# Hardcode Jake's path for now to test mount
ZSHRC_PATH="/Users/jakedetels/.zshrc"
log_debug "Checking for zshrc at: $ZSHRC_PATH"
if [ -f "$ZSHRC_PATH" ]; then
    SHELL_CONFIG_MOUNT="-v ${ZSHRC_PATH}:/home/claude/.host_zshrc:ro"
    log_debug "✅ Mounted host .zshrc: $ZSHRC_PATH → /home/claude/.host_zshrc"
else
    log_debug "❌ Host .zshrc not found at: $ZSHRC_PATH"
    # Try HOME-based path as fallback
    HOME_ZSHRC="${HOME}/.zshrc"
    if [ -f "$HOME_ZSHRC" ]; then
        SHELL_CONFIG_MOUNT="-v ${HOME_ZSHRC}:/home/claude/.host_zshrc:ro"
        log_debug "✅ Found zshrc via HOME: $HOME_ZSHRC"
    fi
fi

# Mount APM memory system (essential for agent coordination)
if [ -d "${PROJECT_ROOT}/apm" ]; then
    APM_MOUNT="-v ${PROJECT_ROOT}/apm:/workspace/apm"
    log_debug "Mounted APM memory system from project root"
elif [ -d "apm" ]; then
    APM_MOUNT="-v ${PWD}/apm:/workspace/apm"
    log_debug "Mounted local APM directory"
fi

# Security configuration
SECURITY_LEVEL="${APM_SECURITY_LEVEL:-standard}"
NETWORK_CONFIG=""
RESOURCE_LIMITS=""
SECURITY_OPTS=""

case "$SECURITY_LEVEL" in
    "maximum")
        # Maximum security: no network, strict limits
        NETWORK_CONFIG="--network none"
        RESOURCE_LIMITS="--memory=2g --cpus=1.0 --pids-limit=100"
        SECURITY_OPTS="--read-only --tmpfs /tmp:rw,size=500m --tmpfs /workspace-tmp:rw,size=1g"
        log_debug "Security level: MAXIMUM (no network, strict limits)"
        ;;
    "restricted")
        # Restricted security: isolated network, moderate limits
        NETWORK_CONFIG="--network bridge"
        RESOURCE_LIMITS="--memory=4g --cpus=2.0 --pids-limit=200"
        SECURITY_OPTS="--tmpfs /tmp:rw,size=1g"
        log_debug "Security level: RESTRICTED (isolated network, moderate limits)"
        ;;
    "standard"|*)
        # Standard security: host network for compatibility, basic limits
        NETWORK_CONFIG="--network host"
        RESOURCE_LIMITS="--memory=8g --cpus=4.0"
        SECURITY_OPTS=""
        log_debug "Security level: STANDARD (host network, basic limits)"
        ;;
esac

log_debug "Running Claude in secure container with multi-agent collaboration..."

# Run Claude in container with full security stack
exec docker run \
    --rm \
    --interactive \
    --tty \
    --name "$CONTAINER_NAME" \
    --workdir "$PWD" \
    $NETWORK_CONFIG \
    $RESOURCE_LIMITS \
    $SECURITY_OPTS \
    -v "$WORKSPACE_MOUNT" \
    $MAIN_MOUNT \
    $PARENT_MOUNT \
    $CLAUDE_CONFIG_MOUNT \
    $SHELL_CONFIG_MOUNT \
    $APM_MOUNT \
    -e APM_CONTAINERIZED=true \
    -e APM_SECURITY_LEVEL="$SECURITY_LEVEL" \
    -e APM_DEBUG="$APM_DEBUG" \
    -e GITHUB_TOKEN="$GITHUB_TOKEN" \
    -e APM_WORKTREE_NAME="$(basename "$PWD")" \
    "$CONTAINER_IMAGE" \
    "$@"