#!/bin/bash
# Git worktree handover check script
# Used by Claude Code when VS Code opens a new window

# 1. Check if we're in a worktree (container environment assumed)
CURRENT_DIR=$(pwd)
echo "🔧 Starting in: $CURRENT_DIR"

# Verify we're in container environment
if [[ ! "$CURRENT_DIR" =~ ^/workspace ]]; then
    echo "❌ ERROR: Worktree handover requires container environment"
    echo "   Current path: $CURRENT_DIR"
    echo "   Expected: /workspace/..."
    exit 1
fi

# Check if we're in a worktree by path pattern
if [[ ! "$CURRENT_DIR" =~ /worktrees/ ]]; then
    # Not a worktree - regular VS Code session
    echo "What would you like to work on?"
    exit 0
fi

# 2. Get branch name from path (container environment)
BRANCH=$(basename "$CURRENT_DIR")
echo "🐳 Detected branch from path: $BRANCH"

BRANCH_SAFE=${BRANCH//\//-}  # Convert forward slashes to hyphens for file matching

# Look for handover files in any agent directory
HANDOVER=""
for agent_dir in apm/agents/*/not-started; do
    if [ -d "$agent_dir" ]; then
        handover_file=$(ls "$agent_dir"/*-${BRANCH_SAFE}.md 2>/dev/null | head -1)
        if [ -n "$handover_file" ]; then
            HANDOVER="$handover_file"
            break
        fi
    fi
done

# 3. Process if found
if [ -n "$HANDOVER" ]; then
    echo "📋 Processing handover for branch: $BRANCH"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Display handover content
    cat "$HANDOVER"
    
    # Move to completed (one-time use)
    # Extract agent role from the handover path
    AGENT_ROLE=$(echo "$HANDOVER" | sed 's|apm/agents/\([^/]*\)/not-started/.*|\1|')
    mkdir -p "apm/agents/${AGENT_ROLE}/completed/"
    mv "$HANDOVER" "apm/agents/${AGENT_ROLE}/completed/"
    
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