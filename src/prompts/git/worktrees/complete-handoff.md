# Git Worktrees - Complete Handoff

## When to Use This Command

- Immediately after Step 6 in create.md
- To complete the handoff process
- To prompt user for validation
- To learn boundary enforcement rules

## What Should Happen

After running the worktree creation workflow:

1. **Worktree Created**: New directory at `../worktrees/<branch-name>`
2. **VS Code Opened**: New window with worktree folder
3. **Claude Started**: Terminal panel with Claude prompt
4. **Correct Context**: Feature branch, not main

## Agent: Prompt User to Validate

After creating a worktree, prompt the user with these validation steps:

```
Please switch to the new VS Code window and verify:

1. Run 'pwd' - you should be in the worktree directory
   (e.g., /path/to/worktrees/feature-123-description)

2. Run 'git branch --show-current' - you should see your feature branch
   (not main/master)

3. Check that Claude is running in the terminal
   (you should see Claude's interface)

4. If everything looks correct, tell me "verified" and continue your work there.
   If something seems wrong, let me know what you're seeing.
```

## Post-Handoff Boundary Protocol

**CRITICAL**: Once a worktree is created and handed off, clear boundaries exist.

### For the Original Agent (in main directory)

The agent must now enforce strict boundaries:

#### Decision Flow

```
User makes request
    ↓
Is it about code/features/implementation?
    ↓ Yes              ↓ No
Redirect to          Continue in
worktree            main window
```

#### Implementation

```bash
# Check if worktrees exist
if [ -d "../worktrees" ] && [ "$(ls -A ../worktrees)" ]; then
    # For ANY code-related request:
    code "../worktrees/$(ls -t ../worktrees/ | head -1)"
    echo "I've refocused your feature window. Please continue there."
    exit 0
fi
```

#### Language Understanding Rules

**DEFAULT**: Assume request relates to active feature work

**Signs to REDIRECT** (without asking):
- Any code modification request
- Testing, debugging, refactoring
- Documentation updates
- "Add", "fix", "implement", "change", "update"
- Questions about the implementation

**Signs to ASK** (before creating new worktree):
- "different bug", "unrelated issue", "separate feature"
- "actually, I need to...", "forget that, let's..."
- Explicit context switch language
- Completely different component mentioned

**Example Responses**:
```
User: "Can you add error handling?"
Agent: [redirects] "I've refocused your feature window. Please continue there."

User: "Actually, I need to fix a critical production bug"
Agent: "This seems like different work. Should I:
        1. Continue in the feature window (default)
        2. Create a new worktree for this bug fix?"
```

### For the New Agent (in worktree)

The agent in the worktree:
- Owns ALL work for that feature
- Should not worry about the main directory
- Has full context for the feature
- Makes all commits to the feature branch

## If Validation Fails

### VS Code opened but wrong directory?

```bash
# In VS Code terminal, check where you are
pwd
git branch --show-current

# If wrong, close and reopen correctly:
code "../worktrees/feature-123-description"
```

### Claude didn't start?

1. Check for terminal panel at bottom
2. If no terminal: `View → Terminal` or Ctrl+`
3. Type `claude` and press Enter
4. If command not found, check PATH or use full path

### Can't find the worktree?

```bash
# List all worktrees
git worktree list

# Find your branch's worktree path
# Open VS Code there manually
```

### Changes missing in worktree?

Check if changes were committed before creating worktree:
```bash
# In main directory
git log --oneline -5

# In worktree
git log --oneline -5

# If commits missing in worktree:
git cherry-pick <commit-hash>
```

## Why Manual Validation?

Automated tests can't verify:
- Did VS Code actually appear on screen?
- Is Claude responding in the terminal?
- Can the user see and interact with the setup?

Only the user can confirm the handoff succeeded visually.

## Boundary Enforcement Examples

### Scenario 1: Feature Addition
```
[Original Window]
User: "Add validation to the form"
Agent: code "../worktrees/$(ls -t ../worktrees/ | head -1)"
Agent: "I've refocused your feature window for this work."
```

### Scenario 2: Ambiguous Request
```
[Original Window]
User: "Can you check the tests?"
Agent: code "../worktrees/$(ls -t ../worktrees/ | head -1)"
Agent: "I've refocused your feature window where the tests are."
```

### Scenario 3: Clear Context Switch
```
[Original Window]
User: "Wait, I need to fix a different bug in production"
Agent: "This sounds like separate work. Should I:
        1. Continue in your feature window (default)
        2. Create a new worktree for the bug fix?
        
        Please choose 1 or 2."
```

## Success Criteria

✅ Worktree exists at correct path  
✅ VS Code opened automatically  
✅ Claude is running in terminal  
✅ Correct branch is checked out  
✅ Original agent redirects appropriately  
✅ Clear separation of concerns

## Summary

1. **Validate** the setup worked correctly
2. **Enforce** boundaries between windows
3. **Redirect** code work to feature windows
4. **Ask** only when explicitly different scope
5. **Maintain** one feature = one window = one agent