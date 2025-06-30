#!/bin/bash
# assess-situation.sh - Assess current git state for worktree workflow decision
# Determines current branch, uncommitted changes, and provides guidance

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Assessing Current Git Situation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. What branch are you on?
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch:${NC} $CURRENT_BRANCH"

# 2. Do you have uncommitted changes?
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l)
echo -e "${YELLOW}Uncommitted changes:${NC} $UNCOMMITTED_COUNT files"

# 3. If changes exist, what are they?
if [ $UNCOMMITTED_COUNT -gt 0 ]; then
    echo
    echo -e "${YELLOW}Changed files:${NC}"
    git status --short
    echo
    echo -e "${RED}CRITICAL: Identifying which changes are mine...${NC}"
    echo "- Changes I made in this session → Will move to feature branch"
    echo "- Changes from others/previous sessions → Will leave on main"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Determine which workflow path to recommend
echo -e "${BLUE}Recommended Workflow Path:${NC}"

# Check if on protected branch (main/master/develop)
if [[ "$CURRENT_BRANCH" =~ ^(main|master|develop)$ ]]; then
    if [ $UNCOMMITTED_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ Path A: Clean worktree creation${NC}"
        echo "   → Use: ./src/scripts/git-worktree/create-clean-worktree.sh"
    else
        echo -e "${YELLOW}⚠️  On protected branch with changes${NC}"
        echo "   You need to categorize your changes by authorship:"
        echo "   • All changes made by ME → Path C (Main branch with my changes)"
        echo "   • Mix of MY and OTHERS' changes → Path D (Mixed changes)"
        echo "   • Only OTHERS' changes → Path E (Others' changes only)"
        echo
        echo "   Use the appropriate script:"
        echo "   → Path C: ./src/scripts/git-worktree/handle-main-branch-changes.sh"
        echo "   → Path D: ./src/scripts/git-worktree/handle-mixed-changes.sh"
        echo "   → Path E: ./src/scripts/git-worktree/handle-others-changes.sh"
    fi
else
    # On feature branch
    if [ $UNCOMMITTED_COUNT -eq 0 ]; then
        echo -e "${GREEN}✅ Path A: Clean worktree creation${NC}"
        echo "   → Use: ./src/scripts/git-worktree/create-clean-worktree.sh"
    else
        echo -e "${YELLOW}⚠️  On feature branch with changes${NC}"
        echo "   Assess if changes belong to this feature:"
        echo "   • YES → Path B (Feature branch with related changes)"
        echo "   • NO/UNSURE → See troubleshooting guide"
        echo
        echo "   → Path B: ./src/scripts/git-worktree/handle-feature-branch-changes.sh"
    fi
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Export variables for use by other scripts
export CURRENT_BRANCH
export UNCOMMITTED_COUNT
echo "Environment variables set for next script:"
echo "  CURRENT_BRANCH=$CURRENT_BRANCH"
echo "  UNCOMMITTED_COUNT=$UNCOMMITTED_COUNT"