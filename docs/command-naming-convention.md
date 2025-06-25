# Claude Command Naming Convention

## Overview

This document defines the simplified naming convention for Claude commands stored in `.claude/commands/`. The convention uses a flat structure with hyphen-separated paths for clarity.

## Naming Rules

### 1. Root Level Files
Files at the root of `src/prompts/` keep their original names:
- `src/prompts/context-save.md` → `context-save.md`
- `src/prompts/agent-ify.md` → `agent-ify.md`

### 2. Nested Files
Files in subdirectories are flattened with hyphens:
- `src/prompts/git/worktrees/create.md` → `git-worktree-create.md`
- `src/prompts/agents/developer/init.md` → `agent-developer-init.md`

### 3. Pluralization
Directory names are automatically converted to singular forms:
- `worktrees` → `worktree`
- `agents` → `agent`
- `issues` → `issue`
- `patterns` → `pattern`
- `commits` → `commit`
- `branches` → `branch`

## Public vs Private Classification

### Public Commands (Included)
ALL files are synced as public commands EXCEPT those with underscore prefixes.

### Private Files (Excluded)
Files are excluded only if:
- The file name starts with `_` (e.g., `_draft.md`)
- Any parent directory starts with `_` (e.g., `_includes/helper.md`)
- The file is empty

## Examples

```
# Root level files
src/prompts/context-save.md              → context-save.md
src/prompts/agent-ify.md                 → agent-ify.md
src/prompts/reflect-for-docs.md          → reflect-for-docs.md

# Git commands
src/prompts/git/commit.md                → git-commit.md
src/prompts/git/worktrees/create.md      → git-worktree-create.md
src/prompts/git/worktrees/verify.md      → git-worktree-verify.md

# Agent commands
src/prompts/agents/init.md               → agent-init.md
src/prompts/agents/developer/init.md     → agent-developer-init.md
src/prompts/agents/developer/tdd.md      → agent-developer-tdd.md

# Private files (not synced)
src/prompts/_utils/helper.md             → (excluded)
src/prompts/agents/_draft.md             → (excluded)
src/prompts/_experiments/test.md         → (excluded)
```

## Usage in Claude

Commands are invoked using their transformed names:
- `/context-save` - Save current context
- `/git-worktree-create` - Create a new git worktree
- `/agent-developer-init` - Initialize as developer agent

## Best Practices

1. **Use descriptive names** - The filename becomes the command name
2. **Organize by domain** - Use subdirectories for logical grouping
3. **Use underscore for private** - Prefix with `_` for non-command files
4. **Keep names concise** - Avoid overly long directory nesting

## File Watcher Implementation

The command sync system:
1. Watches `src/prompts/**/*.md` for changes
2. Excludes files/directories with underscore prefix
3. Flattens nested paths with hyphens
4. Syncs to `.claude/commands/`

### Commands

```bash
# One-time sync
pnpm sync:commands

# Watch mode (recommended for development)
pnpm watch:commands
```

## Implementation Status

- [x] Simple underscore-based classification
- [x] Path flattening with hyphens
- [x] Pluralization handling
- [x] File watcher with auto-sync
- [x] Terminal title updates
- [x] NPM scripts for easy usage