#!/bin/bash
# Generate meaningful GitHub issue body from commit analysis

BRANCH=$(git branch --show-current)
COMMIT_COUNT=$(git log --format="%H" main..HEAD | wc -l)

echo "## Problem Statement"
echo ""

# Try to extract purpose from first commit
FIRST_COMMIT_BODY=$(git log --reverse --format="%B" main..HEAD | head -20)
if echo "$FIRST_COMMIT_BODY" | grep -q "^- "; then
    echo "This work addresses the following needs:"
    echo ""
    echo "$FIRST_COMMIT_BODY" | grep "^- " | head -5
else
    echo "This work involves implementing changes across $COMMIT_COUNT commits on branch \`$BRANCH\`."
fi
echo ""

echo "## Proposed Solution"
echo ""

# Analyze commit types to understand scope
echo "The implementation will include:"
echo ""
git log --format="%s" main..HEAD | cut -d: -f1 | sort | uniq -c | while read count type; do
    case "$type" in
        "feat") echo "- **New Features**: $count implementations" ;;
        "fix") echo "- **Bug Fixes**: $count issues resolved" ;;
        "docs") echo "- **Documentation**: $count updates" ;;
        "refactor") echo "- **Code Improvements**: $count refactoring changes" ;;
        "test") echo "- **Testing**: $count test additions/updates" ;;
        "chore") echo "- **Maintenance**: $count housekeeping tasks" ;;
        *) echo "- **$type**: $count changes" ;;
    esac
done
echo ""

# Extract key improvements/features
echo "## Key Features & Improvements"
echo ""
git log --format="%B" main..HEAD | grep "^- " | grep -v "^- \[\]" | sort | uniq | head -10
echo ""

# Files that will be affected
echo "## Files Affected"
echo ""
echo "This change will modify approximately $(git diff --name-only main..HEAD | wc -l) files across:"
echo ""
git diff --name-only main..HEAD | cut -d/ -f1-2 | sort | uniq | while read dir; do
    COUNT=$(git diff --name-only main..HEAD | grep "^$dir" | wc -l)
    echo "- \`$dir/\`: $COUNT files"
done
echo ""

# Extract any metrics or performance improvements
IMPROVEMENTS=$(git log --format="%B" main..HEAD | grep -E "[0-9]+%|reduction|improve|optimize|token|performance" | head -5)
if [ -n "$IMPROVEMENTS" ]; then
    echo "## Expected Improvements"
    echo ""
    echo "$IMPROVEMENTS" | while read line; do
        echo "- $line"
    done
    echo ""
fi

echo "## Acceptance Criteria"
echo ""
echo "- [ ] All new functionality works as designed"
echo "- [ ] Existing functionality remains unaffected"
echo "- [ ] Documentation is updated where necessary"

# Add specific criteria based on change types
if git log --format="%s" main..HEAD | grep -q "^test:"; then
    echo "- [ ] All tests pass"
fi

if git diff --name-only main..HEAD | grep -qE "\.(md)$"; then
    echo "- [ ] Documentation is accurate and complete"
fi

if git log --format="%B" main..HEAD | grep -qE "token|performance|optimization"; then
    echo "- [ ] Performance improvements are verified"
fi

echo "- [ ] Code review feedback is addressed"
echo ""

echo "## Additional Context"
echo ""
echo "Branch: \`$BRANCH\`"
echo "Commits: $COMMIT_COUNT"
echo ""
echo "This issue tracks the development work being done in the associated branch."
echo "See the linked PR for detailed implementation discussion and code review."
echo ""
echo "---"
echo "🤖 Generated with [Claude Code](https://claude.ai/code)"