#!/bin/bash
# create-github-issue.sh - Create or validate GitHub issue for worktree workflow
# Handles both creating new issues and using existing ones

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to create new issue
create_new_issue() {
    echo -e "${BLUE}Creating new GitHub issue...${NC}"
    echo
    
    read -p "Issue title: " TITLE
    if [[ -z "$TITLE" ]]; then
        echo "❌ Error: Issue title cannot be empty"
        exit 1
    fi
    
    echo "Issue description (press Ctrl+D when done):"
    BODY=$(cat)
    
    # Create GitHub issue and capture the number directly
    echo -e "${YELLOW}Creating issue with gh CLI...${NC}"
    ISSUE_URL=$(gh issue create \
        --title "$TITLE" \
        --body "$BODY" \
        --label "enhancement" \
        --assignee "@me" 2>/dev/null)
    
    # Extract issue number from the returned URL
    ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]\+$')
    
    if [[ -z "$ISSUE_NUMBER" ]]; then
        echo "❌ Error: Failed to extract issue number from: $ISSUE_URL"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Issue created: #$ISSUE_NUMBER${NC}"
    echo "$ISSUE_NUMBER"
}

# Function to validate existing issue
validate_existing_issue() {
    local issue_num="$1"
    
    # Validate issue number format
    if ! [[ "$issue_num" =~ ^[0-9]+$ ]]; then
        echo "❌ Error: Invalid issue number format: $issue_num"
        exit 1
    fi
    
    # Check if issue exists using gh CLI
    if ! gh issue view "$issue_num" >/dev/null 2>&1; then
        echo "❌ Error: Issue #$issue_num not found or not accessible"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Using existing issue: #$issue_num${NC}"
    echo "$issue_num"
}

# Main logic
echo -e "${BLUE}GitHub Issue Setup${NC}"
echo "Every worktree needs a GitHub issue to track the work."
echo
echo "Options:"
echo "1. Create a new issue"
echo "2. Use an existing issue"
echo

read -p "Enter your choice (1 or 2): " CHOICE

case "$CHOICE" in
    1)
        create_new_issue
        ;;
    2)
        read -p "Enter existing issue number: " EXISTING_ISSUE
        validate_existing_issue "$EXISTING_ISSUE"
        ;;
    *)
        echo "❌ Error: Invalid choice. Please enter 1 or 2."
        exit 1
        ;;
esac