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

# Set up volume mounts
WORKSPACE_MOUNT="${PWD}:/workspace"
CLAUDE_CONFIG_MOUNT=""

# Mount Claude config if it exists
if [ -d "${HOME}/.claude" ]; then
    CLAUDE_CONFIG_MOUNT="-v ${HOME}/.claude:/home/claude/.claude"
fi

# Mount APM directory if we're in a worktree
APM_MOUNT=""
if [ -d "apm" ]; then
    APM_MOUNT="-v ${PWD}/apm:/workspace/apm"
fi

log_debug "Running Claude in secure container..."

# Run Claude in container with "allow dangerously" permissions
exec docker run \
    --rm \
    --interactive \
    --tty \
    --name "$CONTAINER_NAME" \
    --workdir /workspace \
    --user claude \
    --network host \
    -v "$WORKSPACE_MOUNT" \
    -v "${PWD}/../main:/workspace-main:rw" \
    $CLAUDE_CONFIG_MOUNT \
    $APM_MOUNT \
    -e APM_CONTAINERIZED=true \
    "$CONTAINER_IMAGE" \
    claude --dangerously-skip-permissions "$@"