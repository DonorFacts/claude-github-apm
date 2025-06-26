#!/bin/bash
# Create or update GitHub PR intelligently
# Usage: ./create-or-update-pr.sh "PR Title"

set -e

# Validate arguments
if [ $# -eq 0 ]; then
    echo "Error: PR title required"
    echo "Usage: $0 \"<type>: <description>\""
    echo "Example: $0 \"feat: add user authentication\""
    exit 1
fi

TITLE="$1"
BRANCH=$(git branch --show-current)

# Ensure we're not on main/master
if [[ "$BRANCH" =~ ^(main|master)$ ]]; then
    echo "❌ Cannot create PR from main/master branch"
    echo "Please create a feature branch first"
    exit 1
fi

# Push branch with tracking
echo "📤 Pushing branch $BRANCH..."
git push -u origin "$BRANCH"

# Check for existing open PR
echo "🔍 Checking for existing PRs..."
EXISTING_PR=$(gh pr list --head "$BRANCH" --state open --json number,url --jq '.[0]')

if [[ -n "$EXISTING_PR" ]]; then
    PR_NUM=$(echo "$EXISTING_PR" | jq -r '.number')
    PR_URL=$(echo "$EXISTING_PR" | jq -r '.url')
    echo "✅ Found open PR #$PR_NUM"
    echo "📝 Updating PR body with latest changes..."
    
    # Update PR body
    gh pr edit "$PR_NUM" --body "$(./scripts/git/generate-pr-body.sh)"
    
    echo "✨ PR updated successfully!"
    echo "🔗 $PR_URL"
    exit 0
fi

# Check for closed PR that wasn't merged
CLOSED_PR=$(gh pr list --head "$BRANCH" --state closed --json number,mergedAt,url --jq '.[0]')

if [[ -n "$CLOSED_PR" ]] && [[ "$(echo "$CLOSED_PR" | jq -r '.mergedAt')" == "null" ]]; then
    PR_NUM=$(echo "$CLOSED_PR" | jq -r '.number')
    PR_URL=$(echo "$CLOSED_PR" | jq -r '.url')
    echo "🔄 Found closed (unmerged) PR #$PR_NUM"
    echo "♻️ Reopening PR..."
    
    # Reopen and update
    gh pr reopen "$PR_NUM"
    gh pr edit "$PR_NUM" --body "$(./scripts/git/generate-pr-body.sh)"
    
    echo "✨ PR reopened and updated!"
    echo "🔗 $PR_URL"
    exit 0
fi

# Check if PR was already merged
if [[ -n "$CLOSED_PR" ]] && [[ "$(echo "$CLOSED_PR" | jq -r '.mergedAt')" != "null" ]]; then
    PR_NUM=$(echo "$CLOSED_PR" | jq -r '.number')
    echo "⚠️  PR #$PR_NUM was already merged for this branch"
    echo "If you have new changes, consider:"
    echo "1. Creating a new branch from main"
    echo "2. Cherry-picking your new commits"
    echo "3. Creating a fresh PR"
    exit 1
fi

# Create new PR
echo "📝 Creating new PR..."
PR_URL=$(gh pr create \
  --title "$TITLE" \
  --body "$(./scripts/git/generate-pr-body.sh)" \
  --assignee @me \
  2>&1 | grep -oE 'https://github\.com/[^/]+/[^/]+/pull/[0-9]+' | head -1)

if [[ -n "$PR_URL" ]]; then
    echo "✨ PR created successfully!"
    echo "🔗 $PR_URL"
else
    echo "❌ Failed to create PR"
    echo "Run 'gh pr create' manually to see the error"
    exit 1
fi