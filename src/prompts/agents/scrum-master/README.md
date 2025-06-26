# Scrum Master Commands Index

## Available Commands

The Scrum Master agent has the following commands available:

### 1. `/breakdown-project-plan`
**Purpose**: Split large Implementation Plans into manageable files
**When to use**: When plan exceeds ~150 lines
**File**: `breakdown-project-plan.md`

### 2. `/critique-project-plan`
**Purpose**: Review plan quality and developer-friendliness
**When to use**: After plan creation or major updates
**File**: `critique-project-plan.md`

### 3. `/create-project-issues`
**Purpose**: Convert Implementation Plan to GitHub issue hierarchy
**When to use**: When ready to start development
**File**: `create-project-issues.md`

### 4. `/update-project`
**Purpose**: Update Implementation Plan and sync with GitHub issues
**When to use**: When adding, removing, or modifying plan items
**File**: `update-project.md`

## Command Execution Order

For a typical project:
1. **Breakdown** (if plan > 150 lines)
2. **Critique** (ensure quality)
3. **Create Issues** (when plan approved)
4. **Update Project** (as changes arise during development)

## Quick Command Reference

```bash
# Check plan size
wc -l .apm/Implementation_Plan.md

# If large, break it down
/breakdown-project-plan

# Review for quality
/critique-project-plan

# Create GitHub issues
/create-project-issues

# Update plan and issues
/update-project
```

## Command Details

For full documentation of each command, load the specific file when needed to minimize context usage.