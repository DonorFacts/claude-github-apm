# Git Worktrees - Claude Code Integration

## Purpose

This guide provides git worktree instructions for Claude Code agents, addressing the platform's limitation of not being able to change directories outside the original working directory. Git worktrees allow agents to work with multiple branches while remaining in the current directory.

## Pre-Work Validation

**CRITICAL**: Before making any code changes, validate your workspace context:

```bash
# Workspace validation function
validate_workspace() {
    local current_branch=$(git branch --show-current)
    local current_dir=$(basename "$(pwd)")
    
    # Check if on main branch
    if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
        echo "❌ ERROR: Currently on main branch"
        echo "Action required: Create a feature branch before making changes"
        echo "Example: git checkout -b feature-<issue>-<description>"
        return 1
    fi
    
    # Extract branch components (type-issue-description pattern)
    if [[ "$current_branch" =~ ^([a-z]+)-([0-9]+|draft)-(.+)$ ]]; then
        local branch_type="${BASH_REMATCH[1]}"
        local issue_num="${BASH_REMATCH[2]}"
        local description="${BASH_REMATCH[3]}"
        
        echo "📍 Current branch: $current_branch"
        echo "   Type: $branch_type"
        echo "   Issue: $issue_num"
        echo "   Scope: $description"
        
        # Check if in a worktree directory
        if [[ "$(git rev-parse --show-toplevel)" != "$(pwd)" ]]; then
            echo "📂 In worktree: $(pwd)"
        fi
        
        return 0
    else
        echo "⚠️  WARNING: Branch name doesn't follow convention"
        echo "Expected: <type>-<issue>-<description>"
        echo "Current: $current_branch"
        return 2
    fi
}

# Run validation before any work
validate_workspace || exit 1
```

### Branch Naming Convention

**Required Format**: `<type>-<issue>-<keywords>`

Examples:
- `feature-234-oauth-integration`
- `fix-567-context-overflow`
- `refactor-890-prompt-consolidation`
- `docs-draft-api-guidelines` (for work without issue yet)

Types: `feature`, `fix`, `refactor`, `docs`, `chore`, `test`

### Context Alignment Check

Before starting work, verify branch aligns with current task:

```bash
# Check if current task matches branch context
check_context_alignment() {
    local current_branch=$(git branch --show-current)
    
    # Extract issue number from branch
    local branch_issue=$(echo "$current_branch" | grep -oE '[0-9]+' | head -1)
    
    # Check if user mentioned an issue number
    echo "🔍 Checking context alignment..."
    echo "Branch issue: #$branch_issue"
    echo "Verify this matches your current task"
    
    # Prompt for confirmation if ambiguous
    echo "❓ Does this branch align with your current work? (y/n)"
}
```

### Decision Flow

| Validation Result | Action Required |
|------------------|-----------------|
| ❌ On main branch | Create feature branch immediately |
| ⚠️  Wrong branch pattern | Fix branch name or create new branch |
| ❓ Context mismatch | Confirm with user or switch branches |
| ✅ Validated | Proceed with work |

## Claude Code Directory Limitation

**IMPORTANT**: Claude Code cannot use `cd` to navigate to directories outside the original working directory. This means:
- You cannot `cd` into cloned repositories
- You cannot `cd` into parent directories
- You cannot `cd` into worktree directories created outside the current path

This limitation makes git worktrees an essential tool for branch management.

## Git Worktree Setup with VS Code Integration

When you need to work with multiple branches or avoid disrupting the main branch, use git worktrees:

```bash
# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
CREATED_NEW_BRANCH=false

# If on main/master, create a new feature branch
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "⚠️ On main branch - creating feature branch"
    
    # Determine branch name from context
    # If you have an assigned issue number: feature-123-description
    # If no issue yet: feature-draft-description
    # Development branch types: feature|fix|docs|chore|refactor
    BRANCH_NAME="feature-123-your-task"  # Update based on your assignment
    
    # Create and checkout new branch
    git checkout -b "$BRANCH_NAME"
    CREATED_NEW_BRANCH=true
    CURRENT_BRANCH="$BRANCH_NAME"
else
    echo "✅ Already on development branch: $CURRENT_BRANCH"
fi

# Commit changes to the current development branch
if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "Your commit message"
fi

# If we created a new branch, switch back to main and create worktree
if [[ "$CREATED_NEW_BRANCH" == "true" ]]; then
    git checkout main
    git worktree add "../worktrees/$CURRENT_BRANCH" "$CURRENT_BRANCH"
    echo "✅ Created worktree at ../worktrees/$CURRENT_BRANCH"
    echo "📍 Back in main branch in current directory"
    
    # Open VS Code in the new worktree with Claude Code running
    echo "🚀 Opening VS Code in new worktree..."
    code "../worktrees/$CURRENT_BRANCH"
    
    # Wait for VS Code to open, then launch terminal with Claude
    sleep 2
    osascript -e 'tell application "Visual Studio Code" to activate'
    osascript -e 'tell application "System Events" to keystroke "`" using control down'
    sleep 1
    osascript -e 'tell application "System Events" to keystroke "claude"'
    osascript -e 'tell application "System Events" to key code 36'  # Enter key
    
    echo "✅ VS Code opened with Claude Code ready in terminal"
fi
```

## VS Code Integration Details

The automated VS Code setup performs these steps:
1. Opens VS Code at the worktree directory
2. Activates the VS Code window
3. Opens the integrated terminal (Ctrl+`)
4. Types "claude" command
5. Presses Enter to start Claude Code

**Note**: This automation uses macOS AppleScript. For other platforms:
- **Linux**: Use `xdotool` or similar automation tools
- **Windows**: Use PowerShell or AutoHotkey scripts

## Key Workflow Points

1. **Always work in development branches**, never on main
2. **Update branch name** based on your assigned GitHub issue
3. **Use `draft` prefix** for exploratory work until issue is created
4. **The workflow creates a branch**, commits changes, then sets up a worktree
5. **You remain in the current directory** after setup
6. **VS Code opens automatically** in the new worktree with Claude ready

## Worktree Management Commands

```bash
# List all worktrees
git worktree list

# Remove a worktree (after merging/deleting branch)
git worktree remove ../worktrees/branch-name

# Prune stale worktree information
git worktree prune
```

## Alternative Workflow: Cherry-Pick

When a worktree blocks your branch due to Claude Code limitations:

```bash
# 1. Create commits on a temporary branch
git checkout -b temp-changes
git add .
git commit -m "Changes to cherry-pick"

# 2. Switch to your feature branch
git checkout feature-branch

# 3. Cherry-pick the commits
git cherry-pick temp-changes

# 4. Clean up temporary branch
git branch -d temp-changes
```

## Handling Uncommitted Changes

**IMPORTANT**: If you have uncommitted changes when trying to create a worktree:

### Default Agent Behavior
1. Move ALL uncommitted changes to the new feature branch
2. This keeps main clean and preserves work in progress
3. Agent assumes changes are related to the upcoming feature

### When Agent Should Ask User
- Changes to config files (package.json, tsconfig.json, etc.)
- Updates to documentation (README.md, CLAUDE.md)
- Changes spanning multiple unrelated features
- Modifications that look like general fixes

### Quick Decision Flow
```bash
# Check uncommitted changes
git status --porcelain

# If on main with changes, default action:
git checkout -b feature-123-description  # Takes changes with you
git add . && git commit -m "wip: starting feature"
git checkout main  # Now clean
git worktree add "../worktrees/feature-123-description" "feature-123-description"
```

### Alternative: Selective Handling
```bash
# Stash everything first
git stash -u -m "Mixed changes"

# Create clean feature branch
git checkout -b feature-123-description

# Cherry-pick relevant changes
git stash pop
git add -p  # Interactive: choose what belongs

# Commit feature work, re-stash the rest
git commit -m "feat: start implementation"
git stash -u -m "Unrelated changes"
```

**Agent Rule**: Never leave uncommitted changes on main. Either move them to the feature branch or get explicit user direction.

## Post-Handoff Protocol

**CRITICAL**: After creating a worktree and opening it in a new VS Code window, the original agent must treat that feature as "handed off":

### Original Agent Behavior After Handoff

1. **Assume ALL work requests relate to the handed-off feature**
   - Users rarely switch contexts immediately after starting a feature
   - Default action: redirect to the worktree window for ANY code changes

2. **For ANY request that involves code changes**
   ```bash
   # Find the most recent worktree
   ls -t ../worktrees/ | head -1 | xargs -I {} code ../worktrees/{}
   ```
   Response: "I've refocused the VS Code window for your feature work. Please continue there where you have the proper context."

3. **Only exception: Different scope detection**
   - If user explicitly mentions unrelated work, ask:
   "This seems like a different scope of work. Would you like me to:
   1. Continue in the existing feature window (default)
   2. Create a new worktree for this separate work?"

### Example Real-World Flow

```bash
# User: "I need to add user authentication"
# Agent creates worktree and opens new window
tsx open-worktree-vscode.ts feature-auth-system

# Later in original window...
# User: "Add password validation"
# Agent: ls -t ../worktrees/ | head -1 | xargs -I {} code ../worktrees/{}
# Agent: "I've refocused your feature window. Please continue there."

# User: "Can you also update the README?"
# Agent: ls -t ../worktrees/ | head -1 | xargs -I {} code ../worktrees/{}
# Agent: "I've refocused your feature window. Documentation updates 
#         should happen alongside your feature work."

# User: "Actually, I need to fix a critical bug in production"
# Agent: "This seems like a different scope of work. Would you like me to:
#         1. Continue in the auth feature window (default)
#         2. Create a new worktree for this bug fix?"
```

### Handoff State Check

Before making ANY code changes:
```bash
# Check if ANY worktree exists (indicates active feature work)
if [ -d "../worktrees" ] && [ "$(ls -A ../worktrees)" ]; then
    # Redirect to most recent worktree
    latest_worktree=$(ls -t ../worktrees/ | head -1)
    code "../worktrees/$latest_worktree"
    echo "Redirecting to active feature window"
    exit 1
fi
```

**Key Principles**: 
- **Default to redirect**: Assume user wants to continue feature work
- **One feature, one window, one agent**: Prevents conflicts
- **Explicit branching only**: Only create new worktrees when user confirms different scope

## Best Practices

1. **Create worktrees outside current directory**: Use `../worktrees/` to avoid cluttering project
2. **Clean up after merging**: Remove worktrees for merged branches
3. **Use descriptive branch names**: Include issue numbers and brief descriptions
4. **Document worktree usage**: Note in commits when worktree workflow was used
5. **Prefer staying in main directory**: Only reference worktrees, don't try to cd into them
6. **Let VS Code handle navigation**: The automated setup opens the correct directory
7. **Handle uncommitted changes explicitly**: Never leave work uncommitted on main

## Common Issues and Solutions

### Cannot cd into worktree
**Problem**: `cd: ../worktrees/feature-branch: No such file or directory`
**Solution**: Remember you cannot cd outside the original directory. Reference files using relative paths instead.

### Worktree already exists
**Problem**: `fatal: '../worktrees/feature-branch' already exists`
**Solution**: Remove the existing worktree first: `git worktree remove ../worktrees/feature-branch`

### Branch is already checked out
**Problem**: `fatal: 'feature-branch' is already checked out`
**Solution**: The branch is active in another worktree. Use `git worktree list` to find it.

### VS Code automation fails
**Problem**: AppleScript errors or VS Code doesn't open properly
**Solution**: Open VS Code manually and run `claude` in the terminal: `code ../worktrees/branch-name`

## Integration with Development Workflow

Include this guide in your agent prompts when:
- Working with feature branches
- Needing to switch between branches frequently
- Implementing changes that shouldn't affect main
- Testing changes in isolation

Remember: The worktree strategy is specifically designed to work within Claude Code's constraints while maintaining effective git workflows.