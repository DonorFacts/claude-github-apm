# Git Worktrees for Claude Code

## Purpose & Limitation

Claude Code cannot `cd` outside the original working directory. Git worktrees enable branch management by creating separate directories that Claude can reference but not navigate to.

**For users**: See `docs/workflow/worktree-handover.md` for understanding the handover system.

## STOP: Assess Your Situation First

Before taking ANY action, determine your current state:

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
# 1. Create feature branch if on main
git checkout -b feature-123-description

# 2. Switch back to main
git checkout main

# 3. Create worktree
git worktree add "../worktrees/feature-123-description" "feature-123-description"

# 4. Create handover file for the new Claude instance
# CRITICAL: The handover file MUST be created in BOTH locations:
# - Main directory: apm/worktree-handovers/not-started/
# - Worktree directory: ../worktrees/<branch>/apm/worktree-handovers/not-started/
# This ensures the new agent can find it regardless of directory issues

# Option A: Use the handover creation script (RECOMMENDED)
echo "📖 Creating handover file in both locations..."
./src/scripts/git-worktree/create-handover.sh "feature-123-description" "developer" "Brief purpose description"
echo "✅ Handover created! Edit the file to add specific details."

# Option B: Manual creation (if script not available)
# Read template first: src/prompts/git/worktrees/handover-template.md
# Then create in BOTH locations:
# mkdir -p apm/worktree-handovers/not-started
# mkdir -p ../worktrees/feature-123-description/apm/worktree-handovers/not-started
# HANDOVER_FILE="$(date +%Y_%m_%d)-feature-123-description.md"
# Create content in both:
# - apm/worktree-handovers/not-started/$HANDOVER_FILE
# - ../worktrees/feature-123-description/apm/worktree-handovers/not-started/$HANDOVER_FILE

# 5. Open VS Code and install dependencies
# This script works around Claude's cd limitation by using cwd option
tsx src/tools/worktree-manager/open-worktree-vscode.ts "../worktrees/feature-123-description"

# 6. Complete the handoff
# Agent: Prompt the user to validate the setup
echo ""
echo "✅ Worktree created and VS Code opened!"
echo ""
echo "Please switch to the new VS Code window and verify:"
echo ""
echo "1. Run 'pwd' - you should be in the worktree directory"
echo "   (e.g., /path/to/worktrees/feature-123-description)"
echo ""
echo "2. Run 'git branch --show-current' - you should see your feature branch"
echo "   (not main/master)"
echo ""
echo "3. Check that Claude is running in the terminal"
echo ""
echo "4. If everything looks correct, tell me 'verified' and continue there."
echo "   If something seems wrong, let me know what you're seeing."
echo ""
echo "From now on, I'll redirect all code work to that window."

# Agent: Also study src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol
# to understand how to enforce boundaries going forward
```

## Section B: Feature Branch with Related Changes

When on a feature branch with changes that belong to that feature:

```bash
# 1. Commit the related changes
git add .
git commit -m "feat: work in progress"

# 2. Then follow Section A steps 2-6 (switch to main, create worktree, create handover IN BOTH LOCATIONS, open VS Code, complete handoff)
```

## Section C: Main Branch with My Changes

When on main with changes YOU (the agent) made during this session:

```bash
# 1. Create branch WITH changes (they move automatically)
git checkout -b feature-123-description

# 2. Commit them
git add .
git commit -m "feat: initial work"

# 3. Then follow Section A steps 2-6 (switch to main, create worktree, create handover IN BOTH LOCATIONS, open VS Code, complete handoff)
```

## Section D: Mixed Changes (Mine + Others)

When you have both your changes and others' changes:

```bash
# 1. Stash everything
git stash -u -m "Mixed changes on main"

# 2. Create feature branch
git checkout -b feature-123-description

# 3. Apply stash and selectively add YOUR changes only
git stash pop
git add file1.ts file2.ts  # Only files YOU modified
git reset file3.ts file4.ts # Files modified by others

# 4. Commit your changes
git commit -m "feat: initial work"

# 5. Re-stash others' changes
git stash -u -m "Others' changes - left on main"

# 6. Continue with worktree creation
git checkout main
git stash pop  # Restore others' changes to main
# Then follow Section A steps 3-6 (create worktree, create handover IN BOTH LOCATIONS, open VS Code, complete handoff)
```

## Section E: Only Others' Changes

When all uncommitted changes are from others:

```bash
# Leave changes untouched on main
# Create clean feature branch
git stash -u -m "Others' changes - preserving"
git checkout -b feature-123-description
git checkout main
git stash pop  # Restore others' changes

# Continue with worktree creation
# Follow Section A steps 3-6 (create worktree, create handover IN BOTH LOCATIONS, open VS Code, complete handoff)
```

## Post-Handoff Protocol

**IMPORTANT**: This happens immediately after Step 6 above.

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
git worktree list                             # List all worktrees
git worktree remove ../worktrees/branch-name  # Remove after merge
git worktree prune                            # Clean stale info
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