#!/bin/bash
# Rebuild Claude Container with Fresh Dependencies
#
# This script ensures a clean rebuild of the Docker container
# with platform-specific node_modules (fixes esbuild issues)
#
# IMPORTANT: This script must be run from the HOST system, not inside the container!

set -e

# Check if we're running inside a container
if [ -f /.dockerenv ] || [ -n "$APM_CONTAINERIZED" ]; then
    echo "❌ ERROR: This script must be run from the HOST system, not inside the container!"
    echo ""
    echo "To run this script:"
    echo "1. Exit the container (Ctrl+D or 'exit')"
    echo "2. From your host terminal, run: pnpm rebuild-container"
    echo ""
    exit 1
fi

echo "🔨 Rebuilding Claude container with fresh dependencies..."

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker compose -f src/docker/claude-container/docker-compose.yml down 2>/dev/null || true

# Remove the node_modules volume to force a clean install
echo "🗑️  Removing old node_modules volume..."
docker volume rm claude_node_modules 2>/dev/null || true

# Remove the existing image to force a rebuild
echo "🗑️  Removing existing container image..."
docker rmi apm-claude-container:latest 2>/dev/null || true

# Build the new container (this will run pnpm install with Linux binaries)
echo "🏗️  Building new container with Linux-specific dependencies..."
cd src/docker/claude-container

# Set environment variables for docker-compose
export APM_PATH="${PWD}/../../apm"
export PARENT_DIR="$(dirname "${PWD}")"
export MAIN_BRANCH_PATH="${PWD}"

docker compose build --no-cache

echo "✅ Container rebuilt successfully!"
echo ""
echo "To start the container:"
echo "  cd src/docker/claude-container"
echo "  docker compose up -d"
echo ""
echo "To run Claude Code:"
echo "  ./.local/bin/claude"