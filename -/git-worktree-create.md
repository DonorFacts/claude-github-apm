# Git Worktrees for Claude Code

## Purpose & Limitation

Claude Code cannot `cd` outside the original working directory. Git worktrees enable branch management by creating separate directories that Claude can reference but not navigate to.

**For users**: See `docs/workflow/worktree-handover.md` for understanding the handover system.

## STOP: Create GitHub Issue First

Before creating any worktree, ensure you have a GitHub issue to track the work:

**Note**: If your branch name already contains an issue number (e.g., `feature/8-description`), you can skip this step.

For new issues:
```bash
gh issue create \
    --title "Brief description of the work" \
    --body "Detailed description of what needs to be done" \
    --label "enhancement" \
    --assignee "@me"
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
# Use the comprehensive worktree creation script
./src/scripts/git/worktree-create.sh "feature-ISSUE_NUMBER-brief-description" "developer" "Brief purpose description"

# Examples:
# ./src/scripts/git/worktree-create.sh "feature-123-auth" "developer" "Implement user authentication"
# ./src/scripts/git/worktree-create.sh "feature/8-test-bulk-issue-creation" "developer" "Fix TypeScript errors"

# The script will:
# 1. Auto-detect issue number from branch name
# 2. Create branch and worktree
# 3. Generate handover file with proper agent role
# 4. Open VS Code in the worktree
# 5. Display completion instructions
```

**Agent: After running the script, study `src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol` to understand how to enforce boundaries going forward.**

## Section B: Feature Branch with Related Changes

When on a feature branch with changes that belong to that feature:

```bash
# 1. Commit the related changes
git add .
git commit -m "feat: work in progress"

# 2. Then use the worktree creation script
./src/scripts/git/worktree-create.sh "feature-ISSUE_NUMBER-brief-description" "developer" "Brief purpose description"
```

## Section C: Main Branch with My Changes

When on main with changes YOU (the agent) made during this session:

```bash
# 1. Create branch WITH changes (they move automatically)
git checkout -b "feature-ISSUE_NUMBER-brief-description"

# 2. Commit them
git add .
git commit -m "feat: initial work"

# 3. Then use the worktree creation script
./src/scripts/git/worktree-create.sh "feature-ISSUE_NUMBER-brief-description" "developer" "Brief purpose description"
```

## Section D: Mixed Changes (Mine + Others)

When you have both your changes and others' changes:

```bash
# 1. Stash everything
git stash -u -m "Mixed changes on main"

# 2. Create feature branch
git checkout -b "feature-ISSUE_NUMBER-brief-description"

# 3. Apply stash and selectively add YOUR changes only
git stash pop
git add file1.ts file2.ts  # Only files YOU modified
git reset file3.ts file4.ts # Files modified by others

# 4. Commit your changes
git commit -m "feat: initial work"

# 5. Re-stash others' changes and restore to main
git stash -u -m "Others' changes - left on main"
git checkout main
git stash pop  # Restore others' changes to main

# 6. Then use the worktree creation script
./src/scripts/git/worktree-create.sh "feature-ISSUE_NUMBER-brief-description" "developer" "Brief purpose description"
```

## Section E: Only Others' Changes

When all uncommitted changes are from others:

```bash
# 1. Preserve others' changes and create clean feature branch
git stash -u -m "Others' changes - preserving"
git checkout -b "feature-ISSUE_NUMBER-brief-description"
git checkout main
git stash pop  # Restore others' changes

# 2. Then use the worktree creation script
./src/scripts/git/worktree-create.sh "feature-ISSUE_NUMBER-brief-description" "developer" "Brief purpose description"
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