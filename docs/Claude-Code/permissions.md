# Claude Code Permissions Guide

This guide covers how to configure permissions for Claude Code using settings files and wildcard patterns.

## Overview

Claude Code uses a permission system to control what actions it can perform. Permissions are configured in JSON settings files and support gitignore-style wildcard patterns.

## Settings Files

### File Locations and Precedence

Permissions can be configured at multiple levels (from highest to lowest precedence):

1. **Enterprise policies** - System-managed policy files
2. **Command line arguments** - Runtime overrides
3. **Local project settings** - `.claude/settings.local.json` (not in version control)
4. **Shared project settings** - `.claude/settings.json` (checked into version control)
5. **User settings** - `~/.claude/settings.json`

### Basic Structure

```json
{
  "permissions": {
    "allow": [
      // Permitted actions
    ],
    "deny": [
      // Blocked actions
    ]
  }
}
```

## Permission Syntax

### Basic Command Permissions

```json
"Bash(command)"          // Exact command only, no arguments
"Bash(command:*)"        // Command with any arguments
```

**Important:** If you want to allow a command with arguments, you must use `:*`. Without it, only the exact command with no arguments is allowed.

### Examples

```json
// Without :* - Only allows exact command
"Bash(touch)"            // ❌ touch file.txt (blocked)
                         // ✅ touch (allowed, but not useful)

// With :* - Allows command with arguments  
"Bash(touch:*)"          // ✅ touch file.txt
                         // ✅ touch -a file.txt
                         // ✅ touch file1.txt file2.txt
```

## Wildcard Patterns

Claude Code supports gitignore-style wildcard patterns for both file paths and commands.

### File Path Wildcards

| Pattern | Description | Example |
|---------|-------------|---------|
| `*` | Matches any characters (single level) | `*.js` matches any JS file |
| `**` | Matches any directories recursively | `src/**/*.ts` matches TS files in src tree |
| `?` | Matches single character | `file?.txt` matches file1.txt, fileA.txt |
| `[...]` | Matches character range | `test[0-9].js` matches test0.js through test9.js |
| `{...}` | Matches any of the options | `*.{ts,tsx}` matches .ts or .tsx files |
| `!` | Negation (exclude pattern) | `!**/*.spec.ts` excludes spec files |

### Command Wildcard Examples

```json
// Git commands
"Bash(git:*)"                    // All git commands with any args
"Bash(git add:*)"                // Only git add with any args
"Bash(git log:* --oneline)"      // git log with args plus --oneline

// NPM scripts
"Bash(npm run:*)"                // Any npm run command
"Bash(npm run test:*)"           // npm run test:unit, test:e2e, etc.
"Bash(npm run lint:* --fix)"     // Lint commands with --fix

// Script files
"Bash(./scripts/*.sh:*)"         // Any .sh in scripts/ with args
"Bash(./src/scripts/**/*.sh:*)"  // Any .sh in src/scripts tree
```

### File Access Patterns

```json
// Read permissions
"Read(*.json)"                   // Any JSON in current dir
"Read(src/**/*.ts)"              // Any TS file in src tree
"Read(config/*.{json,yaml})"     // JSON or YAML in config/
"Read(!**/node_modules/**)"      // Exclude node_modules

// Edit permissions
"Edit(src/**/*.tsx)"             // Edit any TSX in src tree
"Edit(!**/*.spec.ts)"            // Edit anything except specs

// Directory access
"Read(~/www/claude-github-apm/)" // Specific directory
"Read(../sibling-dir/**)"        // Sibling directory access
```

## Common Patterns and Use Cases

### Development Workflow

```json
{
  "permissions": {
    "allow": [
      // Version control - all operations
      "Bash(git:*)",
      "Bash(gh:*)",
      
      // Package management
      "Bash(pnpm install)",
      "Bash(pnpm add:*)",
      "Bash(pnpm remove:*)",
      "Bash(pnpm run:*)",
      
      // Testing
      "Bash(npm run test:*)",
      "Bash(jest:*)",
      
      // File operations
      "Read(src/**/*.{ts,tsx,js,jsx})",
      "Edit(src/**/*.{ts,tsx,js,jsx})",
      "Read(*.{json,md,yml,yaml})",
      
      // Scripts
      "Bash(./scripts/**/*.sh:*)",
      "Bash(node:*)",
      
      // Build tools
      "Bash(npm run build:*)",
      "Bash(tsc:*)",
      "Bash(webpack:*)"
    ]
  }
}
```

### Restricted Environment

```json
{
  "permissions": {
    "allow": [
      // Limited git access
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      
      // Read-only file access
      "Read(src/**/*)",
      
      // Specific scripts only
      "Bash(npm test)",
      "Bash(npm run lint)"
    ],
    "deny": [
      // No network operations
      "Bash(curl:*)",
      "Bash(wget:*)",
      
      // No file modifications
      "Edit(**/*)",
      "Write(**/*)"
    ]
  }
}
```

## Additional Directory Access

To grant access to directories outside the current working directory:

### Via Settings File

```json
{
  "additionalDirectories": [
    "../sibling-project/",
    "../../parent-directory/",
    "/absolute/path/to/directory/"
  ]
}
```

### Via Command Line

```bash
claude-code --add-dir ../other-project
```

### Via Slash Command

Within Claude Code:
```
/add-dir ../other-project
```

## Common Issues and Solutions

### Critical Limitation: Claude Cannot See Permission Prompts

**Important:** Claude Code instances are unaware when permission dialogs appear. This fundamental limitation means:

1. **False Success Reports**: When Claude runs a command and sees output, it assumes success - even if you were prompted for permission first
2. **Ineffective Testing**: Claude cannot test whether permission configurations work because it can't see the prompts
3. **Manual Verification Required**: You must visually check for permission dialogs when testing configurations
4. **Misleading Workarounds**: Claude may suggest a "working" solution that still triggers permission prompts

This explains why permission issues persist despite Claude's attempts to fix them - Claude literally cannot see the problem occurring.

### Critical: Permission Changes Require New Claude Code Instance

**Important Discovery:** Permission changes in settings files (both `.claude/settings.json` and `.claude/settings.local.json`) do NOT take effect in the current Claude Code instance.

**Required Steps After Modifying Permissions:**
1. Save your permission changes to the settings files
2. Exit the current Claude Code session
3. Start a new Claude Code instance
4. Only then will the new permissions be active

**This means:**
- Testing permission fixes requires restarting Claude Code each time
- You cannot dynamically update permissions during a session
- Even sub-agents in the same session inherit the original permissions
- The `/permissions` command shows current session permissions, not what's in the files

### Issue: Command Requires Arguments

**Problem:** `"Bash(npm install)"` doesn't allow `npm install express`

**Solution:** Use `"Bash(npm install:*)"` to allow arguments

### Issue: Scripts Not Executing

**Problem:** `"Bash(./scripts/*.sh)"` doesn't work

**Solution:** 
1. Add `:*` for arguments: `"Bash(./scripts/*.sh:*)"`
2. Ensure path starts with `./` or `/`
3. Check file exists and has execute permissions

### Issue: Repeated Permission Requests

**Known Bug:** Claude Code may repeatedly ask for permissions even when granted (GitHub issue #2560)

**Critical Discovery:** Claude Code instances are not aware when permission dialogs appear. When Claude executes a command and reports success, it doesn't know if you were prompted for permission. This means:
- Claude cannot tell if its permission configurations are working
- Claude may incorrectly report that a workaround succeeded
- You must visually verify whether permission prompts appear

**Workarounds:**
1. Use broader permissions: `"Bash(git:*)"` instead of individual git commands
2. Check for syntax errors (missing parentheses, wrong wildcards)
3. Ensure settings files are valid JSON
4. **Important**: Complex glob patterns like `"Bash(./src/scripts/**/*.sh:*)"` may not work as expected

### Issue: Path Patterns Not Matching

**Problem:** `**/src/scripts/**/*.sh` doesn't work for Bash permissions

**Solution:** Start paths with `./` or `/`:
- ✅ `"Bash(./src/scripts/**/*.sh:*)"`
- ❌ `"Bash(**/src/scripts/**/*.sh:*)"`

## Security Best Practices

1. **Principle of Least Privilege**: Grant only necessary permissions
2. **Use Deny Rules**: Explicitly block dangerous operations
3. **Review Regularly**: Audit permissions periodically
4. **Version Control**: Track changes to shared settings.json
5. **Local Overrides**: Use settings.local.json for personal preferences

## References

- [Claude Code Settings Documentation](https://docs.anthropic.com/en/docs/claude-code/settings)
- [Claude Code IAM Documentation](https://docs.anthropic.com/en/docs/claude-code/iam)
- [GitHub Issues - Permission Problems](https://github.com/anthropics/claude-code/issues)

## Examples from This Project

### settings.json (Shared)
```json
{
  "permissions": {
    "allow": [
      "Read(~/www/claude-github-apm/)",
      
      "Bash(Notify_Jake)",
      
      "Bash(git:*)",
      "Bash(gh:*)",
      
      "Bash(pnpm:*)",
      "Bash(npm run:*)",
      
      "Bash(node:*)",
      
      "Bash(mkdir:*)",
      "Bash(rm:*)",
      "Bash(mv:*)",
      "Bash(cp:*)",
      
      "WebFetch(domain:docs.anthropic.com)",
      "WebFetch(domain:github.com)"
    ]
  }
}
```

### settings.local.json (Personal)
```json
{
  "permissions": {
    "allow": [
      "Bash(git fetch:*)",
      "Bash(gh pr create:*)",
      "Bash(./src/scripts/**/*.sh:*)"
    ]
  }
}
```