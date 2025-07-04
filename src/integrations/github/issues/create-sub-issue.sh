#!/bin/bash

# GitHub Sub-Issue Creator
# Usage: ./create-sub-issue.sh <parent_issue_number> <child_issue_number>
# 
# Creates a sub-issue relationship between two existing GitHub issues.
# Automatically detects the current repository.

set -e  # Exit on any error

# Check arguments
if [ $# -ne 2 ]; then
    echo "❌ Usage: $0 <parent_issue_number> <child_issue_number>"
    echo "   Example: $0 26 30"
    exit 1
fi

PARENT_NUMBER=$1
CHILD_NUMBER=$2

# Validate inputs are numbers
if ! [[ "$PARENT_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "❌ Parent issue must be a number, got: $PARENT_NUMBER"
    exit 1
fi

if ! [[ "$CHILD_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "❌ Child issue must be a number, got: $CHILD_NUMBER"
    exit 1
fi

echo "🔍 Auto-detecting repository..."

# Get repository info
REPO_INFO=$(gh repo view --json owner,name 2>/dev/null) || {
    echo "❌ Failed to detect repository. Are you in a git repo with GitHub remote?"
    exit 1
}

OWNER=$(echo "$REPO_INFO" | jq -r '.owner.login')
REPO=$(echo "$REPO_INFO" | jq -r '.name')

echo "📂 Repository: $OWNER/$REPO"
echo "🔗 Linking: #$CHILD_NUMBER → #$PARENT_NUMBER"

# Validate parent issue exists
echo "🔍 Validating parent issue #$PARENT_NUMBER..."
PARENT_RESPONSE=$(gh api "/repos/$OWNER/$REPO/issues/$PARENT_NUMBER" 2>/dev/null) || {
    echo "❌ Parent issue #$PARENT_NUMBER not found"
    exit 1
}

PARENT_TITLE=$(echo "$PARENT_RESPONSE" | jq -r '.title')
echo "✅ Parent: #$PARENT_NUMBER - $PARENT_TITLE"

# Validate child issue exists and get ID
echo "🔍 Validating child issue #$CHILD_NUMBER..."
CHILD_RESPONSE=$(gh api "/repos/$OWNER/$REPO/issues/$CHILD_NUMBER" 2>/dev/null) || {
    echo "❌ Child issue #$CHILD_NUMBER not found"
    exit 1
}

CHILD_TITLE=$(echo "$CHILD_RESPONSE" | jq -r '.title')
CHILD_ID=$(echo "$CHILD_RESPONSE" | jq '.id')
echo "✅ Child: #$CHILD_NUMBER - $CHILD_TITLE"
echo "🆔 Child ID: $CHILD_ID"

# Create sub-issue relationship
echo "🔄 Creating sub-issue relationship..."
LINK_RESPONSE=$(gh api --method POST \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/$OWNER/$REPO/issues/$PARENT_NUMBER/sub_issues" \
    --input - <<< "{\"sub_issue_id\": $CHILD_ID}" 2>/dev/null) || {
    echo "❌ Failed to create sub-issue relationship"
    echo "   This might happen if the relationship already exists"
    exit 1
}

# Verify success
echo "🔍 Verifying relationship..."
VERIFICATION=$(gh api "/repos/$OWNER/$REPO/issues/$PARENT_NUMBER" | jq '.sub_issues_summary')
TOTAL=$(echo "$VERIFICATION" | jq '.total')
COMPLETED=$(echo "$VERIFICATION" | jq '.completed')
PERCENT=$(echo "$VERIFICATION" | jq '.percent_completed')

echo "✅ Success! Sub-issue relationship created"
echo "📊 Parent issue #$PARENT_NUMBER now has:"
echo "   • Total sub-issues: $TOTAL"
echo "   • Completed: $COMPLETED"
echo "   • Progress: $PERCENT%"
echo ""
echo "🌐 View in GitHub:"
echo "   Parent: https://github.com/$OWNER/$REPO/issues/$PARENT_NUMBER"
echo "   Child:  https://github.com/$OWNER/$REPO/issues/$CHILD_NUMBER"