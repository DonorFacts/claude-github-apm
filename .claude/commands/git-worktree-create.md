# Git Worktrees for Claude Code

## Purpose & Limitation

Claude Code cannot `cd` outside the original working directory. Git worktrees enable branch management by creating separate directories that Claude can reference but not navigate to.

**For users**: See `docs/workflow/worktree-handover.md` for understanding the handover system.

## STOP: Create GitHub Issue First

Before creating any worktree, ensure you have a GitHub issue to track the work:

```bash
# Check if working on existing issue
echo "Are you working on an existing GitHub issue? (If yes, note the issue number)"
echo "If no existing issue, create one now:"

# Create GitHub issue for the work
gh issue create \
    --title "Brief description of the work" \
    --body "Detailed description of what needs to be done" \
    --label "enhancement" \
    --assignee "@me"

# Capture the issue number for branch naming
ISSUE_NUMBER=$(gh issue list --assignee "@me" --state open --limit 1 --json number --jq '.[0].number')
echo "Issue created: #$ISSUE_NUMBER"
```

## STOP: Assess Your Situation Second

After ensuring you have a GitHub issue, determine your current state:

```bash
# 1. What branch are you on?
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# 2. Do you have uncommitted changes?
UNCOMMITTED_COUNT=$(git status --porcelain | wc -l)
echo "Uncommitted changes: $UNCOMMITTED_COUNT files"

# 3. If changes exist, what are they?
if [ $UNCOMMITTED_COUNT -gt 0 ]; then
    echo "Changed files:"
    git status --short
    echo ""
    echo "CRITICAL: Identifying which changes are mine..."
    echo "- Changes I made in this session → Will move to feature branch"
    echo "- Changes from others/previous sessions → Will leave on main"
fi
```

## Decision Tree

Based on your assessment, follow the appropriate path:

```
Are you on main/master/develop?
├─ NO → On feature branch
│   └─ Any uncommitted changes?
│       ├─ NO → Continue with normal worktree creation (Section A)
│       └─ YES → Assess if changes belong to this feature
│           ├─ YES → Commit them first, then worktree (Section B)
│           └─ NO/UNSURE → See troubleshooting guide
└─ YES → On protected branch (main/master)
    └─ Any uncommitted changes?
        ├─ NO → Simple: Create feature branch & worktree (Section A)
        └─ YES → STOP! Separate changes by authorship
            ├─ All changes made by ME → Move all to feature (Section C)
            ├─ Mix of MY and OTHERS' changes → Selective move (Section D)
            └─ Only OTHERS' changes → Leave on main, create clean feature (Section E)
```

## Section A: Clean Worktree Creation (No Uncommitted Changes)

When starting fresh with no uncommitted changes:

```bash
# 1. Ensure you have the issue number from the previous step
# ISSUE_NUMBER should be set from the GitHub issue creation above
if [ -z "$ISSUE_NUMBER" ]; then
    echo "ERROR: No issue number found. Please create a GitHub issue first."
    echo "Run: gh issue create --title 'Your work description' --assignee '@me'"
    exit 1
fi

# 2. Create descriptive branch name with issue number
BRANCH_NAME="feature-$ISSUE_NUMBER-brief-description"
echo "Creating branch: $BRANCH_NAME"

# 3. Create feature branch if on main
git checkout -b "$BRANCH_NAME"

# 4. Switch back to main
git checkout main

# 5. Create worktree
git worktree add "../worktrees/$BRANCH_NAME" "$BRANCH_NAME"

# 6. Create handover file for the new Claude instance
# CRITICAL: The handover file MUST be created in BOTH locations to ensure the new agent can find it
# Option A: Use the handover creation script (RECOMMENDED)
echo "📖 Creating handover file in both locations..."
./src/scripts/git-worktree/create-handover.sh "$BRANCH_NAME" "developer" "Brief purpose description"
echo "✅ Handover created! Edit the file to add specific details."

# Option B: Manual creation (if script not available)
# Read template first: src/prompts/git/worktrees/handover-template.md
# Then create in BOTH locations:
mkdir -p apm/worktree-handovers/not-started
mkdir -p "../worktrees/$BRANCH_NAME/apm/worktree-handovers/not-started"
HANDOVER_FILE="$(date +%Y_%m_%d)-$BRANCH_NAME.md"
echo "📅 Using current date: $(date +%Y_%m_%d)"
# Create content in both:
# - apm/worktree-handovers/not-started/$HANDOVER_FILE  
# - ../worktrees/$BRANCH_NAME/apm/worktree-handovers/not-started/$HANDOVER_FILE
# IMPORTANT: Include GitHub issue #$ISSUE_NUMBER reference in the handover file

# 7. Open VS Code and install dependencies
# This script works around Claude's cd limitation by using cwd option
tsx src/tools/worktree-manager/open-worktree-vscode.ts "../worktrees/$BRANCH_NAME"

# 8. Complete the handoff
# Agent: Prompt the user to validate the setup
echo ""
echo "✅ Worktree created and VS Code opened!"
echo "✅ GitHub issue #$ISSUE_NUMBER is being tracked"
echo ""
echo "Please switch to the new VS Code window and verify:"
echo ""
echo "1. Run 'pwd' - you should be in the worktree directory"
echo "   (e.g., /path/to/worktrees/$BRANCH_NAME)"
echo ""
echo "2. Run 'git branch --show-current' - you should see your feature branch"
echo "   (should be: $BRANCH_NAME)"
echo ""
echo "3. Check that Claude is running in the terminal"
echo ""
echo "4. If everything looks correct, continue your work there."
echo "   If something seems wrong, let me know what you're seeing."
echo ""
echo "🎯 HANDOFF COMPLETE"
echo ""
echo "This conversation is now closed for feature work."
echo "All development should continue in the new worktree window."
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  🚫 THIS WINDOW: Framework & project work   │"
echo "│  ✅ WORKTREE WINDOW: Feature development    │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "Only return here if you encounter issues with the worktree setup itself."

# Agent: Also study src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol
# to understand how to enforce boundaries going forward
```

## Section B: Feature Branch with Related Changes

When on a feature branch with changes that belong to that feature:

```bash
# 1. Commit the related changes
git add .
git commit -m "feat: work in progress"

# 2. Then follow Section A steps 4-8 (switch to main, create worktree, handover, open VS Code, complete handoff)
```

## Section C: Main Branch with My Changes

When on main with changes YOU (the agent) made during this session:

```bash
# 1. Ensure you have issue number (from GitHub issue creation step)
BRANCH_NAME="feature-$ISSUE_NUMBER-brief-description"

# 2. Create branch WITH changes (they move automatically)
git checkout -b "$BRANCH_NAME"

# 3. Commit them
git add .
git commit -m "feat: initial work"

# 4. Then follow Section A steps 4-8 (switch to main, create worktree, handover, open VS Code, complete handoff)
```

## Section D: Mixed Changes (Mine + Others)

When you have both your changes and others' changes:

```bash
# 1. Ensure you have issue number (from GitHub issue creation step)
BRANCH_NAME="feature-$ISSUE_NUMBER-brief-description"

# 2. Stash everything
git stash -u -m "Mixed changes on main"

# 3. Create feature branch
git checkout -b "$BRANCH_NAME"

# 4. Apply stash and selectively add YOUR changes only
git stash pop
git add file1.ts file2.ts  # Only files YOU modified
git reset file3.ts file4.ts # Files modified by others

# 5. Commit your changes
git commit -m "feat: initial work"

# 6. Re-stash others' changes
git stash -u -m "Others' changes - left on main"

# 7. Continue with worktree creation
git checkout main
git stash pop  # Restore others' changes to main
# Then follow Section A steps 5-8 (create worktree, handover, open VS Code, complete handoff)
```

## Section E: Only Others' Changes

When all uncommitted changes are from others:

```bash
# 1. Ensure you have issue number (from GitHub issue creation step)
BRANCH_NAME="feature-$ISSUE_NUMBER-brief-description"

# 2. Leave changes untouched on main
# Create clean feature branch
git stash -u -m "Others' changes - preserving"
git checkout -b "$BRANCH_NAME"
git checkout main
git stash pop  # Restore others' changes

# 3. Continue with worktree creation
# Follow Section A steps 5-8 (create worktree, handover, open VS Code, complete handoff)
```

## Post-Handoff Protocol

**IMPORTANT**: This happens immediately after Step 8 above.

### Agent Actions (Automatic)

After prompting the user to verify, the agent must:

1. **Read boundary rules**: Study `src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol`
2. **Start enforcing**: From this point forward, redirect all code work
3. **Stay in role**: Continue as current agent but with boundary awareness

### User Actions (Manual)

The user should:
1. Switch to the new VS Code window
2. Verify Claude is running
3. Continue feature work there

### Ongoing Behavior

From this point forward:
- **Original agent**: Redirects code requests to the worktree window
- **New agent**: Handles all feature implementation
- **Clear separation**: One feature = One window = One agent

## Quick Reference

```bash
git worktree list                                    # List all worktrees
git worktree remove ../worktrees/feature-123-desc   # Remove after merge
git worktree prune                                   # Clean stale info
```

## Navigation Guide

| Your Situation | Required Guide |
|----------------|----------------|
| Creating effective handover files | `src/prompts/git/worktrees/handover-template.md` |
| Understanding handover initialization | `src/prompts/git/worktrees/init-handover.md` |
| Files accidentally created in wrong directory | `src/prompts/git/worktrees/troubleshoot.md#file-transfer` |
| Agent: Learn validation prompts & boundary rules | `src/prompts/git/worktrees/complete-handoff.md` |
| Any errors or unexpected behavior | `src/prompts/git/worktrees/troubleshoot.md` |
| Making commits after setup | `src/prompts/git/commit.md` |

## Key Rules

1. **ALWAYS assess situation before acting**
2. **NEVER move changes you didn't make**
3. **ALWAYS create handover file IN BOTH LOCATIONS before opening VS Code**
4. **SEPARATE changes by authorship independently**
5. **ENFORCE boundaries after handoff**
6. **VERIFY handover exists in worktree directory**

## Common Handover Issues & Solutions

### Issue: "Handover file not found in worktree"
**Cause**: File only created in main directory, not in worktree
**Solution**: 
```bash
# Use the script that creates in both locations:
./src/scripts/git-worktree/create-handover.sh "<branch>" "<role>" "<purpose>"

# Or manually copy to worktree:
cp apm/worktree-handovers/not-started/*.md ../worktrees/<branch>/apm/worktree-handovers/not-started/
```

## Determining Change Authorship

To identify YOUR changes:
- Files you created in this session = YOUR changes
- Files you modified in this session = YOUR changes
- Files that were already modified when session started = OTHERS' changes
- When reviewing git status, mentally track which files you touched

Example reasoning:
- "I created feature.ts and modified config.ts" → Move these
- "README.md was already modified when I started" → Leave on main
- "I'm unsure about utils.ts" → Err on side of caution, leave on main