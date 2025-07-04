#!/bin/bash

# Claude Container Wrapper (Docker Compose Version)
# Enhanced clipboard support using Docker Compose configuration
# Transparently runs Claude Code in a Docker container with clipboard access

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Container configuration
COMPOSE_PROJECT_NAME="claude-$(basename "$PWD")-$$"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Logging functions (to stderr)
log_debug() { 
    if [ "${APM_DEBUG:-}" = "true" ]; then
        echo -e "${BLUE}🐳 $1${NC}" >&2
    fi
}
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }
log_info() { echo -e "${GREEN}✅ $1${NC}" >&2; }

# Check if Docker and Docker Compose are available
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker not found. Please install Docker Desktop."
    log_error "Falling back to direct claude execution..."
    exec claude "$@"
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose not found. Please install Docker Compose."
    log_error "Falling back to direct claude execution..."
    exec claude "$@"
fi

# Use 'docker compose' if available, fallback to 'docker-compose'
COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon not running. Please start Docker Desktop."
    log_error "Falling back to direct claude execution..."
    exec claude "$@"
fi

# Detect project root and set up multi-agent collaboration paths
PROJECT_ROOT=""
MAIN_BRANCH_PATH=""
PARENT_DIR=$(dirname "$PWD")

# Try to find project root by looking for .git or worktrees structure
if [ -d "${PWD}/.git" ]; then
    # We're in main branch
    PROJECT_ROOT="$PWD"
    MAIN_BRANCH_PATH="$PWD"
elif [ -d "${PWD}/../main/.git" ]; then
    # We're in a worktree, find project root
    PROJECT_ROOT=$(dirname "$PWD")
    MAIN_BRANCH_PATH="${PROJECT_ROOT}/main"
elif [ -d "${PWD}/../../main/.git" ]; then
    # We're in a nested worktree structure
    PROJECT_ROOT=$(dirname "$(dirname "$PWD")")
    MAIN_BRANCH_PATH="${PROJECT_ROOT}/main"
else
    # Fallback: assume current directory
    PROJECT_ROOT="$PWD"
    MAIN_BRANCH_PATH="$PWD"
fi

# Determine APM path
APM_PATH=""
if [ -d "${PROJECT_ROOT}/apm" ]; then
    APM_PATH="${PROJECT_ROOT}/apm"
elif [ -d "${PWD}/apm" ]; then
    APM_PATH="${PWD}/apm"
else
    APM_PATH="${PWD}/apm"  # Will create if needed
fi

# Detect host OS
HOST_OS="linux"
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOST_OS="darwin"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    HOST_OS="windows"
fi

log_debug "Detected configuration:"
log_debug "  Host OS: $HOST_OS"
log_debug "  Project root: $PROJECT_ROOT"
log_debug "  Main branch: $MAIN_BRANCH_PATH"
log_debug "  Parent dir: $PARENT_DIR"
log_debug "  APM path: $APM_PATH"

# Set up environment variables for Docker Compose
export COMPOSE_PROJECT_NAME
export PWD
export PARENT_DIR
export MAIN_BRANCH_PATH
export APM_PATH
export HOST_OS
export NETWORK_MODE="${APM_NETWORK_MODE:-host}"
export MEMORY_LIMIT="${APM_MEMORY_LIMIT:-8g}"
export CPU_LIMIT="${APM_CPU_LIMIT:-4.0}"

# Security configuration
export APM_SECURITY_LEVEL="${APM_SECURITY_LEVEL:-standard}"

log_debug "Running Claude with Docker Compose and enhanced clipboard support..."

# Change to script directory for compose file access
cd "$SCRIPT_DIR"

# Clean up any existing containers
$COMPOSE_CMD down --remove-orphans >/dev/null 2>&1 || true

# Start the service and attach to it
log_info "Starting Claude Code container with clipboard support..."
$COMPOSE_CMD up -d

# Execute Claude Code inside the running container
log_debug "Executing Claude Code..."
$COMPOSE_CMD exec claude-code claude "$@"

# Cleanup
EXIT_CODE=$?
log_debug "Cleaning up container..."
$COMPOSE_CMD down --remove-orphans >/dev/null 2>&1 || true

exit $EXIT_CODE