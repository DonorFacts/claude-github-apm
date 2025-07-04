#!/bin/bash
# Runtime dependency installation for Linux container
# Installs platform-specific dependencies after host mount
# Handles main branch and all worktree branches

set -e

echo "🔧 Installing Linux-specific dependencies..."

install_dependencies_in_dir() {
    local dir="$1"
    local name="$2"
    
    if [ -f "$dir/package.json" ]; then
        echo "📦 Found package.json in $name ($dir)"
        cd "$dir"
        
        # Check if dependencies need installation
        if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
            echo "⚡ Running pnpm install for Linux platform in $name..."
            pnpm install --frozen-lockfile --prefer-offline
            echo "✅ Dependencies installed successfully in $name"
        else
            echo "⏭️  Dependencies up to date in $name"
        fi
        
        echo "📍 Working directory: $(pwd)"
        echo "🔗 Node modules: $(ls -d node_modules 2>/dev/null && echo "present" || echo "missing")"
    else
        echo "⚠️  No package.json found in $name ($dir)"
    fi
}

# Install dependencies in main workspace
if [ -d "/workspace/main" ]; then
    install_dependencies_in_dir "/workspace/main" "main branch"
else
    echo "⚠️  Main workspace not found at /workspace/main"
fi

# Install dependencies in all worktree branches
if [ -d "/workspace/worktrees" ]; then
    echo "🌳 Checking worktree branches..."
    for worktree_dir in /workspace/worktrees/*/; do
        if [ -d "$worktree_dir" ]; then
            worktree_name=$(basename "$worktree_dir")
            install_dependencies_in_dir "$worktree_dir" "worktree: $worktree_name"
        fi
    done
else
    echo "📝 No worktrees directory found"
fi

echo "🎯 Dependency installation completed for all workspaces"