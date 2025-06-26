# Git Commit Guide

Commits serve as project documentation. Commit early and often.

## Branch Setup

```bash
CURRENT_BRANCH=$(git branch --show-current)
CREATED_NEW_BRANCH=false

# If on main/master, create feature branch
if [[ "$CURRENT_BRANCH" =~ ^(main|master)$ ]]; then
    # Use issue# (feature-123-desc) or 'draft' for exploration
    BRANCH_NAME="feature-123-description"
    git checkout -b "$BRANCH_NAME"
    CREATED_NEW_BRANCH=true
fi

# Stage YOUR changes only (see Selective Staging below)
# Then commit with proper format

# If created new branch, setup worktree
if [[ "$CREATED_NEW_BRANCH" == "true" ]]; then
    git checkout main
    git worktree add "../worktrees/$BRANCH_NAME" "$BRANCH_NAME"
    echo "✅ Worktree created, you're back in main"
fi
```

## CRITICAL: Selective Staging

**NEVER use `git add .`** - Only stage YOUR changes:

```bash
# 1. Review all changes
git status

# 2. Identify YOUR files (ones you created/edited this session)
# NOT yours: other agents' work, system files, unrelated changes

# 3. Add ONLY your files
git add src/file-i-edited.ts docs/file-i-created.md

# 4. Verify before commit
git diff --staged

# 5. Commit
git commit
```

## When to Commit

**Required**:
- After each response that modifies files
- Every 3-5 file changes
- Before switching tasks
- At natural breakpoints

**Additional**:
- Task completion
- Bug fixes
- Decision points
- Before/after testing

## Commit Format

```
<type>: <summary> (50 chars max)

- <specific change 1>
- <specific change 2>

<why/context if non-obvious>

Issues: #task #epic #project #phase
Status: completed|partial|blocked|progress
Next: <immediate action>
```

**Types**: feat|fix|refactor|docs|test|build|chore|wip

**Components**:
- Summary: One-line description
- Changes: Bullet points of modifications
- Issues: All relevant GitHub issue numbers
- Status: Current state of work
- Next: What comes immediately after

## Examples

### WIP Checkpoint
```
wip: add user auth validation

- Created validation middleware
- Added JWT token checks
- Set up test fixtures

Issues: #45 #40 #35 #5
Status: progress
Next: implement refresh tokens
```

### Feature Complete
```
feat: implement OAuth2 login flow

- Added Google/GitHub providers
- Created token refresh logic
- Updated user model with OAuth fields
- Added comprehensive integration tests

Follows RFC 6749 for standard compliance.
Chose Passport.js for broad provider support.

Issues: #234 #230 #200 #20
Status: completed
Next: deploy to staging
```

### Blocked Work
```
fix: resolve circular dependency

- Identified cycle in TokenCounter/ContextManager
- Attempted dependency injection (failed)
- Documented reference chain

TypeScript constraints prevent clean separation.

Issues: #89 #85 #80 #8
Status: blocked
Next: architecture review needed
```

## Git Commands

```bash
# View recent commits
git log --oneline -20

# Search by issue
git log --grep="#123"

# Find blocked work
git log --grep="Status: blocked"

# Today's progress
git log --since="midnight"

# Specific file history
git log --follow -p path/to/file
```

## Agent Workflow

### Starting Work
1. `git log --oneline -10` - Review recent commits
2. `git status` - Check current state
3. Identify relevant GitHub issues

### During Work
1. Commit after EVERY file modification set
2. Use `wip:` for checkpoints
3. Include issue numbers always
4. Don't batch unrelated changes

## Best Practices

1. **Commit frequently** - Don't wait for perfection
2. **Be specific** - Include file paths, function names
3. **Link issues** - Always include GitHub issue numbers
4. **Explain decisions** - Document "why" for non-obvious choices
5. **Stage selectively** - Only commit YOUR changes

Remember: Each commit is a recoverable checkpoint. When in doubt, commit!