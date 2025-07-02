#!/bin/bash

# Security-Hardened Claude Container Wrapper
# Provides clipboard support with enhanced security measures

set -euo pipefail  # Strict error handling

# Colors for output
readonly BLUE='\033[0;34m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

# Security constants
readonly MAX_PATH_LENGTH=4096
readonly ALLOWED_MOUNT_PATTERN='^[a-zA-Z0-9/_.-]+$'

# Container configuration
readonly CONTAINER_IMAGE="apm-claude-container:latest"
readonly CONTAINER_NAME="claude-$(basename "$PWD" | tr -cd '[:alnum:]._-')-$$"

# Logging functions (to stderr)
log_debug() { 
    if [ "${APM_DEBUG:-false}" = "true" ]; then
        echo -e "${BLUE}🐳 $1${NC}" >&2
    fi
}
log_info() { echo -e "${GREEN}ℹ️  $1${NC}" >&2; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# Validate path for mounting
validate_path() {
    local path="$1"
    local description="$2"
    
    # Check path length
    if [ ${#path} -gt $MAX_PATH_LENGTH ]; then
        log_error "$description path too long"
        return 1
    fi
    
    # Check for directory traversal attempts
    if [[ "$path" =~ \.\. ]]; then
        log_error "$description contains directory traversal"
        return 1
    fi
    
    # Ensure path exists and is readable
    if [ ! -r "$path" ]; then
        log_error "$description not readable: $path"
        return 1
    fi
    
    return 0
}

# Detect host OS
detect_host_os() {
    case "$(uname -s)" in
        Darwin*) echo "darwin" ;;
        Linux*)  echo "linux" ;;
        *)       log_error "Unsupported OS"; exit 1 ;;
    esac
}

# Setup XQuartz for macOS with security considerations
setup_macos_x11() {
    log_debug "Setting up X11 for macOS..."
    
    # Check if XQuartz is installed
    if ! [ -d "/Applications/Utilities/XQuartz.app" ] && ! [ -d "/Applications/XQuartz.app" ]; then
        log_warn "XQuartz not found. Clipboard functionality requires XQuartz."
        log_warn "Install: brew install --cask xquartz"
        return 1
    fi
    
    # Check if XQuartz is running
    if ! pgrep -x "XQuartz" > /dev/null; then
        log_info "Starting XQuartz..."
        open -a XQuartz &
        sleep 2
    fi
    
    # Set DISPLAY if not already set
    if [ -z "${DISPLAY:-}" ]; then
        export DISPLAY=":0"
    fi
    
    # Allow connections from Docker with timeout
    log_info "Enabling X11 access for this session only..."
    # Use more restrictive xhost with specific hostname
    xhost +local:claude-container 2>/dev/null || true
    
    # Schedule xhost removal after container exits
    trap 'xhost -local:claude-container 2>/dev/null || true' EXIT
    
    log_debug "macOS X11 setup complete. DISPLAY=$DISPLAY"
    return 0
}

# Setup X11 for Linux with security considerations
setup_linux_x11() {
    log_debug "Setting up X11 for Linux..."
    
    if [ -z "${DISPLAY:-}" ]; then
        export DISPLAY=":0"
    fi
    
    # Generate unique xauth cookie for this session
    local xauth_file="/tmp/.claude-xauth-$$"
    touch "$xauth_file"
    chmod 600 "$xauth_file"
    
    # Extract current display auth and add it for container
    xauth extract - "$DISPLAY" | xauth -f "$xauth_file" merge -
    
    # Export for container use
    export XAUTHORITY="$xauth_file"
    
    # Cleanup on exit
    trap 'rm -f "$xauth_file" 2>/dev/null || true' EXIT
    
    log_debug "Linux X11 setup complete with session-specific auth"
    return 0
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
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    if ! validate_path "$script_dir" "Script directory"; then
        exit 1
    fi
    
    local dockerfile_path="$script_dir/Dockerfile"
    
    if ! docker image inspect "$CONTAINER_IMAGE" >/dev/null 2>&1; then
        log_info "Building Claude container image..."
        if ! docker build -t "$CONTAINER_IMAGE" "$script_dir"; then
            log_error "Failed to build container image"
            exit 1
        fi
    fi
}

# Get secure volume mounts
get_volume_mounts() {
    local mounts=""
    local pwd_safe
    pwd_safe="$(pwd)"
    
    # Validate and mount workspace
    if validate_path "$pwd_safe" "Workspace"; then
        mounts="$mounts -v '${pwd_safe}:${pwd_safe}:rw'"
    else
        log_error "Cannot mount workspace"
        exit 1
    fi
    
    # Claude config (read-only for security)
    if [ -d "${HOME}/.claude" ] && validate_path "${HOME}/.claude" "Claude config"; then
        mounts="$mounts -v '${HOME}/.claude:/home/claude/.claude:ro'"
    fi
    
    # X11 sockets (only if X11 is available)
    if [ -n "${DISPLAY:-}" ]; then
        if [ -d "/tmp/.X11-unix" ]; then
            mounts="$mounts -v '/tmp/.X11-unix:/tmp/.X11-unix:rw'"
        fi
        
        # Xauthority file
        if [ -n "${XAUTHORITY:-}" ] && [ -f "$XAUTHORITY" ]; then
            mounts="$mounts -v '${XAUTHORITY}:${XAUTHORITY}:ro'"
        fi
    fi
    
    # Note: Docker socket NOT mounted for security
    log_warn "Docker socket not mounted - some clipboard features may be limited"
    
    echo "$mounts"
}

# Get environment variables (sanitized)
get_env_vars() {
    local env_vars=""
    
    # Basic environment
    env_vars="$env_vars -e APM_CONTAINERIZED=true"
    env_vars="$env_vars -e APM_DEBUG=${APM_DEBUG:-false}"
    env_vars="$env_vars -e HOST_OS=$HOST_OS"
    
    # X11 display
    if [ -n "${DISPLAY:-}" ]; then
        env_vars="$env_vars -e DISPLAY='$DISPLAY'"
    fi
    
    # Xauthority
    if [ -n "${XAUTHORITY:-}" ]; then
        env_vars="$env_vars -e XAUTHORITY='$XAUTHORITY'"
    fi
    
    # GitHub token (only if explicitly allowed)
    if [ "${APM_ALLOW_GITHUB_TOKEN:-false}" = "true" ] && [ -n "${GITHUB_TOKEN:-}" ]; then
        env_vars="$env_vars -e GITHUB_TOKEN='$GITHUB_TOKEN'"
    else
        log_warn "GITHUB_TOKEN not passed. Set APM_ALLOW_GITHUB_TOKEN=true to enable."
    fi
    
    echo "$env_vars"
}

# Main execution
main() {
    log_info "Starting security-hardened Claude container..."
    
    # Check prerequisites
    check_docker
    
    # Detect OS
    HOST_OS=$(detect_host_os)
    export HOST_OS
    
    # Setup clipboard environment
    case "$HOST_OS" in
        darwin) setup_macos_x11 || log_warn "X11 setup failed - clipboard limited" ;;
        linux)  setup_linux_x11 || log_warn "X11 setup failed - clipboard limited" ;;
    esac
    
    # Build container if needed
    build_container
    
    # Get configuration
    local volume_mounts env_vars
    volume_mounts=$(get_volume_mounts)
    env_vars=$(get_env_vars)
    
    log_info "Starting Claude Code (security-hardened mode)..."
    log_warn "Some features disabled for security:"
    log_warn "- Docker socket access (no Docker-in-Docker)"
    log_warn "- Host network access (isolated network)"
    log_warn "- Parent directory access (current dir only)"
    
    # Run container with security restrictions
    eval docker run \
        --rm \
        --interactive \
        --tty \
        --name "$CONTAINER_NAME" \
        --workdir "$pwd_safe" \
        --network bridge \
        --memory 4g \
        --cpus 2.0 \
        --pids-limit 200 \
        --read-only \
        --tmpfs /tmp:rw,size=1g,mode=1777 \
        --tmpfs /var/tmp:rw,size=500m,mode=1777 \
        --security-opt no-new-privileges \
        --cap-drop ALL \
        --cap-add CHOWN \
        --cap-add DAC_OVERRIDE \
        --cap-add SETGID \
        --cap-add SETUID \
        $volume_mounts \
        $env_vars \
        "$CONTAINER_IMAGE" \
        bash -c "exec claude \"\$@\"" -- "$@"
}

# Signal handlers for cleanup
trap 'log_info "Cleaning up..."; exit' INT TERM

# Run main function with all arguments
main "$@"