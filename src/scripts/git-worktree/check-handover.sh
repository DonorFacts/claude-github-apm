#!/bin/bash
# Git worktree handover check script
# Used by Claude Code when VS Code opens a new window

# 1. Handle container vs host path detection
CURRENT_DIR=$(pwd)
echo "🔧 Starting in: $CURRENT_DIR"

# Check if we're in a worktree by path pattern (works in both container and host)
if [[ ! "$CURRENT_DIR" =~ worktrees/ ]]; then
    # Not a worktree - regular VS Code session
    echo "What would you like to work on?"
    exit 0
fi

# For container environments, we may not be able to run git commands directly
# Skip git verification in container mode and rely on path detection
if [[ "$CURRENT_DIR" =~ ^/workspace ]]; then
    echo "🐳 Container environment detected - skipping git verification"
else
    # Verify git repository exists (host environment only)
    if ! git status >/dev/null 2>&1; then
        echo "⚠️  Git repository not found in current directory"
        echo "   You may need to recreate this worktree"
        exit 1
    fi
fi

# 2. Get branch and look for handover
if [[ "$CURRENT_DIR" =~ ^/workspace ]]; then
    # Container environment - extract branch from path
    BRANCH=$(basename "$CURRENT_DIR")
    echo "🐳 Detected branch from path: $BRANCH"
else
    # Host environment - use git command
    BRANCH=$(git branch --show-current)
fi

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