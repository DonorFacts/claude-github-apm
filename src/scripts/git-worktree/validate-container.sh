#!/bin/bash
# validate-container.sh - Validate container environment for worktree workflows
# REQUIREMENT: Worktree workflows require Claude Code to be running in Docker container mode

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in container
if [[ ! "$PWD" =~ ^/workspace ]]; then
    echo -e "${RED}❌ ERROR: Worktree workflows require Claude Code to be running in Docker container mode${NC}"
    echo "   Current path: $PWD"
    echo "   Expected: /workspace/..."
    echo ""
    echo "   To fix: Start Claude Code with Docker integration from the beginning"
    echo "   See README.md for container setup instructions"
    exit 1
fi

echo -e "${GREEN}✅ Container environment detected - proceeding with worktree creation${NC}"
exit 0