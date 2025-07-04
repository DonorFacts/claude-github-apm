#!/bin/bash
# create-clean-worktree.sh - Section A: Clean worktree creation (no uncommitted changes)
# Creates worktree, handover file, opens VS Code, and completes handoff

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

echo -e "${BLUE}Creating Clean Worktree${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate issue number
if [[ -z "$ISSUE_NUMBER" ]]; then
    echo -e "${RED}❌ ERROR: No issue number provided${NC}"
    echo "Please create a GitHub issue first:"
    echo "Run: ./src/scripts/git-worktree/create-github-issue.sh"
    exit 1
fi

# Validate issue number format
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}❌ ERROR: Invalid issue number format: $ISSUE_NUMBER${NC}"
    exit 1
fi

# Create descriptive branch name with issue number
BRANCH_NAME="feature-$ISSUE_NUMBER-$BRIEF_DESC"
echo -e "${YELLOW}Creating branch:${NC} $BRANCH_NAME"

# Get current branch for reference
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Current branch:${NC} $CURRENT_BRANCH"

# Create feature branch if not already on it
if [[ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        echo -e "${YELLOW}Branch $BRANCH_NAME already exists, checking it out...${NC}"
        git checkout "$BRANCH_NAME"
    else
        echo -e "${YELLOW}Creating new branch: $BRANCH_NAME${NC}"
        git checkout -b "$BRANCH_NAME"
    fi
    
    # Switch back to main for worktree creation
    echo -e "${YELLOW}Switching back to main for worktree creation...${NC}"
    git checkout main
fi

# Create worktree
WORKTREE_PATH="../worktrees/$BRANCH_NAME"
echo -e "${YELLOW}Creating worktree at: $WORKTREE_PATH${NC}"

if [ -d "$WORKTREE_PATH" ]; then
    echo -e "${RED}❌ ERROR: Worktree directory already exists: $WORKTREE_PATH${NC}"
    echo "Remove it first with: git worktree remove $WORKTREE_PATH"
    exit 1
fi

git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
echo -e "${GREEN}✅ Worktree created successfully${NC}"

# Create handover file in the worktree
echo -e "${YELLOW}📖 Creating handover file in worktree...${NC}"
PURPOSE="Brief purpose description for GitHub issue #$ISSUE_NUMBER"

# Use the existing handover creation script
if ! ./src/scripts/git-worktree/create-handover.sh "$BRANCH_NAME" "$AGENT_ROLE" "$PURPOSE"; then
    echo -e "${RED}❌ ERROR: Failed to create handover file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Handover created!${NC}"

# Open VS Code using the existing TypeScript tool
echo -e "${YELLOW}🚀 Opening VS Code and installing dependencies...${NC}"
if ! tsx src/integrations/docker/host-bridge/container/cli/open-vscode.ts "$WORKTREE_PATH"; then
    echo -e "${RED}❌ ERROR: Failed to open VS Code${NC}"
    echo "You can manually open VS Code with: code $WORKTREE_PATH"
fi

# Complete the handoff
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Worktree created and VS Code opened!${NC}"
echo -e "${GREEN}✅ GitHub issue #$ISSUE_NUMBER is being tracked${NC}"
echo
echo "Please switch to the new VS Code window and verify:"
echo
echo "1. Run 'pwd' - you should be in the worktree directory"
echo "   (e.g., /workspace/worktrees/$BRANCH_NAME)"
echo
echo "2. Run 'git branch --show-current' - you should see your feature branch"
echo "   (should be: $BRANCH_NAME)"
echo
echo "3. Check that Claude is running in the terminal (container auto-starts)"
echo
echo "4. If everything looks correct, continue your work there."
echo "   If something seems wrong, let me know what you're seeing."
echo
echo -e "${BLUE}🎯 HANDOFF COMPLETE${NC}"
echo
echo "This conversation is now closed for feature work."
echo "All development should continue in the new worktree window."
echo
echo "┌─────────────────────────────────────────────┐"
echo "│  🚫 THIS WINDOW: Framework & project work   │"
echo "│  ✅ WORKTREE WINDOW: Feature development    │"
echo "└─────────────────────────────────────────────┘"
echo
echo "Only return here if you encounter issues with the worktree setup itself."

# Agent note: Study boundary protocol for post-handoff behavior
echo
echo -e "${YELLOW}Note for agent: Study src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol${NC}"
echo -e "${YELLOW}to understand how to enforce boundaries going forward.${NC}"