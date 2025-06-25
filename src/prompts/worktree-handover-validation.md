# Worktree Handover Validation

## What Just Happened

When you create a new worktree and open VS Code:

1. **Branch & Worktree Created**: Your work is now in `../worktrees/<branch-name>`
2. **VS Code Opened**: Should be visible with the worktree folder
3. **Claude Auto-Started**: Check for terminal panel at bottom of VS Code

## User Validation Steps

After the handover, verify everything worked:

```bash
# In the VS Code terminal that opened:

# 1. Confirm you're in the worktree (not main repo)
pwd
# Expected: /path/to/worktrees/your-branch-name

# 2. Confirm correct branch
git branch --show-current
# Expected: your-branch-name (NOT main)

# 3. Confirm Claude is running
# You should see Claude's prompt in the terminal
```

## If Something Didn't Work

**VS Code didn't open?**
- Manually open VS Code
- File → Open Folder → Navigate to `../worktrees/your-branch-name`

**Claude didn't start?**
- Open terminal in VS Code: Cmd+` (Mac) or Ctrl+` (Windows/Linux)
- Type `claude` and press Enter

**Wrong directory or branch?**
- Close VS Code
- In main directory, run: `git worktree list`
- Find your worktree path and open VS Code there

## Why This Approach

Instead of automated tests that can't truly verify UI behavior, we:
- Set clear expectations for what you'll see
- Provide simple commands to verify state
- Give recovery steps if something goes wrong

The user is the best validator because only they can see:
- Did VS Code actually open?
- Is Claude running in the terminal?
- Am I in the right directory?

## Complete Worktree Workflow

```bash
# 1. From main directory, create branch and worktree
git checkout -b feature-123-description
git add . && git commit -m "wip: starting feature"
git checkout main
git worktree add "../worktrees/feature-123-description" "feature-123-description"

# 2. Open VS Code with Claude
tsx open-worktree-vscode.ts "../worktrees/feature-123-description"

# 3. Validate (in VS Code terminal)
pwd  # Confirm worktree path
git branch --show-current  # Confirm feature branch
# Claude should already be running
```