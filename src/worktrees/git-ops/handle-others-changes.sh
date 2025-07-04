#!/bin/bash
# handle-others-changes.sh - Section E: Only others' changes
# Preserves all changes on main and creates clean feature branch

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

echo -e "${BLUE}Handling Others' Changes Only${NC}"
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
echo "All changed files (will be preserved on main):"
git status --short
echo

# Confirm these are all others' changes
echo -e "${YELLOW}⚠️  IMPORTANT: Are ALL these changes made by OTHERS (not you)?${NC}"
echo "This script preserves ALL uncommitted changes on main."
echo "If you made ANY of these changes, use handle-mixed-changes.sh instead."
echo
read -p "Confirm ALL changes are from others? (y/N): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    echo "For your own changes, use: ./src/scripts/git-worktree/handle-main-branch-changes.sh"
    echo "For mixed changes, use: ./src/scripts/git-worktree/handle-mixed-changes.sh"
    exit 1
fi

# Create descriptive branch name with issue number
BRANCH_NAME="feature-$ISSUE_NUMBER-$BRIEF_DESC"
echo -e "${YELLOW}Creating clean feature branch:${NC} $BRANCH_NAME"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo -e "${RED}❌ ERROR: Branch $BRANCH_NAME already exists${NC}"
    echo "Please choose a different brief description or delete the existing branch."
    exit 1
fi

# Stash others' changes to preserve them
echo -e "${YELLOW}Step 1: Temporarily stashing others' changes...${NC}"
STASH_MESSAGE="Others' changes - preserving on main"
git stash push -u -m "$STASH_MESSAGE"
echo -e "${GREEN}✅ Others' changes stashed${NC}"

# Create clean feature branch
echo -e "${YELLOW}Step 2: Creating clean feature branch...${NC}"
git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✅ Created clean feature branch: $BRANCH_NAME${NC}"

# Switch back to main and restore others' changes
echo -e "${YELLOW}Step 3: Returning to main and restoring others' changes...${NC}"
git checkout main
git stash pop
echo -e "${GREEN}✅ Others' changes restored on main${NC}"

# Now follow clean worktree creation path
echo
echo -e "${BLUE}Step 4: Proceeding with clean worktree creation...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Call the clean worktree creation script
if ! ./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "$AGENT_ROLE" "$BRIEF_DESC"; then
    echo -e "${RED}❌ ERROR: Failed to create clean worktree${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Others' changes preserved and clean worktree created successfully!${NC}"
echo
echo -e "${BLUE}Summary:${NC}"
echo "• Others' changes remain uncommitted on main"
echo "• Clean feature branch created for your new work"
echo "• Worktree ready for development"