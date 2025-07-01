#!/bin/bash
# Search for similar bugs in history

query="$1"

echo "=== Searching for similar bugs: '$query' ==="

# Search in commits
echo -e "\n📝 In Commits:"
git log --grep="$query" --grep="fix" --all-match --oneline -10

# Search in bug memory
echo -e "\n🧠 In Bug Memory:"
grep -i "$query" ./apm/memory/bugs/*.md 2>/dev/null | head -10

# Search in code summaries for bug-related patterns
echo -e "\n📋 In Code Summaries:"
grep -i "bug\|issue\|fix" ./apm/code-summaries/**/*-summary.md 2>/dev/null | grep -i "$query" | head -10

# Search GitHub issues
if command -v gh &> /dev/null; then
    echo -e "\n🐛 In GitHub Issues:"
    gh issue list --search "$query" --state all --limit 5
fi