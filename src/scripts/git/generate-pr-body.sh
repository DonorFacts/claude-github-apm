#!/bin/bash
# Generate comprehensive PR body from commit analysis

BRANCH=$(git branch --show-current)
COMMIT_COUNT=$(git log --format="%H" main..HEAD | wc -l)
ISSUE_NUMBER="$1"  # Optional issue number parameter

# Extract first commit type and summary for PR title hint
FIRST_COMMIT=$(git log --reverse --format="%s" main..HEAD | head -1)

echo "## Summary"
echo ""
echo "This PR contains $COMMIT_COUNT commits on branch \`$BRANCH\`."
echo ""

# Analyze commit types
echo "## Changes by Type"
echo ""
git log --format="%s" main..HEAD | cut -d: -f1 | sort | uniq -c | while read count type; do
    echo "- **$type**: $count changes"
done
echo ""

# Extract major changes from commit bodies
echo "## Major Changes"
echo ""
git log --reverse --format="%B" main..HEAD | grep "^- " | while read line; do
    echo "$line"
done | sort | uniq
echo ""

# Extract key improvements/metrics
echo "## Key Improvements"
echo ""
git log --format="%B" main..HEAD | grep -E "[0-9]+%|reduction|improve|optimize|token|performance" | while read line; do
    echo "- $line"
done | sort | uniq
echo ""

# File tree
echo "## Files Changed"
echo ""
echo "\`\`\`"
echo "Added ($(git diff --name-status main..HEAD | grep -c "^A")):"
git diff --name-status main..HEAD | grep "^A" | cut -f2 | sort | sed 's/^/  + /'
echo ""
echo "Modified ($(git diff --name-status main..HEAD | grep -c "^M")):"
git diff --name-status main..HEAD | grep "^M" | cut -f2 | sort | sed 's/^/  ~ /'
echo ""
if git diff --name-status main..HEAD | grep -q "^D"; then
    echo "Deleted ($(git diff --name-status main..HEAD | grep -c "^D")):"
    git diff --name-status main..HEAD | grep "^D" | cut -f2 | sort | sed 's/^/  - /'
    echo ""
fi
if git diff --name-status main..HEAD | grep -q "^R"; then
    echo "Renamed ($(git diff --name-status main..HEAD | grep -c "^R")):"
    git diff --name-status main..HEAD | grep "^R" | awk '{print $2 " → " $3}' | sort | sed 's/^/  → /'
    echo ""
fi
echo "\`\`\`"
echo ""

# Detailed commit breakdown
echo "## Commit Details"
echo ""
git log --reverse --format="%h|%s" main..HEAD | while IFS='|' read hash summary; do
    echo "### $hash: $summary"
    git log --format="%B" -1 $hash | tail -n +3 | grep -E "^- |^  " | head -10
    echo ""
done

# Extract issues
echo "## Related Issues"
echo ""

# If issue number was provided as parameter, include it
if [ -n "$ISSUE_NUMBER" ]; then
    echo "Closes: #$ISSUE_NUMBER"
fi

# Also extract any issues from commit messages
COMMIT_ISSUES=$(git log --format="%B" main..HEAD | grep -oE "(Issues|Fixes|Closes): #[0-9]+" | sort | uniq)
if [ -n "$COMMIT_ISSUES" ]; then
    echo "$COMMIT_ISSUES"
fi

# If no issues found anywhere
if [ -z "$ISSUE_NUMBER" ] && [ -z "$COMMIT_ISSUES" ]; then
    echo "No issues referenced in commits"
fi
echo ""

# Generate test plan based on changes
echo "## Test Plan"
echo ""
echo "Based on the changes in this PR:"
echo ""

# Check for test files
if git diff --name-only main..HEAD | grep -qE "\.(test|spec)\.(ts|js)"; then
    echo "- [ ] Run all new/modified tests"
fi

# Check for documentation
if git diff --name-only main..HEAD | grep -qE "\.(md)$"; then
    echo "- [ ] Review documentation for accuracy"
fi

# Check for config changes
if git diff --name-only main..HEAD | grep -qE "(config|settings|\.json)"; then
    echo "- [ ] Verify configuration changes work correctly"
fi

# Check for new features
if git log --format="%s" main..HEAD | grep -q "^feat:"; then
    echo "- [ ] Test all new features"
fi

# Check for fixes
if git log --format="%s" main..HEAD | grep -q "^fix:"; then
    echo "- [ ] Verify bug fixes resolve issues"
fi

echo "- [ ] Confirm no regressions in existing functionality"
echo "- [ ] Validate all modified files work as expected"
echo ""

echo "## Impact"
echo ""
echo "This PR impacts:"
echo ""
# Analyze directories changed
git diff --name-only main..HEAD | cut -d/ -f1-2 | sort | uniq | while read dir; do
    COUNT=$(git diff --name-only main..HEAD | grep "^$dir" | wc -l)
    echo "- \`$dir\`: $COUNT files"
done

echo ""
echo "---"
echo "🤖 Generated with [Claude Code](https://claude.ai/code)"