# VS Code Tasks Guide for Claude Code

## Overview

VS Code tasks allow automation of development workflows through configuration in `.vscode/tasks.json`. While VS Code provides powerful task automation capabilities, **Claude Code cannot directly invoke VS Code tasks from the command line** due to VS Code's architecture limitations.

## Current Limitations

### No CLI Task Execution
- VS Code does not support running tasks via the `code` command (Feature request [#112594](https://github.com/microsoft/vscode/issues/112594) marked as out-of-scope)
- Tasks can only be executed from within VS Code's interface (Command Palette: `Tasks: Run Task`)
- Claude Code operates in the terminal and cannot trigger VS Code's internal task system

## Task Configuration Basics

### Essential Properties
```json
{
  "version": "2.0.0",
  "tasks": [{
    "label": "Task Name",           // Display name in VS Code
    "type": "shell",                // shell | process
    "command": "npm",               // Command to execute
    "args": ["run", "build"],       // Arguments array
    "group": "build",               // Task grouping
    "problemMatcher": "$tsc",       // Error/warning detection
    "presentation": {               // Output display options
      "reveal": "always",
      "panel": "new",
      "focus": true
    }
  }]
}
```

### Input Variables
Tasks support dynamic inputs via `${input:variableID}`:
```json
{
  "tasks": [{
    "label": "Run specific tests",
    "command": "pytest",
    "args": ["${input:testPattern}"]
  }],
  "inputs": [{
    "id": "testPattern",
    "type": "promptString",
    "description": "Test pattern to run",
    "default": "test_*.py"
  }]
}
```

### Variable Substitution
Available in `command`, `args`, and `options`:
- `${workspaceFolder}` - Root folder path
- `${file}` - Current file path
- `${fileBasename}` - Current filename
- `${env:VARIABLE}` - Environment variables
- `${input:inputId}` - User inputs

## Recommended Patterns for Claude Code

### 1. Direct Command Execution
Instead of relying on VS Code tasks, Claude Code should execute commands directly:
```bash
# Instead of: code --run-task "build" (not supported)
# Use: npm run build
```

### 2. Task Discovery
Claude Code can read `tasks.json` to understand available workflows:
```typescript
// Read tasks.json to identify available commands
const tasksConfig = JSON.parse(fs.readFileSync('.vscode/tasks.json', 'utf8'));
const availableTasks = tasksConfig.tasks.map(t => ({
  label: t.label,
  command: `${t.command} ${t.args?.join(' ') || ''}`
}));
```

### 3. Workflow Automation
For complex workflows, create shell scripts that mirror VS Code tasks:
```bash
#!/bin/bash
# scripts/build-and-test.sh
npm run build && npm test
```

### 4. IDE Integration
When Claude Code is running in VS Code's integrated terminal:
- Use `/ide` command to connect to the IDE
- Claude Code can read and edit files, which triggers VS Code's file watchers
- Problem matchers and diagnostics remain active in VS Code

## Best Practices

1. **Document Task Purpose**: Include `detail` property explaining each task
2. **Use Problem Matchers**: Enable error detection with appropriate matchers
3. **Leverage Groups**: Organize tasks into build/test/other categories
4. **Keep Commands Simple**: Complex logic belongs in scripts, not tasks.json
5. **Version Control**: Always commit tasks.json for team consistency

## Example: Handover Task
```json
{
  "label": "Claude",
  "type": "shell",
  "command": "claude 'Check for handover file and run if exists'",
  "presentation": {
    "reveal": "always",
    "panel": "new",
    "focus": true
  },
  "runOptions": {
    "runOn": "folderOpen"  // Auto-run when workspace opens
  }
}
```

## Future Considerations

While direct task invocation remains unavailable, Claude Code can:
- Parse `tasks.json` to understand project workflows
- Execute equivalent commands directly in the terminal
- Suggest task configurations based on project structure
- Integrate with VS Code through the IDE connection for file operations

For the most effective Claude Code experience, maintain both `tasks.json` for VS Code users and equivalent direct commands documented in project README or CLAUDE.md files.