#!/bin/bash
# handle-feature-branch-changes.sh - Section B: Feature branch with related changes
# Commits the changes first, then follows clean worktree creation path

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Usage validation
if [ $# -lt 3 ]; then
    echo "Usage: $0 <issue-number> <agent-role> <brief-description>"
    echo "Example: $0 123 developer 'user-auth-system'"
    exit 1
fi

ISSUE_NUMBER="$1"
AGENT_ROLE="$2"
BRIEF_DESC="$3"

echo -e "${BLUE}Handling Feature Branch with Related Changes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate we're on a feature branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" =~ ^(main|master|develop)$ ]]; then
    echo -e "${RED}❌ ERROR: This script is for feature branches, but you're on: $CURRENT_BRANCH${NC}"
    echo "Use handle-main-branch-changes.sh instead."
    exit 1
fi

echo -e "${YELLOW}Current feature branch:${NC} $CURRENT_BRANCH"

# Check for uncommitted changes
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l)
if [ $UNCOMMITTED_COUNT -eq 0 ]; then
    echo -e "${RED}❌ ERROR: No uncommitted changes found${NC}"
    echo "Use create-clean-worktree.sh instead."
    exit 1
fi

echo -e "${YELLOW}Uncommitted changes:${NC} $UNCOMMITTED_COUNT files"
echo
echo "Changed files:"
git status --short

# Confirm these changes belong to this feature
echo
echo -e "${YELLOW}⚠️  IMPORTANT: Do these changes belong to the current feature branch?${NC}"
echo "Only proceed if ALL changes are related to the current feature work."
echo
read -p "Are all changes related to this feature? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    echo "Please manually separate unrelated changes first."
    echo "See troubleshooting guide for help with mixed changes."
    exit 1
fi

# Commit the related changes
echo -e "${YELLOW}Committing related changes...${NC}"
git add .
git commit -m "feat: work in progress - preparing for worktree handoff"

echo -e "${GREEN}✅ Changes committed to feature branch${NC}"

# Now follow clean worktree creation path
echo
echo -e "${BLUE}Proceeding with clean worktree creation...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Switch to main first
echo -e "${YELLOW}Switching to main branch...${NC}"
git checkout main

# Call the clean worktree creation script
if ! ./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "$AGENT_ROLE" "$BRIEF_DESC"; then
    echo -e "${RED}❌ ERROR: Failed to create clean worktree${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Feature branch changes handled and worktree created successfully!${NC}"