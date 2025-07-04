#!/bin/bash
# handle-main-branch-changes.sh - Section C: Main branch with my changes
# Creates branch with changes (they move automatically), commits them, then creates worktree

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

echo -e "${BLUE}Handling Main Branch with My Changes${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate we're on a protected branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" =~ ^(main|master|develop)$ ]]; then
    echo -e "${RED}❌ ERROR: This script is for protected branches (main/master/develop), but you're on: $CURRENT_BRANCH${NC}"
    echo "Use handle-feature-branch-changes.sh instead."
    exit 1
fi

echo -e "${YELLOW}Current protected branch:${NC} $CURRENT_BRANCH"

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

# Confirm these are user's changes
echo
echo -e "${YELLOW}⚠️  IMPORTANT: Are ALL these changes made by YOU in this session?${NC}"
echo "This script moves ALL uncommitted changes to the new feature branch."
echo "If you have mixed changes (yours + others), use handle-mixed-changes.sh instead."
echo
read -p "Are ALL changes made by you? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    echo "For mixed changes, use: ./src/scripts/git-worktree/handle-mixed-changes.sh"
    exit 1
fi

# Create descriptive branch name with issue number
BRANCH_NAME="feature-$ISSUE_NUMBER-$BRIEF_DESC"
echo -e "${YELLOW}Creating feature branch:${NC} $BRANCH_NAME"

# Create branch with changes (they move automatically)
if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo -e "${RED}❌ ERROR: Branch $BRANCH_NAME already exists${NC}"
    echo "Please choose a different brief description or delete the existing branch."
    exit 1
fi

git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✅ Created branch and moved changes${NC}"

# Commit the changes
echo -e "${YELLOW}Committing your changes...${NC}"
git add .
git commit -m "feat: initial work - preparing for worktree handoff"

echo -e "${GREEN}✅ Changes committed to feature branch${NC}"

# Switch back to main for worktree creation
echo -e "${YELLOW}Switching back to main...${NC}"
git checkout main

# Now follow clean worktree creation path
echo
echo -e "${BLUE}Proceeding with clean worktree creation...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Call the clean worktree creation script
if ! ./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "$AGENT_ROLE" "$BRIEF_DESC"; then
    echo -e "${RED}❌ ERROR: Failed to create clean worktree${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Main branch changes handled and worktree created successfully!${NC}"