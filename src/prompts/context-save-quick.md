# Quick Context Save

Perform a quick save of your current work state. This is a routine checkpoint that preserves your current context without extensive reflection.

## When You Receive This Command

The user has requested a quick context save. This typically happens at:
- Task completion points
- Natural break points
- Before switching focus
- End of work session

## Save Process

### 1. Update latest.md

Save your current context to `apm/agents/<role-id>/context/latest.md` using the standard context structure from the main context-save.md prompt.

### 2. Quick Memory Check

Add any NEW learnings to `apm/agents/<role-id>/MEMORY.md`:
- User preferences discovered this session
- Successful approaches found
- Patterns noticed

Skip if no new learnings emerged.

### 3. Update Index

Add a brief entry to `apm/agents/<role-id>/context/index.md`:
```markdown
### Quick Save - [ISO Timestamp]
- **State**: [Current work focus]
- **Progress**: [What was accomplished]
```

### 4. Confirm Completion

Report back to user:
```
✅ Quick context save completed
- Context saved to latest.md
- Memory updated with [X] new learnings (if any)
- Ready to continue or close session
```

Execute this quick save now.