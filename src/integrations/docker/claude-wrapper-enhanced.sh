#!/bin/bash

# Enhanced Claude Container Wrapper with Clipboard Support
# Transparently runs Claude Code in a Docker container with full clipboard functionality

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
log_info() { echo -e "${GREEN}ℹ️  $1${NC}" >&2; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# Detect host OS
detect_host_os() {
    case "$(uname -s)" in
        Darwin*) echo "darwin" ;;
        Linux*)  echo "linux" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)       echo "unknown" ;;
    esac
}

# Setup XQuartz for macOS
setup_macos_x11() {
    log_debug "Setting up X11 for macOS..."
    
    # Check if XQuartz is installed
    if ! [ -d "/Applications/Utilities/XQuartz.app" ] && ! [ -d "/Applications/XQuartz.app" ]; then
        log_warn "XQuartz not found. Clipboard paste functionality will be limited."
        log_warn "Install XQuartz for full clipboard support: brew install --cask xquartz"
        return 1
    fi
    
    # Check if XQuartz is running
    if ! pgrep -x "XQuartz" > /dev/null; then
        log_info "Starting XQuartz..."
        open -a XQuartz &
        sleep 2  # Give XQuartz time to start
    fi
    
    # Set DISPLAY if not already set
    if [ -z "$DISPLAY" ]; then
        # Get the display number from XQuartz
        export DISPLAY=":0"
    fi
    
    # Allow connections from Docker
    xhost +localhost 2>/dev/null || true
    
    log_debug "macOS X11 setup complete. DISPLAY=$DISPLAY"
    return 0
}

# Setup X11 for Linux
setup_linux_x11() {
    log_debug "Setting up X11 for Linux..."
    
    # Check if X11 is available
    if [ -z "$DISPLAY" ]; then
        log_warn "DISPLAY not set. Trying to detect..."
        export DISPLAY=":0"
    fi
    
    # Allow local connections
    xhost +local:docker 2>/dev/null || true
    
    log_debug "Linux X11 setup complete. DISPLAY=$DISPLAY"
    return 0
}

# Main setup function
setup_clipboard_environment() {
    local host_os=$(detect_host_os)
    export HOST_OS="$host_os"
    
    log_debug "Detected host OS: $host_os"
    
    case "$host_os" in
        darwin)
            setup_macos_x11 || log_warn "X11 setup failed - clipboard may not work"
            ;;
        linux)
            setup_linux_x11 || log_warn "X11 setup failed - clipboard may not work"
            ;;
        windows)
            log_warn "Windows clipboard support is experimental"
            ;;
    esac
}

# Check Docker availability
check_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker not found. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon not running. Please start Docker Desktop."
        exit 1
    fi
}

# Build container if needed
build_container() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local dockerfile_path="$script_dir/Dockerfile"
    
    if ! docker image inspect "$CONTAINER_IMAGE" >/dev/null 2>&1; then
        log_info "Building Claude container image..."
        if ! docker build -t "$CONTAINER_IMAGE" "$script_dir"; then
            log_error "Failed to build container image"
            exit 1
        fi
    fi
}

# Get volume mounts
get_volume_mounts() {
    local mounts=""
    
    # Workspace mount
    mounts="$mounts -v ${PWD}:${PWD}:rw"
    
    # Parent directory for git worktrees
    local parent_dir=$(dirname "$PWD")
    if [ -d "$parent_dir" ]; then
        mounts="$mounts -v ${parent_dir}:${parent_dir}:rw"
    fi
    
    # Claude config
    if [ -d "${HOME}/.claude" ]; then
        mounts="$mounts -v ${HOME}/.claude:/home/claude/.claude:rw"
    fi
    
    # X11 sockets
    if [ -d "/tmp/.X11-unix" ]; then
        mounts="$mounts -v /tmp/.X11-unix:/tmp/.X11-unix:rw"
    fi
    
    # macOS specific X11 socket location
    if [ "$HOST_OS" = "darwin" ] && [ -d "/private/tmp/.X11-unix" ]; then
        mounts="$mounts -v /private/tmp/.X11-unix:/private/tmp/.X11-unix:rw"
    fi
    
    # Xauthority file
    if [ -f "$HOME/.Xauthority" ]; then
        mounts="$mounts -v $HOME/.Xauthority:/root/.Xauthority:rw"
    fi
    
    # Docker socket for clipboard bridging
    if [ -S "/var/run/docker.sock" ]; then
        mounts="$mounts -v /var/run/docker.sock:/var/run/docker.sock:rw"
    fi
    
    echo "$mounts"
}

# Get environment variables
get_env_vars() {
    local env_vars=""
    
    # Basic environment
    env_vars="$env_vars -e APM_CONTAINERIZED=true"
    env_vars="$env_vars -e APM_DEBUG=${APM_DEBUG:-false}"
    env_vars="$env_vars -e HOST_OS=$HOST_OS"
    
    # X11 display
    if [ -n "$DISPLAY" ]; then
        env_vars="$env_vars -e DISPLAY=$DISPLAY"
    fi
    
    # Xauthority
    if [ -n "$XAUTHORITY" ]; then
        env_vars="$env_vars -e XAUTHORITY=$XAUTHORITY"
    fi
    
    # GitHub token
    if [ -n "$GITHUB_TOKEN" ]; then
        env_vars="$env_vars -e GITHUB_TOKEN=$GITHUB_TOKEN"
    fi
    
    echo "$env_vars"
}

# Main execution
main() {
    log_debug "Starting enhanced Claude container wrapper..."
    
    # Check prerequisites
    check_docker
    
    # Setup clipboard environment
    setup_clipboard_environment
    
    # Build container if needed
    build_container
    
    # Get configuration
    local volume_mounts=$(get_volume_mounts)
    local env_vars=$(get_env_vars)
    
    # Add host for macOS
    local extra_hosts=""
    if [ "$HOST_OS" = "darwin" ]; then
        extra_hosts="--add-host host.docker.internal:host-gateway"
    fi
    
    log_debug "Starting Claude Code with clipboard support..."
    
    # Run container with Claude Code
    exec docker run \
        --rm \
        --interactive \
        --tty \
        --name "$CONTAINER_NAME" \
        --workdir "$PWD" \
        --network host \
        --security-opt seccomp:unconfined \
        $extra_hosts \
        $volume_mounts \
        $env_vars \
        "$CONTAINER_IMAGE" \
        bash -c "
            # Initialize clipboard support
            if [ -f /workspace/main/src/docker/claude-container/clipboard-init.sh ]; then
                /workspace/main/src/docker/claude-container/clipboard-init.sh
            fi
            
            # Run Claude Code
            exec claude $*
        "
}

# Run main function with all arguments
main "$@"