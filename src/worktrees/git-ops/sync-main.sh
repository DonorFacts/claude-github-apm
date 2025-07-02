#!/bin/bash
# sync-main.sh - Sync local main branch with remote while preserving local changes

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting main branch sync...${NC}"

# 1. Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Error: Not on main branch. Currently on: $CURRENT_BRANCH${NC}"
    echo "Please switch to main branch first: git checkout main"
    exit 1
fi

# 2. Check for uncommitted changes
echo -e "${BLUE}📋 Checking git status...${NC}"
git status --porcelain

# Get list of modified tracked files
MODIFIED_FILES=$(git diff --name-only)
if [ -z "$MODIFIED_FILES" ]; then
    echo -e "${GREEN}✓ No modified tracked files${NC}"
else
    echo -e "${YELLOW}⚠️  Modified tracked files detected:${NC}"
    echo "$MODIFIED_FILES"
fi

# 3. Fetch latest from remote
echo -e "${BLUE}📥 Fetching latest from origin/main...${NC}"
git fetch origin main

# Check if we're behind
BEHIND=$(git rev-list HEAD..origin/main --count)
if [ "$BEHIND" -eq 0 ]; then
    echo -e "${GREEN}✅ Already up to date with origin/main${NC}"
    exit 0
fi

echo -e "${YELLOW}📊 Local main is behind origin/main by $BEHIND commits${NC}"

# 4. Stash modified files if any
STASH_CREATED=false
if [ -n "$MODIFIED_FILES" ]; then
    echo -e "${BLUE}📦 Stashing modified files...${NC}"
    git stash push -m "sync-main: temporary stash $(date +%Y-%m-%d_%H:%M:%S)" -- $MODIFIED_FILES
    STASH_CREATED=true
fi

# 5. Attempt merge
echo -e "${BLUE}🔀 Merging origin/main...${NC}"
if git merge origin/main --no-edit; then
    echo -e "${GREEN}✓ Merge successful${NC}"
    
    # 6. Restore stashed changes if any
    if [ "$STASH_CREATED" = true ]; then
        echo -e "${BLUE}📤 Restoring stashed changes...${NC}"
        
        if git stash pop; then
            echo -e "${GREEN}✓ Successfully restored local changes${NC}"
        else
            echo -e "${RED}❌ Merge conflicts detected when restoring local changes${NC}"
            echo -e "${YELLOW}Your options:${NC}"
            echo "1. Resolve conflicts manually, then run: git add <files> && git reset HEAD <files>"
            echo "2. Keep remote version: git checkout --theirs <files>"
            echo "3. Keep local version: git checkout --ours <files>"
            echo "4. View stash: git stash show -p"
            echo ""
            echo -e "${YELLOW}Stash is preserved. After resolving, run: git stash drop${NC}"
            exit 1
        fi
    fi
else
    echo -e "${RED}❌ Merge failed${NC}"
    echo "Please resolve merge conflicts manually"
    
    # If we stashed, remind user
    if [ "$STASH_CREATED" = true ]; then
        echo -e "${YELLOW}Note: Your local changes are safely stashed${NC}"
        echo "After resolving merge conflicts and committing, run: git stash pop"
    fi
    exit 1
fi

# 7. Final status
echo -e "${BLUE}📊 Final status:${NC}"
git status --short

echo -e "${GREEN}✅ Sync complete! Your main branch is up to date with origin/main${NC}"