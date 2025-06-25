# Handling Uncommitted Changes in Git Worktrees

## Problem: Uncommitted Changes on Wrong Branch

When you realize you're on main (or wrong branch) with uncommitted changes, you need to decide what to do with those changes before creating a worktree.

## Decision Flow for Agents

### Step 1: Assess the Changes

```bash
# Check what's uncommitted
git status --porcelain

# Review the actual changes
git diff
```

### Step 2: Categorize Changes

**Ask yourself:**
1. Are these changes related to the new feature/task? → Move to new branch
2. Are these general improvements/fixes? → Might belong on main
3. Are these experimental/temporary? → Maybe stash or discard

### Step 3: Choose Strategy

## Strategy A: Move ALL Changes to New Branch (Most Common)

When the uncommitted work is actually for the feature you're about to start:

```bash
# 1. Create feature branch WITH current changes
git checkout -b feature-123-description

# 2. Commit the changes
git add .
git commit -m "wip: initial work for feature #123"

# 3. Go back to clean main
git checkout main

# 4. Create worktree
git worktree add "../worktrees/feature-123-description" "feature-123-description"
```

## Strategy B: Selective Changes (Mixed Work)

When you have both feature work and unrelated changes:

```bash
# 1. Stash everything
git stash -u -m "Mixed changes from main"

# 2. Create feature branch from clean main
git checkout -b feature-123-description

# 3. Apply and pick specific changes
git stash pop
git add -p  # Interactive staging - choose relevant hunks

# 4. Commit feature-related changes
git commit -m "feat: start feature #123"

# 5. Stash remaining unrelated changes
git stash -u -m "Unrelated changes to handle later"

# 6. Continue with worktree setup
git checkout main
git worktree add "../worktrees/feature-123-description" "feature-123-description"
```

## Strategy C: Preserve Main Changes (Rare)

When changes actually belong on main:

```bash
# 1. Commit to main (if appropriate)
git add .
git commit -m "fix: general improvements"

# 2. Create fresh feature branch
git checkout -b feature-123-description

# 3. Continue with worktree
git checkout main
git worktree add "../worktrees/feature-123-description" "feature-123-description"
```

## Agent Decision Guidelines

**DEFAULT BEHAVIOR**: Use Strategy A (move all changes to feature branch)

**When to ask the user:**
```bash
# If changes look unrelated to any feature:
if git diff --name-only | grep -E "(README|CLAUDE\.md|\.vscode/|package\.json)"; then
    echo "⚠️  Found changes to project config/docs files"
    echo "Should these changes stay on main or move to feature branch?"
fi
```

**Red flags requiring user input:**
- Changes to configuration files
- Updates to documentation on main
- Multiple unrelated file changes
- Changes that span different features

## Example Agent Workflow

```bash
# 1. Validate current state
CURRENT_BRANCH=$(git branch --show-current)
UNCOMMITTED=$(git status --porcelain | wc -l)

if [[ "$CURRENT_BRANCH" == "main" && "$UNCOMMITTED" -gt 0 ]]; then
    echo "📋 Uncommitted changes detected on main:"
    git status --short
    
    echo "
🤔 How should I handle these changes?
1. Move all to new feature branch (default)
2. Review and split changes
3. Commit to main first
4. Stash for later

Choice (1-4, default=1): "
    
    # Usually proceed with option 1 unless user specifies otherwise
fi
```

## Clear Communication Template

When an agent encounters this situation:

```
📍 Current situation:
- On branch: main
- Uncommitted changes: [list key files]
- Intended feature: feature-123-description

🎯 Recommended action:
I'll move all uncommitted changes to the new feature branch.
This keeps main clean and preserves your work.

Alternative options:
- Split changes if some belong on main
- Stash changes to handle separately

Proceeding with recommended action unless you prefer otherwise...
```

## Integration with git-worktrees.md

Add this section to the main git-worktrees.md:

```markdown
### Handling Uncommitted Changes

If you have uncommitted changes on main:

1. **Default**: Move all changes to new feature branch
2. **Ask user if**: Changes seem unrelated to feature
3. **Never**: Leave uncommitted changes on main

See `git-worktrees-uncommitted-changes.md` for detailed strategies.
```