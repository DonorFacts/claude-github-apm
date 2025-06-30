#!/bin/bash
# create-handover.sh - Creates handover file in worktree agent directory
# Uses agent-specific directory structure for better organization
# REQUIRES: Container environment for consistent path handling

set -e

# Validate container environment
if [[ ! "$PWD" =~ ^/workspace ]]; then
    echo "❌ ERROR: Handover creation requires container environment"
    echo "   Current path: $PWD"
    echo "   Expected: /workspace/..."
    echo "   Start Claude Code in container mode first"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Usage
if [ $# -lt 3 ]; then
    echo "Usage: $0 <branch-name> <agent-role> <purpose>"
    echo "Example: $0 feature-auth developer 'Implement user authentication'"
    exit 1
fi

BRANCH_NAME="$1"
AGENT_ROLE="$2"
PURPOSE="$3"
DATE_PREFIX=$(date +%Y_%m_%d)
HANDOVER_FILENAME="${DATE_PREFIX}-${BRANCH_NAME}.md"

# Get the current working directory (should be main repo)
MAIN_DIR=$(pwd)
WORKTREE_DIR="../worktrees/${BRANCH_NAME}"

# Function to create handover content
create_handover_content() {
    cat << EOF
# Worktree Handover: ${BRANCH_NAME}

## Agent Initialization

**Role**: ${AGENT_ROLE}  
**Initialize with**: \`src/prompts/agents/${AGENT_ROLE}/init.md\`

## Task Context

**GitHub Issue**: #<number>  
**Purpose**: ${PURPOSE}  
**Scope**: <detailed description of what needs to be done>

## Memory Transfer from Previous Session

### Work Already Completed
- Created this worktree from main branch
- No code written yet (fresh start)

### Current State
- Fresh worktree ready for development
- All dependencies installed

### Key Context
<Important information the new agent needs to know>

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as ${AGENT_ROLE} agent
3. <First specific task>
4. <Second specific task>
5. <Continue with...>

## Resources and References

- Related PRs: #<numbers>
- Key files to review: <paths>
- Documentation to consult: <paths>

## Special Instructions

<Any unique requirements or warnings>

---
*Handover created: $(date -u +%Y-%m-%dT%H:%M:%SZ)*
EOF
}

# Create directory in worktree using agent-specific structure
echo -e "${YELLOW}Creating handover directory in worktree...${NC}"
mkdir -p "${WORKTREE_DIR}/apm/agents/${AGENT_ROLE}/not-started"

# Create handover file in worktree agent directory
WORKTREE_HANDOVER="${WORKTREE_DIR}/apm/agents/${AGENT_ROLE}/not-started/${HANDOVER_FILENAME}"
echo -e "${GREEN}Creating handover in worktree agent directory...${NC}"
create_handover_content > "${WORKTREE_HANDOVER}"
echo "✅ Created: ${WORKTREE_HANDOVER}"

# Configure git credentials in worktree
echo -e "${YELLOW}Configuring git credentials in worktree...${NC}"
cd "${WORKTREE_DIR}"

# Fix .git file to use relative paths (container/host compatibility)
echo -e "${YELLOW}Fixing .git file for container/host compatibility...${NC}"
if [[ -f ".git" ]]; then
    # Read current gitdir path
    CURRENT_GITDIR=$(cat .git | sed 's/gitdir: //')
    
    # Convert absolute path to relative path
    # From: /workspace/main/.git/worktrees/branch-name
    # To:   ../../main/.git/worktrees/branch-name
    if [[ "$CURRENT_GITDIR" =~ ^/workspace/main/.git/worktrees/ ]]; then
        BRANCH_PART=$(echo "$CURRENT_GITDIR" | sed 's|^/workspace/main/.git/worktrees/||')
        RELATIVE_GITDIR="../../main/.git/worktrees/${BRANCH_PART}"
        echo "gitdir: $RELATIVE_GITDIR" > .git
        echo "✅ Fixed .git file to use relative path"
    else
        echo "⚠️  .git file already uses relative path or unexpected format"
    fi
else
    echo "⚠️  No .git file found in worktree"
fi

# Check if bot token is available
if [ -n "${GITHUB_BOT_TOKEN:-}" ]; then
    git config --local user.name "Bot"
    git config --local user.email "jake.detels+bot@gmail.com"
    echo "✅ Bot git config set (using GITHUB_BOT_TOKEN)"
else
    # Fallback to personal credentials with warning
    echo -e "${RED}⚠️  WARNING: No GITHUB_BOT_TOKEN found!${NC}"
    echo -e "${YELLOW}   Commits will be attributed to your personal account${NC}"
    echo -e "${YELLOW}   For security, set up bot account: see README.md 'GitHub Bot Account Setup'${NC}"
    echo ""
    
    # Use global config values as fallback
    GLOBAL_NAME=$(git config --global user.name || echo "Your Name")
    GLOBAL_EMAIL=$(git config --global user.email || echo "your.email@example.com")
    
    git config --local user.name "$GLOBAL_NAME"
    git config --local user.email "$GLOBAL_EMAIL"
    echo "✅ Personal git config set (fallback)"
fi

cd - > /dev/null

echo
echo -e "${GREEN}✅ Handover file created successfully!${NC}"
echo
echo "The handover file is available in the worktree:"
echo "• Worktree directory: apm/agents/${AGENT_ROLE}/not-started/${HANDOVER_FILENAME}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit the handover file to add specific details"
echo "2. Open VS Code with: tsx src/tools/worktree-manager/open-worktree-vscode.ts \"${WORKTREE_DIR}\""
echo "3. The new agent will find the handover automatically"