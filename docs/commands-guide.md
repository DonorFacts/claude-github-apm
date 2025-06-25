# Claude Commands Guide

This guide explains how to use the Claude GitHub APM command system, which automatically syncs your prompts to Claude-accessible commands.

## Quick Start

### Watch Mode (Recommended for Development)
```bash
pnpm watch:commands
```
This continuously monitors `src/prompts/` for changes and automatically syncs them to `.claude/commands/`. Any time you save a prompt file, it's instantly available as a Claude command.

### One-Time Sync
```bash
pnpm sync:commands
```
Performs a single sync of all prompts to commands. Useful for CI/CD or manual updates.

## How It Works

The command sync system:
1. **Scans** all markdown files in `src/prompts/`
2. **Analyzes** imports to determine dependencies
3. **Classifies** files as public commands or private includes
4. **Transforms** filenames using smart naming conventions
5. **Syncs** public commands to `.claude/commands/`

## Command Naming Convention

Commands use a simple flattening approach with hyphens:

### Pattern
- **Root files**: Keep their original name (e.g., `context-save.md`)
- **Nested files**: Flatten path with hyphens (e.g., `git/worktrees/create.md` → `git-worktree-create.md`)

### Pluralization
Directory names are automatically converted to singular forms for cleaner command names:
- `worktrees` → `worktree`
- `agents` → `agent`
- `issues` → `issue`

### Examples
```
src/prompts/context-save.md                  → context-save.md
src/prompts/agent-ify.md                     → agent-ify.md
src/prompts/git/worktrees/create.md          → git-worktree-create.md
src/prompts/agents/developer/init.md         → agent-developer-init.md
src/prompts/agents/scrum-master/init.md      → agent-scrum-master-init.md
```

## Public vs Private Classification

### Public Commands (Synced)
ALL files are included as public commands EXCEPT:
- Files or directories with underscore prefix (e.g., `_private.md`, `_utils/helper.md`)
- Empty files

### Private Files (Not Synced)
Only files meeting these criteria are excluded:
- Any file in a directory starting with `_` (underscore)
- Any file whose name starts with `_` (underscore)
- Empty files with no content

## Using Commands in Claude

Once synced, commands are available in `.claude/commands/` and can be invoked in Claude conversations. For example:

```
User: Help me create a git commit
Claude: I'll help you with that. Let me use the git commit workflow...
[Claude automatically has access to git-workflow-commit.md]
```

## Advanced Usage

### Custom Paths
```bash
# Sync from custom source to custom target
tsx src/command-sync/index.ts --source custom/prompts --target custom/commands

# Watch custom paths
tsx src/command-sync/index.ts --watch --source custom/prompts --target custom/commands
```

### Command Line Options
```bash
# Show help
tsx src/command-sync/index.ts --help

Options:
  -w, --watch      Watch for changes and sync automatically
  -s, --source     Source directory (default: src/prompts)
  -t, --target     Target directory (default: .claude/commands)
  -h, --help       Show help message
```

## File Structure Example

```
src/prompts/
├── agents/
│   ├── init.md                    # Public → agent-init.md
│   ├── developer/
│   │   └── init.md               # Public → agent-developer-init.md
│   └── scrum-master/
│       └── init.md               # Public → agent-scrum-master-init.md
├── git/
│   ├── worktrees/
│   │   └── create.md             # Public → git-worktree-create.md
│   └── commit.md                 # Public → git-commit.md
├── context-save.md               # Public → context-save.md
├── _utils/
│   └── helper.md                 # Private (underscore directory)
└── _private-notes.md             # Private (underscore prefix)
```

## Best Practices

1. **Use Clear Names**: Name your prompts descriptively - the filename becomes part of the command
2. **Organize by Domain**: Place prompts in directories that match their purpose  
3. **Use Underscore for Private**: Prefix with `_` for files/folders that shouldn't be commands
4. **Leverage Imports**: Use `@import` for shared components to keep commands DRY
5. **Watch During Development**: Keep `pnpm watch:commands` running while working on prompts
6. **Verify Output**: Check `.claude/commands/` to ensure expected command names

## Troubleshooting

### Command Not Appearing
- Check if the file or any parent directory starts with underscore `_`
- Ensure the file has content (not empty)
- Run `pnpm sync:commands` to see the sync output
- Check `.claude/commands/` to verify the expected filename

### Organizing Private Files
- Prefix files with `_` to exclude them (e.g., `_draft.md`)
- Create directories starting with `_` for private content (e.g., `_includes/`)
- Use underscore prefix for work-in-progress files

### File Watching Issues
- Ensure you're saving files in the watched directory
- Check that the file extension is `.md`
- Restart the watcher if it stops responding
- Verify no errors in the console output

## Integration with Claude

The `.claude/commands/` directory is automatically recognized by Claude Code. Commands are available for:
- Direct invocation by users
- Inclusion in agent workflows  
- Building composite commands
- Creating reusable patterns

This system ensures your prompts are always organized, discoverable, and ready for use in Claude conversations.