#!/bin/bash

# APM Dev Container Initialization Script
# This script is run inside VS Code dev containers to set up the APM environment
# It's called by the devcontainer.json postCreateCommand

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
log_info "APM Dev Container Initialization Starting..."

# Set container-aware environment variables
export APM_CONTAINERIZED=true
export APM_MEMORY_PATH="/workspace/apm/agents/${APM_AGENT_ROLE:-unknown}"
export APM_PROJECT_ROOT="/workspace"

log_info "Environment configured:"
log_info "  Agent Role: ${APM_AGENT_ROLE:-unknown}"
log_info "  Memory Path: $APM_MEMORY_PATH"
log_info "  Project Root: $APM_PROJECT_ROOT"

# Install Claude Code if not already installed
log_info "Checking Claude Code installation..."
if ! command -v claude >/dev/null 2>&1; then
    log_info "Installing Claude Code..."
    npm install -g @anthropic/claude-code
    log_success "Claude Code installed"
else
    log_success "Claude Code already available"
fi

# Restore agent memory context if available
if [ -n "$APM_AGENT_ROLE" ] && [ -f "$APM_MEMORY_PATH/context/latest.md" ]; then
    log_success "Agent context found for $APM_AGENT_ROLE"
    log_info "Context file: $APM_MEMORY_PATH/context/latest.md"
    log_info "Memory will be restored during agent initialization"
else
    log_info "No existing agent context found - fresh agent initialization"
fi

# Verify mounted volumes
if [ -d "/workspace/apm" ]; then
    log_success "APM memory volume mounted successfully"
else
    log_warning "APM memory volume not found at /workspace/apm"
fi

if [ -d "/workspace" ]; then
    log_success "Project workspace mounted successfully"
else
    log_warning "Project workspace not found at /workspace"
fi

# Set working directory to project root
cd "$APM_PROJECT_ROOT" || {
    log_warning "Could not change to project root: $APM_PROJECT_ROOT"
}

# Verify npm/node environment
if command -v npm >/dev/null 2>&1; then
    log_success "npm available in container"
else
    log_warning "npm not found in container"
fi

# Configure git if needed (inherit from host via dev container)
if [ -z "$(git config --global user.name)" ]; then
    log_info "Git configuration will be inherited from host via dev container"
fi

# Container is ready
log_success "APM dev container environment ready!"
log_info "VS Code terminal maintains familiar UX with container security"
log_info "Container provides secure isolation with dangerous permissions"

echo ""
echo "🎯 Dev Container Ready!"
echo "💡 Run 'claude' in the VS Code terminal to start your agent"
echo "🔒 Secure execution with familiar VS Code UX"
echo ""