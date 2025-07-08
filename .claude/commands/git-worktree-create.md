# Git Worktrees for Claude Code

## Purpose & Requirements

Git worktrees enable branch management by creating separate directories for feature development with seamless handoffs between Claude agents.

**REQUIREMENT**: Worktree workflows require Claude Code to be running in Docker container mode from the start. This ensures consistent path handling and eliminates host/container path translation issues.

**ARCHITECTURE**: Container handles development (file editing, git, Claude), Host handles runtime (pnpm start, watch commands, builds). This separation avoids cross-platform binary issues.

**AUTOMATIC PATH FIX**: Our worktree creation scripts automatically convert absolute paths in `.git` files to relative paths, ensuring worktrees work seamlessly in both container and host environments.

**For users**: See `docs/workflow/worktree-handover.md` for understanding the handover system.

## Step 1: Validate Container Environment

Before creating any worktree, ensure you're running in container mode:

```bash
./src/scripts/git-worktree/validate-container.sh
```

This script will verify you're in a Docker container environment and exit with an error if not.

## Step 2: Create or Validate GitHub Issue

After validating container environment, ensure you have a GitHub issue to track the work:

```bash
ISSUE_NUMBER=$(./src/scripts/git-worktree/create-github-issue.sh)
```

This script will:
- Prompt you to create a new issue or use an existing one
- Handle GitHub CLI interaction
- Return the issue number for the next step

## Step 3: Assess Your Current Situation

Determine your current git state to choose the right workflow path:

```bash
./src/scripts/git-worktree/assess-situation.sh
```

This script analyzes:
- What branch you're currently on
- Whether you have uncommitted changes
- Provides guidance on which workflow path to follow

## Decision Tree and Workflow Paths

Based on your assessment results, follow the appropriate path:

```
Are you on main/master/develop?
├─ NO → On feature branch
│   └─ Any uncommitted changes?
│       ├─ NO → Continue with clean worktree creation (Path A)
│       └─ YES → Assess if changes belong to this feature
│           ├─ YES → Commit them first, then worktree (Path B)
│           └─ NO/UNSURE → See troubleshooting guide
└─ YES → On protected branch (main/master)
    └─ Any uncommitted changes?
        ├─ NO → Simple: Create feature branch & worktree (Path A)
        └─ YES → STOP! Separate changes by authorship
            ├─ All changes made by ME → Move all to feature (Path C)
            ├─ Mix of MY and OTHERS' changes → Selective move (Path D)
            └─ Only OTHERS' changes → Leave on main, create clean feature (Path E)
```

## Path A: Clean Worktree Creation (No Uncommitted Changes)

When starting fresh with no uncommitted changes:

```bash
./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "developer" "brief-description"
```

This script handles:
- Creating the feature branch
- Setting up the worktree
- Creating handover files
- Opening VS Code
- Completing the handoff process

## Path B: Feature Branch with Related Changes

When on a feature branch with changes that belong to that feature:

```bash
./src/scripts/git-worktree/handle-feature-branch-changes.sh "$ISSUE_NUMBER" "developer" "brief-description"
```

This script:
- Commits the related changes first
- Then follows the clean worktree creation process

## Path C: Main Branch with My Changes

When on main with changes YOU made during this session:

```bash
./src/scripts/git-worktree/handle-main-branch-changes.sh "$ISSUE_NUMBER" "developer" "brief-description"
```

This script:
- Creates feature branch (changes move automatically)
- Commits your changes
- Continues with worktree creation

## Path D: Mixed Changes (Mine + Others)

When you have both your changes and others' changes:

```bash
./src/scripts/git-worktree/handle-mixed-changes.sh "$ISSUE_NUMBER" "developer" "brief-description"
```

This script provides an interactive process to:
- Identify which files are yours vs. others'
- Separate changes using git stash
- Move only your changes to the feature branch
- Preserve others' changes on main

## Path E: Only Others' Changes

When all uncommitted changes are from others:

```bash
./src/scripts/git-worktree/handle-others-changes.sh "$ISSUE_NUMBER" "developer" "brief-description"
```

This script:
- Preserves all changes on main
- Creates a clean feature branch
- Continues with worktree creation

## Complete Workflow Example

Here's a typical complete workflow:

```bash
# Step 1: Validate environment
./src/scripts/git-worktree/validate-container.sh

# Step 2: Get issue number
ISSUE_NUMBER=$(./src/scripts/git-worktree/create-github-issue.sh)

# Step 3: Assess situation
./src/scripts/git-worktree/assess-situation.sh

# Step 4: Follow recommended path (example for clean creation)
./src/scripts/git-worktree/create-clean-worktree.sh "$ISSUE_NUMBER" "developer" "auth-system"
```

## Post-Handoff Protocol

**IMPORTANT**: This happens immediately after any worktree creation script completes.

### Agent Actions (Automatic)

After prompting the user to verify, the agent must:

1. **Read boundary rules**: Study `src/prompts/git/worktrees/complete-handoff.md#post-handoff-boundary-protocol`
2. **Start enforcing**: From this point forward, redirect all code work
3. **Stay in role**: Continue as current agent but with boundary awareness

### User Actions (Manual)

The user should:
1. Switch to the new VS Code window
2. Verify Claude is running
3. Run `pnpm start` or `pnpm watch:commands` in VS Code terminal (host handles runtime)
4. Continue feature work there

**Note**: Runtime commands (`pnpm start`, `watch:commands`, builds) run on host with correct platform binaries. Container handles development only.

### Ongoing Behavior

From this point forward:
- **Original agent**: Redirects code requests to the worktree window
- **New agent**: Handles all feature implementation
- **Clear separation**: One feature = One window = One agent

## Quick Reference Commands

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
3. **ALWAYS create handover file in worktree agent directory before opening VS Code**
4. **SEPARATE changes by authorship independently**
5. **ENFORCE boundaries after handoff**
6. **VERIFY handover exists in worktree directory**

## Script Parameters

All workflow scripts follow the same parameter pattern:

```bash
script-name.sh <issue-number> <agent-role> <brief-description>
```

Where:
- `issue-number`: GitHub issue number (e.g., "123")
- `agent-role`: Target agent role (e.g., "developer", "scrum-master")
- `brief-description`: Short kebab-case description (e.g., "user-auth-system")

## Troubleshooting

### Common Issues

**Issue**: "Script not found or not executable"
```bash
# Make scripts executable
chmod +x src/scripts/git-worktree/*.sh
```

**Issue**: "Handover file not found in worktree"
- The `create-handover.sh` script creates files in the correct location
- Check `../worktrees/<branch>/apm/agents/<role>/not-started/`

**Issue**: "Branch already exists"
- Choose a different brief description
- Or remove the existing branch if appropriate

### Determining Change Authorship

To identify YOUR changes:
- Files you created in this session = YOUR changes
- Files you modified in this session = YOUR changes
- Files that were already modified when session started = OTHERS' changes
- When reviewing git status, mentally track which files you touched

Example reasoning:
- "I created feature.ts and modified config.ts" → Move these
- "README.md was already modified when I started" → Leave on main
- "I'm unsure about utils.ts" → Err on side of caution, leave on main

## Script Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `validate-container.sh` | Environment check | Always first |
| `create-github-issue.sh` | Issue management | Always second |
| `assess-situation.sh` | State analysis | Always third |
| `create-clean-worktree.sh` | Path A workflow | No uncommitted changes |
| `handle-feature-branch-changes.sh` | Path B workflow | Feature branch + related changes |
| `handle-main-branch-changes.sh` | Path C workflow | Main + your changes only |
| `handle-mixed-changes.sh` | Path D workflow | Main + mixed authorship |
| `handle-others-changes.sh` | Path E workflow | Main + others' changes only |

## Agent Instructions

**REQUIRED**: Before beginning worktree creation, create a detailed todo list covering all workflow steps. Mark each todo as completed immediately after finishing the corresponding work.

**REQUIRED**: After completing the workflow, validate your work against the acceptance criteria checklist below.

## Acceptance Criteria Checklist

**CRITICAL**: ALL criteria must pass before considering the work complete.

- [ ] **Container Environment**: `echo $APM_CONTAINERIZED` returns "true"
- [ ] **GitHub Issue**: `gh issue view <issue-number>` returns valid issue details
- [ ] **Feature Branch**: `git branch --list feature-<issue-number>-<description>` shows new branch
- [ ] **Worktree Directory**: `ls ../worktrees/<branch-name>/` shows project files
- [ ] **Git Worktree**: `git worktree list` shows new worktree path
- [ ] **Handover File**: `ls ../worktrees/<branch-name>/apm/worktree-handovers/not-started/<branch-name>.md` exists
- [ ] **VS Code Integration**: `tsx src/integrations/docker/host-bridge/container/cli/open-vscode.ts ../worktrees/<branch-name>` opens VS Code
- [ ] **Claude Access**: From worktree, `claude --version` succeeds
- [ ] **Boundary Protocol**: Agent understands redirection rules from complete-handoff.md
- [ ] **User Validation**: User confirms "verified" after checking new VS Code window

**Fail-Fast Rule**: If any criteria fails, stop and resolve the issue before proceeding.