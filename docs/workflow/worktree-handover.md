# Git Worktree Handover System

## Overview

The worktree handover system enables seamless context transfer when working with multiple features simultaneously. When you create a new git worktree for a feature, the system automatically passes context from your current Claude instance to a new one in the new VS Code window.

Think of it as a "baton pass" in a relay race - one Claude agent hands off work to another without losing momentum.

## How It Works

### The Complete Flow

```
1. You're working in main branch with Claude
   ↓
2. You request a new worktree for a feature
   ↓
3. Claude creates worktree + handover file
   ↓
4. Claude opens new VS Code window
   ↓
5. New Claude automatically reads handover
   ↓
6. New Claude initializes with correct role
   ↓
7. Work continues seamlessly
```

### What Happens Automatically

1. **Handover File Creation**: When creating a worktree, Claude generates a handover file at:
   ```
   apm/worktree-handovers/not-started/YYYY_MM_DD-<branch-name>.md
   ```

2. **VS Code Launch**: Claude opens the new worktree in VS Code with:
   ```bash
   tsx src/tools/worktree-manager/open-worktree-vscode.ts <path>
   ```

3. **Auto-Initialization**: VS Code runs a task on folder open that:
   - Detects it's a worktree
   - Finds the matching handover file
   - Displays the handover content to Claude
   - Moves the file to `completed/` (one-time use)

4. **Role Assignment**: The new Claude reads which agent role to initialize as

## Your Responsibilities

### When Creating a Worktree

1. **Provide Clear Context**: When requesting a new worktree, be specific:
   ```
   "Create a worktree for issue #123 to implement user authentication"
   ```

2. **Review the Handover**: Claude will show you what information it's passing. Review it briefly.

3. **Wait for VS Code**: Let the new window fully load before switching to it.

### In the New Window

1. **Check Claude Started**: Ensure Claude is running in the terminal

2. **Verify Role**: The new Claude should announce its role (e.g., "Developer agent initialized")

3. **No Handover?** If Claude asks "What would you like to work on?":
   - The handover may have been processed already
   - Or there was no handover for this branch
   - Simply tell Claude what you need

## Examples

### Example 1: Feature Development

**You say**: "Create a worktree for issue #234 to add dark mode"

**Claude 1 (Scrum Master)** creates:
- Worktree: `feature-234-dark-mode`
- Handover specifying Developer role
- Context about dark mode requirements

**Claude 2 (Developer)** receives:
- Role assignment
- Issue context
- Next steps

### Example 2: Bug Fix

**You say**: "Need to fix the login bug in issue #345"

**Claude 1** creates:
- Worktree: `fix-345-login-bug`
- Handover with debugging context
- Previous investigation notes

**Claude 2** starts with full context about the bug

## Common Scenarios

### Multiple Worktrees
You can have multiple worktrees/windows open:
- Each has its own Claude instance
- Each focuses on one feature
- Handovers prevent context mixing

### Returning to a Worktree
If you close and reopen a worktree window:
- No new handover needed (already processed)
- Claude asks what you'd like to work on
- You provide current context

### Manual Handover Check
If needed, you can manually trigger the check:
```bash
bash src/scripts/git-worktree/check-handover.sh
```

## Troubleshooting

### "No handover found"
**Normal if**:
- Returning to existing worktree
- Created worktree manually
- Handover already processed

**Action**: Just tell Claude what to work on

### Wrong Role Initialized
**Cause**: Handover specified unexpected role
**Fix**: Tell Claude to initialize as different role:
```
"Please initialize as the Developer agent instead"
```

### Handover Not Processing
**Check**:
1. VS Code task is configured (`.vscode/tasks.json`)
2. You're in a worktree directory
3. Handover file exists in `not-started/`

**Manual process**:
```bash
bash src/scripts/git-worktree/check-handover.sh
```

## Best Practices

1. **One Feature = One Worktree = One Window**
   - Keeps context focused
   - Prevents accidental cross-contamination

2. **Clear Handover Context**
   - Include issue numbers
   - Summarize decisions made
   - List next steps

3. **Trust the Automation**
   - Don't manually create handover files
   - Let Claude handle the technical details
   - Focus on your feature requirements

## Technical Details (If Curious)

### Handover File Format
```markdown
# Worktree Handover: <branch>

## Agent Initialization
**Role**: developer
**Initialize with**: `src/prompts/agents/developer/init.md`

## Task Context
**GitHub Issue**: #123
**Purpose**: Implement user authentication
...
```

### Directory Structure
```
apm/worktree-handovers/
├── not-started/     # New handovers
│   └── 2024_06_25-feature-auth.md
└── completed/       # Processed handovers
    └── 2024_06_25-feature-auth.md
```

### Why One-Time Use?
- Prevents duplicate initialization
- Keeps completed work archived
- Avoids confusion on return visits

## Summary

The worktree handover system handles the complex parts automatically. Your job is simply to:

1. Request worktrees with clear context
2. Wait for VS Code to open
3. Continue working with the new Claude

Everything else - file creation, role assignment, context transfer - happens behind the scenes.