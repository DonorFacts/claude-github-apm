# Git Worktrees - Troubleshooting Guide

## When to Use This Guide

- Files were created in the wrong directory
- Worktree creation failed with errors
- VS Code integration isn't working
- Recovery from mistakes or system issues

## File Transfer {#file-transfer}

### Problem: Accidentally Created Files in Wrong Directory

You've been working in the main directory but files should be in the worktree:

#### Simple Transfer
```bash
# For new files - just copy them
cp new-file.ts ../worktrees/feature-branch/
cp -r new-directory/ ../worktrees/feature-branch/

# For modified existing files - be careful!
# First check if file exists in worktree
ls ../worktrees/feature-branch/existing-file.ts

# If yes, create a patch instead:
git diff existing-file.ts > /tmp/changes.patch
# Apply in worktree manually
```

#### Complete Handover Process
```bash
# 1. List files to transfer
git status --porcelain

# 2. Copy files
cp my-files.ts ../worktrees/feature-branch/

# 3. Create handover note
BRANCH_NAME="feature-branch"
cat > "apm/worktree-handovers/${BRANCH_NAME}.md" << EOF
# Handover: ${BRANCH_NAME}

## Files Transferred
$(git status --porcelain | grep '^??' | cut -d' ' -f2)

## Context
[Describe what you were working on]

## Next Steps
1. Review transferred files with git status
2. Commit the changes
3. Continue development
EOF

# 4. Reset main directory (if needed)
git checkout -- .
git clean -fd

# 5. Open worktree
code "../worktrees/${BRANCH_NAME}"
```

## Worktree Creation Failures

### Problem: Worktree Already Exists
```bash
# Error: fatal: '../worktrees/feature-branch' already exists

# Solution 1: Remove and recreate
git worktree remove ../worktrees/feature-branch
git worktree add "../worktrees/feature-branch" "feature-branch"

# Solution 2: Use existing worktree
code "../worktrees/feature-branch"
```

### Problem: Branch Already Checked Out
```bash
# Error: fatal: 'feature-branch' is already checked out

# Find where it's checked out
git worktree list

# Either:
# 1. Switch to that worktree
# 2. Or remove it first
git worktree remove /path/to/other/worktree
```

### Problem: Directory Permissions
```bash
# Error: cannot create directory

# Check parent directory exists and is writable
ls -la ..
mkdir -p ../worktrees  # Create if needed
```

## VS Code Integration Issues

### Problem: VS Code Didn't Open
```bash
# Manual fallback:
code "../worktrees/feature-branch"

# Then manually in VS Code:
# 1. Open terminal: Cmd+` (Mac) or Ctrl+` (Windows/Linux)  
# 2. Type: claude
# 3. Press Enter
```

### Problem: Claude Didn't Auto-Start
```bash
# Check if tasks.json was copied
ls ../worktrees/feature-branch/.vscode/tasks.json

# If missing, copy it:
mkdir -p ../worktrees/feature-branch/.vscode
cp .vscode/tasks.json ../worktrees/feature-branch/.vscode/
```

### Problem: Wrong Directory Opened
```bash
# Verify you're in the right place (in VS Code terminal)
pwd  # Should show worktree path
git branch --show-current  # Should show feature branch
```

## Recovery Procedures

### Emergency: Reset Everything
```bash
# 1. Save any important work
git stash -u -m "Emergency backup"

# 2. Clean up worktrees
git worktree list
git worktree remove ../worktrees/feature-branch

# 3. Return to clean main
git checkout main
git reset --hard origin/main

# 4. Start fresh
git checkout -b feature-new-attempt
```

### Cherry-Pick Alternative

When worktrees are blocked:
```bash
# 1. Make commits on temp branch
git checkout -b temp-changes
git add . && git commit -m "Changes to move"

# 2. Switch to target branch
git checkout feature-branch

# 3. Cherry-pick commits
git cherry-pick temp-changes

# 4. Clean up
git branch -d temp-changes
```

## Prevention Tips

1. **Always validate branch before starting work**
2. **Use worktrees immediately when switching features**
3. **Keep main branch clean - no direct work**
4. **Create handover notes for complex transfers**
5. **Test VS Code integration with a simple file first**

## When to Ask for Help

- Multiple worktrees for same branch
- Merge conflicts during cherry-pick
- Lost work after reset
- Persistent permission errors

Remember: It's better to ask than to lose work!