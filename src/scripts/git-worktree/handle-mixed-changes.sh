#!/bin/bash
# handle-mixed-changes.sh - Section D: Mixed changes (mine + others)
# Handles separating changes by authorship using git stash and selective adds

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

echo -e "${BLUE}Handling Mixed Changes (Mine + Others)${NC}"
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
echo "All changed files:"
git status --short
echo

# Guidance for user
echo -e "${YELLOW}⚠️  MIXED CHANGES DETECTED${NC}"
echo "You need to identify which files YOU modified vs. files modified by OTHERS."
echo
echo "Guidelines:"
echo "• Files you created/modified in this session = YOUR changes"
echo "• Files that were already modified when session started = OTHERS' changes" 
echo "• When in doubt, err on the side of caution and leave on main"
echo

# Interactive file selection
echo -e "${BLUE}Step 1: Identify YOUR files${NC}"
echo "We'll go through each changed file and you can mark it as yours or not."
echo

# Get list of changed files
mapfile -t CHANGED_FILES < <(git status --porcelain | awk '{print $2}')
MY_FILES=()

for file in "${CHANGED_FILES[@]}"; do
    echo -n "Is '$file' a file YOU modified? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        MY_FILES+=("$file")
        echo -e "${GREEN}  ✓ Added to YOUR files${NC}"
    else
        echo -e "${YELLOW}  - Left for others${NC}"
    fi
done

# Validate selection
if [ ${#MY_FILES[@]} -eq 0 ]; then
    echo -e "${RED}❌ ERROR: No files selected as yours${NC}"
    echo "Use handle-others-changes.sh if all changes are from others."
    exit 1
fi

echo
echo -e "${BLUE}Summary:${NC}"
echo -e "${GREEN}YOUR files (${#MY_FILES[@]}):${NC}"
for file in "${MY_FILES[@]}"; do
    echo "  - $file"
done

echo -e "${YELLOW}OTHERS' files ($((UNCOMMITTED_COUNT - ${#MY_FILES[@]})):${NC}"
for file in "${CHANGED_FILES[@]}"; do
    # Check if file is not in MY_FILES array
    if [[ ! " ${MY_FILES[*]} " =~ " ${file} " ]]; then
        echo "  - $file"
    fi
done

echo
read -p "Proceed with this file separation? (y/N): " FINAL_CONFIRM
if [[ ! "$FINAL_CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Aborted${NC}"
    exit 1
fi

# Stash everything
echo -e "${YELLOW}Step 2: Stashing all changes...${NC}"
STASH_MESSAGE="Mixed changes on main - separating by authorship"
git stash push -u -m "$STASH_MESSAGE"
echo -e "${GREEN}✅ All changes stashed${NC}"

# Create descriptive branch name with issue number
BRANCH_NAME="feature-$ISSUE_NUMBER-$BRIEF_DESC"
echo -e "${YELLOW}Step 3: Creating feature branch...${NC}"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo -e "${RED}❌ ERROR: Branch $BRANCH_NAME already exists${NC}"
    echo "Please choose a different brief description or delete the existing branch."
    exit 1
fi

git checkout -b "$BRANCH_NAME"
echo -e "${GREEN}✅ Created feature branch: $BRANCH_NAME${NC}"

# Apply stash and selectively add YOUR changes only
echo -e "${YELLOW}Step 4: Applying stash and selecting your files...${NC}"
git stash pop

# Add only YOUR files
echo -e "${YELLOW}Adding your files to feature branch...${NC}"
for file in "${MY_FILES[@]}"; do
    if [ -f "$file" ] || [ -d "$file" ]; then
        git add "$file"
        echo -e "${GREEN}  ✓ Added: $file${NC}"
    else
        echo -e "${YELLOW}  ⚠ File not found: $file${NC}"
    fi
done

# Reset others' files (remove from staging)
echo -e "${YELLOW}Unstaging others' files...${NC}"
for file in "${CHANGED_FILES[@]}"; do
    if [[ ! " ${MY_FILES[*]} " =~ " ${file} " ]]; then
        git reset "$file" 2>/dev/null || true
        echo -e "${YELLOW}  - Unstaged: $file${NC}"
    fi
done

# Commit your changes
echo -e "${YELLOW}Step 5: Committing your changes...${NC}"
if git diff --cached --quiet; then
    echo -e "${RED}❌ ERROR: No changes staged for commit${NC}"
    echo "This shouldn't happen. Please check your file selection."
    exit 1
fi

git commit -m "feat: initial work - separated from mixed changes"
echo -e "${GREEN}✅ Your changes committed to feature branch${NC}"

# Re-stash others' changes for transfer back to main
echo -e "${YELLOW}Step 6: Re-stashing others' changes...${NC}"
if ! git diff --quiet || ! git diff --staged --quiet; then
    git stash push -u -m "Others' changes - returning to main"
    HAVE_OTHERS_STASH=true
else
    HAVE_OTHERS_STASH=false
    echo -e "${YELLOW}  No others' changes to stash${NC}"
fi

# Switch back to main and restore others' changes
echo -e "${YELLOW}Step 7: Returning to main and restoring others' changes...${NC}"
git checkout main

if [ "$HAVE_OTHERS_STASH" = true ]; then
    git stash pop
    echo -e "${GREEN}✅ Others' changes restored on main${NC}"
fi

# Now follow clean worktree creation path
echo
echo -e "${BLUE}Step 8: Proceeding with clean worktree creation...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Call the clean worktree creation script
if ! ./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "$AGENT_ROLE" "$BRIEF_DESC"; then
    echo -e "${RED}❌ ERROR: Failed to create clean worktree${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Mixed changes separated and worktree created successfully!${NC}"