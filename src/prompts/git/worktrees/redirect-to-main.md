# Git Worktrees - Redirect to Main Window

## Purpose

This prompt helps agents in worktree windows redirect users to the main window for worktree management commands that should only be run by Agent 1.

## When to Use

When a user sends any of these commands from within a worktree window:
- `/git-worktrees-remove`
- `/git-worktrees-create` 
- Any other worktree management command

## Detection Logic

```bash
# Check if currently in a worktree (not main directory)
if git rev-parse --git-dir 2>/dev/null | grep -q ".git/worktrees"; then
    # We're in a worktree - redirect is needed
    echo "REDIRECT_NEEDED=true"
else
    # We're in main directory - proceed normally
    echo "REDIRECT_NEEDED=false"
fi
```

## Agent Response

When redirecting, display this message:

```
🚫 WORKTREE MANAGEMENT REDIRECT

You're currently in a worktree window, but worktree management commands
should be run from the main project window.

┌─────────────────────────────────────────────┐
│  ❌ THIS WINDOW: Feature development only    │
│  ✅ MAIN WINDOW: Worktree management        │
└─────────────────────────────────────────────┘

To use `/git-worktrees-remove`:
1. Switch to your main project VS Code window
2. Run the command there with Agent 1
3. Agent 1 will safely clean up this worktree

Agent 1 has visibility into the full project state and can ensure
safe cleanup of all worktree-related files and references.

Continue your feature development here, and use the main window
for worktree lifecycle management.
```

## Integration with Other Commands

Add this redirect check to the beginning of any worktree management prompts:

```markdown
## Environment Check

Before proceeding, verify you're in the correct environment:

```bash
# Include the redirect-to-main.md logic here
```

If redirect is needed, show the redirect message and stop processing.
```

## Context Awareness

The agent should understand:
- **Worktree agents** focus on feature development
- **Main window agents** handle project infrastructure
- **Clear separation** prevents confusion and errors
- **User guidance** helps maintain proper workflow boundaries

This ensures users get help from the right agent in the right context.