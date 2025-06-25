# Git Worktrees for Claude Code

## Purpose & Limitation

Claude Code cannot `cd` outside the original working directory. Git worktrees enable branch management by creating separate directories that Claude can reference but not navigate to.

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
# CRITICAL: You MUST read src/prompts/git/worktrees/handover-template.md first
# to understand role selection and handover structure
echo "📖 Reading handover template for guidance..."
# Read src/prompts/git/worktrees/handover-template.md

# Generate handover file with TODAY'S date prefix at apm/worktree-handovers/YYYY_MM_DD-<branch>.md
# IMPORTANT: Use the CURRENT date when creating the file (not any date from examples)
mkdir -p apm/worktree-handovers
HANDOVER_FILE="apm/worktree-handovers/$(date +%Y_%m_%d)-feature-123-description.md"
echo "📅 Using current date: $(date +%Y_%m_%d)"

# Create the handover file based on the template you just read
# Key decisions:
# - Choose appropriate agent role for the task type
# - Include all relevant context from this session
# - Specify clear next steps for the new agent
echo "✍️  Creating handover file at $HANDOVER_FILE"
# Generate content following the template structure

# 5. Open VS Code and install dependencies
# This script works around Claude's cd limitation by using cwd option
tsx src/tools/worktree-manager/open-worktree-vscode.ts "../worktrees/feature-123-description"
```

## Section B: Feature Branch with Related Changes

When on a feature branch with changes that belong to that feature:

```bash
# 1. Commit the related changes
git add .
git commit -m "feat: work in progress"

# 2. Then follow Section A steps 2-5 (switch to main, create worktree, handover, open VS Code)
```

## Section C: Main Branch with My Changes

When on main with changes YOU (the agent) made during this session:

```bash
# 1. Create branch WITH changes (they move automatically)
git checkout -b feature-123-description

# 2. Commit them
git add .
git commit -m "feat: initial work"

# 3. Then follow Section A steps 2-5 (switch to main, create worktree, handover, open VS Code)
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
# Then follow Section A steps 3-5 (create worktree, handover, open VS Code)
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
# Follow Section A steps 3-5 (create worktree, handover, open VS Code)
```

## Post-Handoff Protocol

After creating a worktree, enforce strict boundaries:

1. **Redirect ALL code requests** to the worktree window
2. **Only create new worktree** if user explicitly mentions different work
3. **One feature = One window = One agent**

Details: See `src/prompts/git/worktrees/verify.md`

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
| Files accidentally created in wrong directory | `src/prompts/git/worktrees/troubleshoot.md#file-transfer` |
| Verifying handoff worked correctly | `src/prompts/git/worktrees/verify.md` |
| Any errors or unexpected behavior | `src/prompts/git/worktrees/troubleshoot.md` |
| Making commits after setup | `src/prompts/git/commit.md` |

## Key Rules

1. **ALWAYS assess situation before acting**
2. **NEVER move changes you didn't make**
3. **ALWAYS create handover file before opening VS Code**
4. **SEPARATE changes by authorship independently**
5. **ENFORCE boundaries after handoff**

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