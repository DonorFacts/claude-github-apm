# Git Commit Documentation System

## Purpose

This guide establishes git commits as the project's primary documentation and progress tracking system. Each commit message serves as a concise log entry, capturing project progress, decisions, and context for future reference while integrating with GitHub's issue tracking hierarchy.

## Git Workspace Setup

Before you commit any changes, ensure you're on a development branch and have set up your git workspace properly:

```bash
# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
CREATED_NEW_BRANCH=false

# If on main/master, create a new feature branch
if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
    echo "⚠️ On main branch - creating feature branch"

    # Determine branch name from context
    # If you have an assigned issue number: feature-123-description
    # If no issue yet: feature-draft-description
    # Development branch types: feature|fix|docs|chore|refactor
    BRANCH_NAME="feature-123-your-task"  # Update based on your assignment

    # Create and checkout new branch
    git checkout -b "$BRANCH_NAME"
    CREATED_NEW_BRANCH=true
    CURRENT_BRANCH="$BRANCH_NAME"
else
    echo "✅ Already on development branch: $CURRENT_BRANCH"
fi

# Commit changes to the current development branch
if [[ -n $(git status --porcelain) ]]; then
    git add .
    # Use proper commit format as described in "Commit Message Format" section below
    git commit
fi

# If we created a new branch, switch back to main and create worktree
if [[ "$CREATED_NEW_BRANCH" == "true" ]]; then
    git checkout main
    git worktree add "../worktrees/$CURRENT_BRANCH" "$CURRENT_BRANCH"
    echo "✅ Created worktree at ../worktrees/$CURRENT_BRANCH"
    echo "📍 Back in main branch in current directory"
fi
```

**Important**:

- Always work in development branches, never on main
- Update branch name based on your assigned GitHub issue
- If starting exploratory work, use `draft` until issue is created
- The workflow creates a branch, commits changes, then sets up a worktree
- You remain in the current directory after setup

## Commit Frequency

**IMPORTANT**: Commit early and often! The `/commit` command triggers an immediate commit.

### Required Commit Points

- **After Each Claude Code Response**: If any files were modified
- **Every 3-5 File Changes**: For complex multi-file updates
- **Before Context Switches**: When changing focus areas
- **At Natural Breakpoints**: After completing logical units of work

### Additional Commit Triggers

- **Task Completion**: When finishing any GitHub issue
- **Feature Implementation**: After adding new functionality
- **Bug Fixes**: After resolving any issue
- **Decision Points**: When making architectural choices
- **Before Testing**: To checkpoint working state
- **After Testing**: To capture test results or fixes

## Commit Message Format

```
<type>: <summary>

<what-changed>
- <key-change-1>
- <key-change-2>

<why-context>
<decision-rationale>

Issues: #<task> #<epic> #<project> #<phase>
Status: <completed|partial|blocked|progress>
Next: <immediate-next-step>
```

### Components

**Type** (required):

- `feat`: New feature or functionality
- `fix`: Bug fix or issue resolution
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation updates
- `test`: Test additions or modifications
- `build`: Build system or dependency changes
- `chore`: Maintenance tasks
- `wip`: Work in progress (for frequent checkpoint commits)

**Summary** (required): One-line description (50 chars max)

**GitHub Issues** (required when applicable):

- Include all relevant issue numbers in hierarchy order
- Format: `Issues: #<task> #<epic> #<project> #<phase>`
- May include multiple tasks if working across areas
- Example: `Issues: #123 #120 #100 #10` (task→epic→project→phase)
- For issue type definitions, see Scrum Master agent documentation

**What Changed** (required): Bullet points of specific modifications

**Why Context** (optional): Brief rationale for the changes

**Decision Rationale** (optional): Key decisions made and why

**Status** (required):

- `completed`: Task/issue fully finished
- `partial`: Progress made, more work needed
- `blocked`: Cannot proceed due to dependencies
- `progress`: Ongoing work checkpoint

**Next** (optional): Immediate next action or task

## Examples

### Simple Progress Checkpoint

```
wip: implementing prompt transformation logic

- Added transformation function skeleton
- Set up test harness for transformations
- Created initial mapping structure

Issues: #45 (task) #40 (epic) #35 (project) #5 (phase)
Status: progress
Next: implement actual transformation rules
```

### Task Completion with Full Hierarchy

```
feat: add GitHub-integrated prompt processor

- Created prompt transformation pipeline
- Implemented 1-to-1 file mapping system
- Added GitHub Actions workflow trigger
- Set up automated testing for transformations

Integrated with existing APM structure to maintain compatibility.

Issues: #234 (task) #230 (epic) #200 (project) #20 (phase)
Status: completed
Next: deploy to staging environment
```

### Multi-Task Commit

```
refactor: consolidate error handling across processors

- Unified error types in lib/errors
- Updated all processors to use new error system
- Added comprehensive error logging
- Fixed inconsistent error messages

Standardized error handling improves debugging and monitoring.

Issues: #156 #157 #158 (tasks) #150 (epic) #140 (project) #15 (phase)
Status: partial
Next: update documentation for new error types
```

### Blocked Task

```
fix: resolve circular dependency in context loader

- Identified cycle between TokenCounter and ContextManager
- Attempted dependency injection (failed due to type issues)
- Documented circular reference chain

TypeScript constraints preventing clean separation.
Need architectural review before proceeding.

Issues: #89 (bug) #85 (epic) #80 (project) #8 (phase)
Status: blocked
Next: schedule architecture review meeting
```

### Feature Implementation

```
feat: implement APM prompt post-processing system

- Created specialized prompt engineering agent
- Set up transformation pipeline structure
- Added GitHub issue integration hooks
- Configured 1-to-1 mapping validation

Building foundation for automated prompt transformation workflow.

Issues: #78 (feature) #75 (epic) #70 (project) #5 (phase)
Status: completed
Next: create transformation rules engine
```

## Best Practices

1. **Commit Frequently**: Don't wait for perfection; commit working progress
2. **Be Specific**: Include file paths, function names, and concrete changes
3. **Link Issues**: Always include relevant GitHub issue numbers
4. **Explain Decisions**: Document "why" for non-obvious choices
5. **Action-Oriented**: Focus on what changed, not process details

## Viewing Project History

Use these git commands to review project progress:

```bash
# View recent commits
git log --oneline -20

# Search for specific GitHub issue
git log --grep="#45"

# View all commits for an epic
git log --grep="#40" --oneline

# View detailed commit
git show <commit-hash>

# Find all blocked items
git log --grep="Status: blocked"

# View today's progress
git log --since="midnight" --oneline

# Track specific file history
git log --follow -p path/to/file
```

## Agent Workflow Integration

### Starting Work

1. Review recent commits: `git log --oneline -10`
2. Check current status: `git status`
3. Identify relevant GitHub issues

### During Work

1. **Commit after EVERY file modification set**
2. Use `wip:` prefix for checkpoint commits
3. Include issue numbers even for small changes
4. Don't batch unrelated changes

## Reminder for Claude Code Agents

**CRITICAL**: You must commit frequently throughout your work session:

- After each substantive response that modifies files
- Before switching between different tasks or files
- Whenever the user might want to checkpoint progress
- At natural breaking points in implementation

Each commit creates a recoverable checkpoint and documents the development process. When in doubt, commit!
