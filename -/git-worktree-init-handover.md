# Git Worktree Handover Check

Run the handover check script to process any worktree initialization:

```bash
bash src/scripts/git-worktree/check-handover.sh
```

This script will:
1. Detect if you're in a git worktree
2. Look for handover files in `apm/worktree-handovers/not-started/`
3. Process and move any found handover to `completed/`
4. Display appropriate next steps

After running, follow any agent initialization path specified in the handover.