# Transferring Files to Worktrees

## Problem: Changes Made on Wrong Branch

When you realize you've been working on main but should be in a worktree:

## Simple Solution: Direct File Copy

```bash
# For new files - just copy them
cp new-file.ts ../worktrees/feature-branch/
cp src/prompts/new-doc.md ../worktrees/feature-branch/src/prompts/

# For modified files - copy if you own all changes
cp modified-file.ts ../worktrees/feature-branch/

# For mixed changes - create a patch
git diff CLAUDE.md > /tmp/my-changes.patch
```

## Complete Handover Process

1. **Identify files to transfer**
```bash
git status --porcelain
# Identify which files are yours vs unrelated
```

2. **Copy your files to worktree**
```bash
cp my-new-file.ts ../worktrees/feature-branch/
cp -r my-new-directory/ ../worktrees/feature-branch/
```

3. **Create handover instructions**
```bash
# Get branch name for the worktree
BRANCH_NAME=$(cd ../worktrees/feature-branch && git branch --show-current)

# Save to standardized location
cat > apm/worktree-handovers/$BRANCH_NAME.md << EOF
# Handover: $BRANCH_NAME

## Files Transferred
- List all files copied
- Note any patches to apply
- Describe the work context

## Next Steps
- Review with git status
- Commit the changes
- Continue development
EOF
```

4. **Open VS Code in worktree**
```bash
tsx src/tools/worktree-manager/open-worktree-vscode.ts "../worktrees/feature-branch"
```

## Why This Works

- No need to cd to directories (Claude Code limitation)
- Direct file operations work across directories
- Handover instructions guide the next Claude instance
- VS Code opens with Claude auto-starting

## Example from Real Usage

```bash
# Copied git worktree documentation files
cp .vscode/tasks.json ../worktrees/feature-draft-git-worktree-docs/.vscode/
cp open-worktree-vscode.ts ../worktrees/feature-draft-git-worktree-docs/
cp src/prompts/git-worktrees-*.md ../worktrees/feature-draft-git-worktree-docs/src/prompts/

# Created handover instructions
cp worktree-handover-instructions.md ../worktrees/feature-draft-git-worktree-docs/

# Opened VS Code
tsx src/tools/worktree-manager/open-worktree-vscode.ts "../worktrees/feature-draft-git-worktree-docs"
```

## Best Practices

1. **Always check target directory exists first**
2. **Copy handover instructions last** (so they're current)
3. **Use patches for partial file changes**
4. **Let VS Code + tasks.json handle Claude launch**