# Git Worktrees for Claude Code

## Purpose & Limitation

Claude Code cannot `cd` outside the original working directory. Git worktrees enable branch management by creating separate directories that Claude can reference but not navigate to. This guide ensures proper workflow within these constraints.

## Pre-Work Validation

**NEVER work directly on main/master branches**. Before any code changes:

1. Check current branch: `git branch --show-current`
2. If on main/master: Create feature branch first
3. Verify branch follows naming convention: `<type>-<issue>-<description>`
   - Types: `feature`, `fix`, `refactor`, `docs`, `chore`, `test`
   - Examples: `feature-234-oauth`, `fix-567-overflow`, `docs-draft-api-guide`

## Worktree Setup Process

When creating a new feature worktree:

```bash
# 1. Create feature branch if on main
git checkout -b feature-123-description  # Update based on issue

# 2. Commit any changes
git add . && git commit -m "feat: initial work"

# 3. Return to main and create worktree
git checkout main
git worktree add "../worktrees/feature-123-description" "feature-123-description"

# 4. Install dependencies
cd "../worktrees/feature-123-description" && pnpm install && cd -

# 5. Open VS Code with Claude
tsx src/tools/worktree-manager/open-worktree-vscode.ts feature-123-description
```

The VS Code automation will:
- Open VS Code at the worktree
- Launch terminal (Ctrl+`)
- Start Claude Code automatically

## Handling Uncommitted Changes

**Rule**: Never leave uncommitted changes on main/master/develop.

**Decision Logic**:
- From main → Always move to feature branch
- From feature branches → Analyze if changes belong:
  - Move if: Clearly unrelated/accidental
  - Keep if: Part of that feature
  - Ask if: Uncertain or >50% config/docs files

**Quick action for main branch**:
```bash
git checkout -b feature-123-description  # Takes changes with you
git add . && git commit -m "wip: starting feature"
```

## Post-Handoff Protocol

**CRITICAL**: After creating a worktree, the original agent treats that feature as "handed off".

### Original Agent Rules

1. **Default behavior**: Redirect ALL code requests to the worktree window
   ```bash
   code "../worktrees/$(ls -t ../worktrees/ | head -1)"
   ```
   Response: "I've refocused your feature window. Please continue there."

2. **Analyze requests using language understanding**:
   - **Continue existing work** (redirect without asking):
     - Code modifications, tests, documentation
     - Bug fixes or improvements
     - No explicit context switch mentioned
   
   - **Start new work** (ask before creating worktree):
     - Phrases: "different bug", "unrelated issue", "separate feature"
     - "actually, I need to...", "let's switch to...", "new feature"
     - Completely different component than worktree

3. **When uncertain**: Ask briefly
   "Is this related to your work in feature-X, or should I create a new worktree?"

**Key Principle**: One feature, one window, one agent. Prevents conflicts.

## Worktree Management

```bash
git worktree list                              # List all worktrees
git worktree remove ../worktrees/branch-name   # Remove after merge
git worktree prune                             # Clean stale info
```

## Best Practices & Common Issues

**Best Practices**:
- Create worktrees in `../worktrees/` to avoid clutter
- Clean up worktrees after merging branches
- Use descriptive branch names with issue numbers
- Stay in main directory, reference files with relative paths

**Common Issues**:
- **"Branch already checked out"**: Use `git worktree list` to find it
- **"Worktree already exists"**: Remove first with `git worktree remove`
- **Cannot cd into worktree**: Use relative paths instead
- **VS Code automation fails**: Open manually and run `claude` in terminal

## Summary

1. Never work on main - always create feature branches
2. Use worktrees to isolate feature work
3. Original agent redirects to worktree after handoff
4. One feature = one window = one agent
5. Clean up worktrees after merging

Remember: This workflow is specifically designed for Claude Code's directory constraints while maintaining effective git practices.