#!/bin/bash
# Git worktree handover check script
# Used by Claude Code when VS Code opens a new window

# 1. Check if we're in a worktree
if ! git worktree list --porcelain | grep -q "$(pwd)"; then
    # Not a worktree - regular VS Code session
    echo "What would you like to work on?"
    exit 0
fi

# 2. Get branch and look for handover
BRANCH=$(git branch --show-current)
HANDOVER=$(ls apm/worktree-handovers/not-started/*-${BRANCH}.md 2>/dev/null | head -1)

# 3. Process if found
if [ -n "$HANDOVER" ]; then
    echo "📋 Processing handover for branch: $BRANCH"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Display handover content
    cat "$HANDOVER"
    
    # Move to completed (one-time use)
    mkdir -p apm/worktree-handovers/completed/
    mv "$HANDOVER" apm/worktree-handovers/completed/
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Handover processed and moved to completed/"
    echo "📌 Initialize as specified agent role above"
else
    # No handover - provide context
    echo "📂 Worktree for branch: $BRANCH"
    echo "📝 Latest commit: $(git log -1 --oneline)"
    echo ""
    echo "What would you like me to help with?"
fi