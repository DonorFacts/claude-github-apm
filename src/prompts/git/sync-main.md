# Git: Sync Main Branch (Preserving Local Changes)

## When To Use This

Use this command when you need to:
- Update your local main branch with latest remote changes
- BUT you have uncommitted changes you want to preserve
- Avoid losing work-in-progress modifications
- Prepare for merging main into your feature branch

Common scenarios:
- You've been working locally and need to pull latest main
- You started changes on main but haven't committed yet
- You need to update dependencies from main without losing local edits
- Before creating a new feature branch from updated main

## Steps to Execute

1. **Check current status**
   ```bash
   git status
   ```
   Verify which files have uncommitted changes.

2. **Fetch latest from remote**
   ```bash
   git fetch origin main
   ```
   This updates your remote tracking branch without affecting local files.

3. **Stash conflicting tracked files (if needed)**
   If merge would overwrite tracked files with changes:
   ```bash
   git stash push -m "Temporary stash for main sync" -- <file1> <file2>
   ```
   Only stash files that would conflict with the merge.

4. **Merge or rebase main**
   
   Option A - Merge (preserves all history):
   ```bash
   git merge origin/main
   ```
   
   Option B - Rebase (cleaner history if on feature branch):
   ```bash
   git rebase origin/main
   ```

5. **Restore stashed changes (if any)**
   ```bash
   git stash pop
   ```
   This reapplies your local changes on top of the updated main.

6. **Verify final state**
   ```bash
   git status
   ```
   Ensure all your local changes are still present.

## Important Notes

- Untracked files (shown as `??` in git status) are never affected by merge/rebase
- Only tracked files with uncommitted changes need stashing
- If you get merge conflicts after stash pop, resolve them manually
- Consider committing your changes to a feature branch instead for cleaner workflow

## Alternative Approach

If you frequently need to preserve local changes, consider:
1. Commit changes to a feature branch first
2. Switch to main and pull latest
3. Merge updated main into your feature branch

This provides better change tracking and easier conflict resolution.

## Automated Script

For convenience, use the provided bash script:

```bash
./src/scripts/git/sync-main.sh
```

This script:
- Validates you're on main branch
- Automatically stashes/restores changes
- Provides clear conflict resolution guidance
- Preserves your stash if conflicts occur