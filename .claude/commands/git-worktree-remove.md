# Git Worktrees - Remove and Cleanup

## Purpose

Safely remove completed worktrees with comprehensive cleanup and learning capture. This command ensures no work is lost while cleaning up all related files, GitHub issues, and agent state.

## When to Use

- After feature work is complete and PR is merged
- During project maintenance to clean up old worktrees
- When worktree is no longer needed

**IMPORTANT**: Run this from the main directory, not from within the worktree being removed.

## Environment Check

Before proceeding, verify you're in the correct environment:

```bash
# Check if currently in a worktree (not main directory)
if git rev-parse --git-dir 2>/dev/null | grep -q ".git/worktrees"; then
    # We're in a worktree - redirect needed
    echo "🚫 WORKTREE MANAGEMENT REDIRECT"
    echo ""
    echo "You're currently in a worktree window, but worktree management commands"
    echo "should be run from the main project window."
    echo ""
    echo "┌─────────────────────────────────────────────┐"
    echo "│  ❌ THIS WINDOW: Feature development only    │"
    echo "│  ✅ MAIN WINDOW: Worktree management        │"
    echo "└─────────────────────────────────────────────┘"
    echo ""
    echo "To use /git-worktrees-remove:"
    echo "1. Switch to your main project VS Code window"
    echo "2. Run the command there with Agent 1"
    echo "3. Agent 1 will safely clean up this worktree"
    echo ""
    echo "Agent 1 has visibility into the full project state and can ensure"
    echo "safe cleanup of all worktree-related files and references."
    echo ""
    echo "Continue your feature development here, and use the main window"
    echo "for worktree lifecycle management."
    exit 0
fi
```

## Usage

Execute the comprehensive removal script:

```bash
# For single worktree (auto-detected)
./src/scripts/git/worktree-remove.sh

# For specific worktree when multiple exist
./src/scripts/git/worktree-remove.sh feature-123-description
```

## What the Script Does

The script performs these steps automatically:

### 1. Target Identification
- Auto-detects single worktrees
- Prompts for selection when multiple exist
- Extracts GitHub issue number from branch name

### 2. Safety Verification  
- Checks for uncommitted changes in worktree
- Verifies all commits are merged to main
- Validates GitHub PR status (merged/closed)

### 3. Cleanup Actions
- Removes git worktree and references
- Cleans up handover files  
- Automatically closes associated GitHub issue
- Optionally deletes the feature branch

### 4. User Guidance
- Confirms cleanup completion
- Advises on VS Code window management
- Shows remaining worktrees or readiness for new work

## Agent Instructions

After running the script:

**Provide Summary**: Confirm to user what was accomplished and next steps

## Safety Features

- **Multiple verification layers** prevent accidental data loss
- **Interactive confirmations** for destructive actions
- **Graceful error handling** for edge cases
- **Clear status reporting** throughout process

## Troubleshooting

### Script Issues
- Ensure you're in the main project directory (has .git)
- Check script permissions: `chmod +x src/scripts/git/worktree-remove.sh`
- Verify GitHub CLI is installed if using issue management

### Common Problems
- **Uncommitted changes**: Commit or stash before removal
- **Unmerged commits**: Ensure PR is merged first
- **Missing directories**: Script handles gracefully

## Design Philosophy

This command focuses on clean, automatic cleanup without requiring user decisions for routine actions:
- **Automatic issue closure** - removing worktree implies work completion
- **Interactive branch deletion** - user may want to keep branches for reference
- **No memory updates** - cleanup is housekeeping, not learning opportunity
- **Safety first** - multiple verification layers prevent data loss