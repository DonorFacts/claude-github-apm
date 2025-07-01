#!/bin/bash
# List recent bugs from commits, issues, and PRs

# Extract bugs from recent commits
echo "=== Recent Bug Fixes ==="
git log --oneline --grep="fix\|bug\|issue" -20 | while read commit; do
    hash=$(echo "$commit" | cut -d' ' -f1)
    message=$(echo "$commit" | cut -d' ' -f2-)
    
    # Extract issue numbers if present
    issues=$(echo "$message" | grep -oE '#[0-9]+' | tr '\n' ' ')
    
    echo "• $message"
    if [ -n "$issues" ]; then
        echo "  Issues: $issues"
    fi
    
    # Show files changed (context for the fix)
    echo "  Files: $(git diff-tree --no-commit-id --name-only -r $hash | tr '\n' ' ')"
    echo ""
done

# Extract from GitHub issues (if gh CLI available)
if command -v gh &> /dev/null; then
    echo "=== Recent GitHub Issues (Bugs) ==="
    gh issue list --label "bug" --state all --limit 10 --json number,title,state,closedAt \
        --jq '.[] | "• #\(.number): \(.title) [\(.state)]"'
fi