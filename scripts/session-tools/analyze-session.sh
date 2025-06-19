#!/bin/bash
# Analyze patterns in agent sessions
# Usage: ./analyze-session.sh < session.jsonl

set -e

echo "=== Session Analysis ==="
echo

# Basic metrics
TOTAL_MESSAGES=$(jq -s 'length' 2>/dev/null || echo 0)
USER_MESSAGES=$(jq -c 'select(.type == "user")' | wc -l)
ASSISTANT_MESSAGES=$(jq -c 'select(.type == "assistant")' | wc -l)

echo "Message Count:"
echo "- Total: $TOTAL_MESSAGES"
echo "- User: $USER_MESSAGES"
echo "- Assistant: $ASSISTANT_MESSAGES"
echo

# Tool usage analysis
echo "Tool Usage:"
jq -r '
    select(.message.content[0].type? == "tool_use") | 
    .message.content[0].name
' 2>/dev/null | sort | uniq -c | sort -nr | sed 's/^/  /'

echo

# Git commits (if tracked in manifest)
if [ -f "manifest.jsonl" ]; then
    echo "Git Commits in Session:"
    jq -r '.commits[]? | "  - \(.timestamp | split("T")[0]): \(.message | split("\n")[0])"' manifest.jsonl 2>/dev/null || echo "  None tracked"
    echo
fi

# Error analysis
echo "Errors Encountered:"
ERROR_COUNT=$(jq -c 'select(.toolUseResult.error?)' 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "  Total errors: $ERROR_COUNT"
    jq -r 'select(.toolUseResult.error?) | "  - \(.timestamp): \(.toolUseResult.error | split("\n")[0])"' 2>/dev/null | head -5
    [ "$ERROR_COUNT" -gt 5 ] && echo "  ... and $((ERROR_COUNT - 5)) more"
else
    echo "  None"
fi
echo

# Time analysis
FIRST_TS=$(jq -r 'select(.timestamp) | .timestamp' 2>/dev/null | head -1)
LAST_TS=$(jq -r 'select(.timestamp) | .timestamp' 2>/dev/null | tail -1)

if [ -n "$FIRST_TS" ] && [ -n "$LAST_TS" ]; then
    # Convert to seconds for calculation (macOS compatible)
    if date --version >/dev/null 2>&1; then
        # GNU date
        FIRST_SEC=$(date -d "$FIRST_TS" +%s 2>/dev/null || echo 0)
        LAST_SEC=$(date -d "$LAST_TS" +%s 2>/dev/null || echo 0)
    else
        # BSD date (macOS)
        FIRST_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${FIRST_TS%%.*}" +%s 2>/dev/null || echo 0)
        LAST_SEC=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${LAST_TS%%.*}" +%s 2>/dev/null || echo 0)
    fi
    
    if [ "$FIRST_SEC" -gt 0 ] && [ "$LAST_SEC" -gt 0 ]; then
        DURATION_SEC=$((LAST_SEC - FIRST_SEC))
        DURATION_MIN=$((DURATION_SEC / 60))
        echo "Session Duration: $DURATION_MIN minutes"
        echo "- Started: ${FIRST_TS%%.*}"
        echo "- Ended: ${LAST_TS%%.*}"
    fi
fi
echo

# File modifications
echo "Files Modified:"
jq -r '
    select(.message.content[0].name? == "Edit" or .message.content[0].name? == "Write") |
    .message.content[0].input.file_path // .message.content[0].input.path
' 2>/dev/null | sort | uniq | sed 's/^/  - /' | head -10

# Summary types if present
if jq -e 'select(.type == "summary")' >/dev/null 2>&1; then
    echo
    echo "Session Topics:"
    jq -r 'select(.type == "summary") | "  - \(.summary)"' 2>/dev/null
fi