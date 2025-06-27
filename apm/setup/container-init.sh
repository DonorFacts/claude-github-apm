#!/bin/bash

# APM Container Initialization Script
# This script is run inside Docker containers to set up the APM environment
# It's called by the claude-sandbox.config.json setupCommands

set -e  # Exit on any error

# Colors for output (container-safe)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}🐳 $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Container environment detection
log_info "APM Container Initialization Starting..."

# Verify we're in a container
if [ ! -f /.dockerenv ]; then
    log_warning "Not running in Docker container - initialization may not work as expected"
fi

# Set container-aware environment variables
export APM_CONTAINERIZED=true
export APM_MEMORY_PATH="/apm/agents/${APM_AGENT_ROLE:-unknown}"
export APM_PROJECT_ROOT="/workspace"
export APM_SHARED_PATH="/shared"

log_info "Environment configured:"
log_info "  Agent Role: ${APM_AGENT_ROLE:-unknown}"
log_info "  Memory Path: $APM_MEMORY_PATH"
log_info "  Project Root: $APM_PROJECT_ROOT"
log_info "  Worktree: ${APM_WORKTREE:-unknown}"

# Restore agent memory context if available
if [ -n "$APM_AGENT_ROLE" ] && [ -f "$APM_MEMORY_PATH/context/latest.md" ]; then
    log_success "Agent context found for $APM_AGENT_ROLE"
    log_info "Context file: $APM_MEMORY_PATH/context/latest.md"
    log_info "Memory will be restored during agent initialization"
else
    log_info "No existing agent context found - fresh agent initialization"
fi

# Verify mounted volumes
if [ -d "/apm" ]; then
    log_success "APM memory volume mounted successfully"
else
    log_warning "APM memory volume not found at /apm"
fi

if [ -d "/workspace" ]; then
    log_success "Project workspace mounted successfully"
else
    log_warning "Project workspace not found at /workspace"
fi

# Set up container-specific environment
log_info "Configuring container environment..."

# Create shared communication directory if it doesn't exist
mkdir -p "$APM_SHARED_PATH" 2>/dev/null || true

# Set working directory to project root
cd "$APM_PROJECT_ROOT" || {
    log_warning "Could not change to project root: $APM_PROJECT_ROOT"
    cd /workspace || log_warning "Could not change to /workspace either"
}

# Verify npm/node environment
if command -v npm >/dev/null 2>&1; then
    log_success "npm available in container"
else
    log_warning "npm not found in container - may need to install dependencies"
fi

# Check for package.json and install dependencies if needed
if [ -f "package.json" ]; then
    log_info "package.json found - dependencies should be installed by setupCommands"
else
    log_warning "No package.json found in project root"
fi

# Container is ready
log_success "APM container environment ready!"
log_info "Agent can now initialize with containerized execution"
log_info "Container provides secure isolation with dangerous permissions"

# Terminal title to indicate container mode
echo -e "\033]0;🐳 ${APM_AGENT_ROLE:-Container}\007"

echo ""
echo "Container Ready - Start Claude Code with dangerous permissions enabled"
echo "APM Framework will detect containerized environment automatically"
echo ""