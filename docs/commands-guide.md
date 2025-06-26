# Claude Commands Guide

This comprehensive guide covers everything about the Claude GitHub APM command system - from using commands to creating new ones.

## Quick Start for Users

### What are Commands?

Commands are reusable prompts that enhance Claude's capabilities. They're automatically synced from `src/prompts/` to be instantly available in your conversations.

### How to Use Commands

There are two ways to invoke commands:

#### 1. Slash Commands (Direct Invocation)
Start your message with a forward slash followed by the command name:
```
/git-commit
/agent-developer-init
/context-save
```

This executes the command immediately as your entire message.

#### 2. Command References (Inline Inclusion)
Include commands anywhere in your message using the `@-/` syntax:
```
I need help with git. @-/git-commit and then @-/git-worktree-create
```

This loads the command content into Claude's context while processing your full message.

### The "-" Shortcut Folder

The `-` folder in your project root is automatically created and maintained by the command sync system. It provides:
- Quick file access without navigating deep directories
- Easy command discovery with your file explorer
- Identical content to `.claude/commands/` (synced automatically)
- Real-time updates when using watch mode

**Example usage:**
```bash
# View available commands
ls -/

# Read a specific command
cat -/git-commit.md

# Edit a command (but edit the source in src/prompts/ instead!)
code -/agent-developer-init.md
```

## For Developers: Creating Commands

### Setup

```bash
# Watch mode (recommended during development)
pnpm watch:commands

# One-time sync
pnpm sync:commands
```

### File Organization

Place your prompt files in `src/prompts/` with logical organization:

```
src/prompts/
├── context-save.md                 # Root-level utility
├── git/
│   ├── commit.md                   # Git operations
│   └── worktrees/
│       └── create.md               # Nested git features
├── agents/
│   ├── init.md                     # General agent init
│   └── developer/
│       ├── init.md                 # Role-specific init
│       └── tdd-workflow.md         # Role-specific commands
└── _private/                       # Excluded from sync
    └── draft.md                    # Work in progress
```

### Naming Convention

The system automatically transforms file paths into command names:

| Source Path | Command Name | Invocation |
|------------|--------------|------------|
| `context-save.md` | `context-save.md` | `/context-save` |
| `git/commit.md` | `git-commit.md` | `/git-commit` |
| `git/worktrees/create.md` | `git-worktree-create.md` | `/git-worktree-create` |
| `agents/developer/init.md` | `agent-developer-init.md` | `/agent-developer-init` |

**Transformation Rules:**
1. Flatten directory structure with hyphens
2. Convert plural to singular (agents → agent, worktrees → worktree)
3. Preserve hyphens in original filenames
4. Exclude underscore-prefixed files/folders

### Public vs Private Files

**Public (Synced as Commands):**
- All `.md` files in `src/prompts/`
- EXCEPT those with underscore prefixes

**Private (Excluded):**
- Files starting with `_` (e.g., `_draft.md`)
- Files in directories starting with `_` (e.g., `_includes/helper.md`)
- Empty files

### Command Imports

Commands can include other files using:
- `@import filename.md` - Same directory import
- `@include:filename.md` - Alternative syntax
- `@src/prompts/path/file.md` - Absolute path
- `@../relative/path.md` - Relative path

## How Commands Work

### Sync Process

1. **Scanner** finds all `.md` files in `src/prompts/`
2. **Analyzer** extracts import relationships
3. **Classifier** identifies public commands (non-underscore files)
4. **Transformer** creates kebab-case names with smart pluralization
5. **Syncer** copies to both `.claude/commands/` and `-/` directories

### Watch Mode Features

- Real-time sync on file changes
- Terminal title shows sync status
- Automatic cleanup when files are deleted
- Console feedback for all operations

### Command Line Options

```bash
tsx src/command-sync/index.ts [options]

Options:
  -w, --watch      Watch for changes
  -s, --source     Source directory (default: src/prompts)
  -t, --target     Target directory (default: .claude/commands)
  -h, --help       Show help
```

## Best Practices

### For Users
1. **Learn Common Commands**: Familiarize yourself with frequently used commands
2. **Use Slash for Actions**: Use `/command` when you want immediate action
3. **Use @-/ for Context**: Use `@-/command` when referencing multiple commands
4. **Check "-" Folder**: Browse available commands in the `-` folder

### For Developers
1. **Descriptive Names**: Filename becomes the command - make it clear
2. **Logical Organization**: Group related commands in directories
3. **Use Underscore for Drafts**: Prefix with `_` while developing
4. **Document Commands**: Include purpose and usage at the top
5. **Test Before Committing**: Ensure commands work as expected
6. **Keep Commands Focused**: One command, one purpose

## Common Patterns

### Agent Commands
```
/agent-init                    # General agent initialization
/agent-developer-init          # Specific role initialization
/agent-developer-tdd-workflow  # Role-specific workflows
```

### Git Commands
```
/git-commit                    # Create commits
/git-worktree-create          # Manage worktrees
/git-worktree-verify          # Verify setup
```

### Utility Commands
```
/context-save                  # Save conversation context
/reflect-for-docs             # Generate documentation
/team-knowledge-contribution  # Share learnings
```

## Troubleshooting

### Command Not Available
- Check if file exists in `src/prompts/`
- Ensure no underscore prefix in path
- Verify file has content
- Run `pnpm sync:commands` manually
- Check console for sync errors

### Wrong Command Name
- Review naming convention rules
- Check for pluralization (agents → agent)
- Verify hyphen placement
- Look in `-/` folder for actual name

### Import Issues
- Verify import syntax is correct
- Check relative paths resolve correctly
- Ensure imported files exist
- Watch for circular dependencies

## Advanced Usage

### Chaining Commands
Combine multiple commands in one message:
```
@-/git-worktree-create then @-/agent-developer-init and start with @-/agent-developer-tdd-workflow
```

### Command Parameters
Some commands accept parameters via environment variables or context:
```
Set BRANCH_NAME=feature-x then /git-worktree-create
```

### Custom Workflows
Create composite commands that import multiple components:
```markdown
# custom-workflow.md
@include:git/commit.md
@include:agents/developer/tdd-workflow.md
```

## Integration with VS Code

The command system integrates seamlessly with VS Code:
- Commands appear in file explorer
- Syntax highlighting for markdown
- Quick navigation with Cmd/Ctrl+Click
- IntelliSense for `@include:` paths (when configured)

## Summary

The Claude command system bridges the gap between reusable prompts and instant availability. Whether you're invoking commands with `/`, referencing them with `@-/`, or browsing them in the `-` folder, the system ensures your AI workflows are efficient and consistent.