#!/bin/bash
# Post-process a completed session
# Usage: ./post-process-session.sh <session_id> <role>

set -e

SESSION_ID=$1
ROLE=$2

if [ -z "$SESSION_ID" ] || [ -z "$ROLE" ]; then
    echo "Usage: $0 <session_id> <role>"
    exit 1
fi

echo "=== Post-Processing Session $SESSION_ID for $ROLE ==="

# 1. Extract session from Claude Code logs
echo "Extracting session data..."
./scripts/session-tools/extract-session.sh "$SESSION_ID" "$ROLE" > "apm/agents/$ROLE/sessions/${SESSION_ID}_full.jsonl"

# 2. Clean sensitive data
echo "Cleaning sensitive data..."
./scripts/session-tools/clean-logs.sh < "apm/agents/$ROLE/sessions/${SESSION_ID}_full.jsonl" \
    > "apm/agents/$ROLE/sessions/${SESSION_ID}_clean.jsonl"

# 3. Generate session analysis
echo "Analyzing session..."
./scripts/session-tools/analyze-session.sh < "apm/agents/$ROLE/sessions/${SESSION_ID}_clean.jsonl" \
    > "apm/agents/$ROLE/sessions/${SESSION_ID}_analysis.txt"

# 4. Extract patterns for memory update
echo "Extracting patterns..."
PATTERNS_FILE="apm/agents/$ROLE/sessions/${SESSION_ID}_patterns.md"

cat > "$PATTERNS_FILE" << EOF
# Session Patterns - $SESSION_ID

## Session Summary
$(grep "Session Duration:" "apm/agents/$ROLE/sessions/${SESSION_ID}_analysis.txt" || echo "Duration: Unknown")
$(grep "Total:" "apm/agents/$ROLE/sessions/${SESSION_ID}_analysis.txt" || echo "Messages: Unknown")

## Key Activities
$(grep -A 20 "Tool Usage:" "apm/agents/$ROLE/sessions/${SESSION_ID}_analysis.txt" | grep -E "^\s+[0-9]+" || echo "No tool usage data")

## Files Modified
$(grep -A 20 "Files Modified:" "apm/agents/$ROLE/sessions/${SESSION_ID}_analysis.txt" | grep -E "^\s+-" || echo "No files modified")

## Commits Made
$(jq -r '.commits[]? | "- \(.message) (\(.sha[0:7]))"' "apm/agents/$ROLE/sessions/manifest.jsonl" 2>/dev/null || echo "No commits tracked")

## Milestones Achieved
$(jq -r '.milestones[]? | "- \(.description)"' "apm/agents/$ROLE/sessions/manifest.jsonl" 2>/dev/null || echo "No milestones tracked")

---
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

echo "Pattern extraction saved to $PATTERNS_FILE"

# 5. Update topic in manifest if still generic
CURRENT_TOPIC=$(jq -r '.[-1].topic' "apm/agents/$ROLE/sessions/manifest.jsonl" 2>/dev/null)
if [ "$CURRENT_TOPIC" = "session" ]; then
    # Try to determine topic from milestones or commits
    NEW_TOPIC=$(jq -r '.milestones[0].description // .commits[0].message // "session"' \
        "apm/agents/$ROLE/sessions/manifest.jsonl" 2>/dev/null | \
        cut -d' ' -f1-3 | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
    
    if [ "$NEW_TOPIC" != "session" ] && [ -n "$NEW_TOPIC" ]; then
        echo "Updating session topic to: $NEW_TOPIC"
        jq --arg topic "$NEW_TOPIC" '(.[-1].topic) = $topic' \
            "apm/agents/$ROLE/sessions/manifest.jsonl" > tmp && \
            mv tmp "apm/agents/$ROLE/sessions/manifest.jsonl"
    fi
fi

# 6. Optional: Send notification (requires node-notifier)
if command -v node >/dev/null 2>&1 && [ -f "scripts/notify.js" ]; then
    node scripts/notify.js "Session Complete" "Post-processing finished for $ROLE session $SESSION_ID"
fi

echo "=== Post-Processing Complete ==="
echo "Results saved in: apm/agents/$ROLE/sessions/"
echo "- Full log: ${SESSION_ID}_full.jsonl"
echo "- Clean log: ${SESSION_ID}_clean.jsonl"
echo "- Analysis: ${SESSION_ID}_analysis.txt"
echo "- Patterns: ${SESSION_ID}_patterns.md"