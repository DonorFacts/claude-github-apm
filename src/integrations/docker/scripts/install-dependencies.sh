#!/bin/bash
# Runtime dependency installation for Linux container
# Installs platform-specific dependencies after host mount

set -e

echo "🔧 Installing Linux-specific dependencies..."

# Check if main workspace has package.json
if [ -f /workspace/main/package.json ]; then
    echo "📦 Found package.json in /workspace/main/"
    cd /workspace/main
    
    # Install dependencies with Linux binaries
    echo "⚡ Running pnpm install for Linux platform..."
    pnpm install --frozen-lockfile --prefer-offline
    
    echo "✅ Dependencies installed successfully"
    echo "📍 Working directory: $(pwd)"
    echo "🔗 Node modules: $(ls -d node_modules 2>/dev/null && echo "present" || echo "missing")"
else
    echo "⚠️  No package.json found in /workspace/main/"
    echo "💡 Skipping dependency installation"
fi

echo "🎯 Dependency installation completed"