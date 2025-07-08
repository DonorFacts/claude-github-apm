# Claude Code Hooks Validation Architecture

## Overview

This document describes our automated validation system that uses Claude Code hooks to validate prompt command execution. The system ensures agents properly follow prompt instructions by running validation scripts automatically and providing feedback for remediation.

## Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ PostToolUse     │    │ Validation       │    │ Stop Hook           │
│ Hook            │───▶│ Mappings         │───▶│ Validation Runner   │
│ (Detection)     │    │ (Configuration)  │    │ (Execution)         │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ Read Tool       │    │ Prompt Key →     │    │ Agent Feedback      │
│ Result Parsing  │    │ Validation Script│    │ via JSON Response   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### Flow Sequence

1. **Agent reads prompt** → PostToolUse hook detects via `$CLAUDE_TOOL_RESULT`
2. **Mapping lookup** → Finds corresponding validation script
3. **State persistence** → Saves validation script path to session environment
4. **Agent completes work** → Stop hook executes when agent tries to finish
5. **Validation execution** → Runs validation script and collects results
6. **Agent feedback** → Uses JSON response to block/continue with feedback

## File Structure

```
src/
├── scripts/
│   ├── hooks/
│   │   ├── validation-mappings.json      # Prompt → validation script mapping
│   │   ├── detect-validation-needed.ts   # PostToolUse hook detection
│   │   └── run-pending-validations.ts    # Stop hook validation runner
│   ├── git-worktree/
│   │   └── validate-worktree.ts          # Git worktree validation script
│   └── jokes/
│       └── validate-joke.ts              # Joke creation validation script
├── prompts/
│   ├── git/worktrees/create.md           # Git worktree prompt
│   └── joke.md                           # Joke generation prompt
└── .claude/
    └── settings.json                     # Hook configuration
    
tmp/
└── validation/
    ├── hooks/                            # Hook execution logs
    │   └── *-detection.json              # Detection results
    ├── queue/                            # Pending validations
    │   └── *-{prompt}.json               # Queued validation files
    └── last-read-files.json              # Tracking for sub-agent workaround
```

## Configuration

### 1. Hook Registration (`.claude/settings.json`)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          {
            "type": "command",
            "command": "cd /workspace/main && tsx src/scripts/hooks/detect-validation-needed.ts"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "cd /workspace/main && tsx src/scripts/hooks/run-pending-validations.ts"
          }
        ]
      }
    ]
  }
}
```

### 2. Validation Mappings (`src/scripts/hooks/validation-mappings.json`)

```json
{
  "validationMappings": {
    "git/worktrees/create": "src/scripts/git-worktree/validate-worktree.ts",
    "joke": "src/scripts/jokes/validate-joke.ts"
  }
}
```

**Key Design Decision**: Mappings use simplified keys relative to `src/prompts/` (e.g., `"joke"` maps to `src/prompts/joke.md`). The detection script automatically handles all three access patterns:

- `src/prompts/joke.md` (original)
- `.claude/commands/joke.md` (slash commands)  
- `-/joke.md` (root mirror)

## Detection Script (`detect-validation-needed.ts`)

### Purpose
Detects when agents read prompt files that have associated validation scripts.

### Key Logic
```typescript
// Generate all possible access patterns for a prompt
const commandsName = promptKey.replace(/\//g, '-'); 
const possiblePaths = [
  `src/prompts/${promptKey}.md`,           // Original
  `.claude/commands/${commandsName}.md`,   // Commands  
  `-/${commandsName}.md`                   // Mirror
];

// Check if any path appears in tool result
const matchedPath = possiblePaths.find(path => toolResult.includes(path));
```

### State Management
Uses file-based queue system instead of environment variables:
```typescript
// Queue validation in a file
const queuedValidation: QueuedValidation = {
  timestamp: new Date().toISOString(),
  matchedPath,
  validationScript,
  agentType: 'main' | 'sub'
};

const queueFile = join(queueDir, `${timestamp}-${promptKey}.json`);
writeFileSync(queueFile, JSON.stringify(queuedValidation, null, 2));
```

### Known Limitation
- `CLAUDE_TOOL_RESULT` environment variable is not currently passed to hooks
- The system tracks read files and uses a file-based queue as a workaround
- Sub-agent detection relies on artifact presence rather than direct tool result

## Validation Runner (`run-pending-validations.ts`)

### Purpose
Executes pending validation scripts when agents try to complete their work.

### JSON Response Control
Uses Claude Code hook JSON response fields to control agent behavior:

```typescript
interface HookResponse {
  continue: boolean;        // Whether Claude should continue
  stopReason?: string;      // Message when continue=false  
  suppressOutput?: boolean; // Hide stdout from transcript
}
```

### Success Path
```typescript
const response: HookResponse = {
  continue: true,
  suppressOutput: true  // Don't clutter transcript
};
console.log(JSON.stringify(response));
process.exit(0);
```

### Failure Path
```typescript
console.error('❌ Validation failed! Issues found:');
console.error(validationOutput);  // Show validation results

const response: HookResponse = {
  continue: false,
  stopReason: "Validation failed. Please review and remediate the issues above.",
  suppressOutput: true
};
console.log(JSON.stringify(response));
process.exit(2);  // Block completion
```

## Creating Validation Scripts

### 1. Write the Validation Script

Create in `src/scripts/<domain>/validate-<feature>.ts`:

```typescript
#!/usr/bin/env tsx

class FeatureValidator {
  private results: ValidationResult[] = [];

  private addResult(criterion: string, passed: boolean, message: string, details?: string): void {
    this.results.push({ criterion, passed, message, details });
  }

  private validateRequirement(): void {
    // Your validation logic here
    const passed = /* check requirement */;
    this.addResult('Requirement Name', passed, 'Status message', 'Optional details');
  }

  public async validateAll(): Promise<boolean> {
    console.log(chalk.blue('🔍 Validating feature...'));
    
    this.validateRequirement();
    // Add more validations...

    // Display results
    let allPassed = true;
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? chalk.green : chalk.red;
      console.log(`${icon} ${color(result.criterion)}: ${result.message}`);
      if (result.details) console.log(chalk.gray(`   ${result.details}`));
      if (!result.passed) allPassed = false;
    }

    return allPassed;
  }
}

async function main(): Promise<void> {
  const validator = new FeatureValidator();
  const allPassed = await validator.validateAll();
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}
```

### 2. Register the Mapping

Add to `src/scripts/hooks/validation-mappings.json`:

```json
{
  "validationMappings": {
    "existing/prompt": "existing/validation/script.ts",
    "your-new-prompt": "src/scripts/your-domain/validate-your-feature.ts"
  }
}
```

### 3. Make Script Executable

```bash
chmod +x src/scripts/your-domain/validate-your-feature.ts
```

## Best Practices

### Validation Script Design

1. **Keep validations simple** - Focus on core requirements, not detailed format checking
2. **Fast execution** - Validations run synchronously and block agent completion
3. **Clear messaging** - Provide actionable feedback for remediation
4. **Graceful failures** - Handle errors without breaking the hook system

### Example: Simple File Existence Check
```typescript
private validateFileCreated(): void {
  const expectedFile = './output/expected-file.txt';
  const exists = existsSync(expectedFile);
  
  this.addResult(
    'Output File Created',
    exists,
    exists ? `File created: ${expectedFile}` : `File not found: ${expectedFile}`,
    exists ? undefined : 'Check if the creation step completed successfully'
  );
}
```

### Prompt Design Considerations

1. **Clear deliverables** - Specify exactly what files/actions should be created
2. **Verifiable outcomes** - Design prompts with easily validatable results
3. **Reasonable timing** - Consider hook execution timing in validation windows

## Testing

### Manual Testing
```bash
# Test detection
CLAUDE_TOOL_RESULT="src/prompts/your-prompt.md" tsx src/scripts/hooks/detect-validation-needed.ts

# Test validation directly  
tsx src/scripts/your-domain/validate-your-feature.ts

# Test full hook chain by reading the prompt
```

### Integration Testing
The hooks integrate automatically when agents read mapped prompt files. Test by:

1. Having an agent read a mapped prompt file
2. Agent performs the prompt instructions
3. Agent tries to complete → validation runs automatically
4. Check for appropriate success/failure behavior

## Troubleshooting

### Common Issues

**Hook not triggering**
- Check `.claude/settings.json` syntax
- Verify script paths are correct
- Ensure scripts are executable (`chmod +x`)

**Validation not found**
- Check mapping exists in `validation-mappings.json`
- Verify prompt key matches (no `.md` extension)
- Test path generation logic manually

**Validation always fails**
- Run validation script manually to debug
- Check file paths and timing windows
- Verify expected outputs match actual outputs

**Agent gets stuck**
- Check hook script error handling
- Ensure graceful fallback to `continue: true`
- Review hook execution logs

**CLAUDE_TOOL_RESULT not available**
- Currently, `CLAUDE_TOOL_RESULT` environment variable is not being passed to hooks in some Claude Code versions
- The system uses a file-based queue (`tmp/validation/queue/`) as a workaround
- For testing, you can simulate: `CLAUDE_TOOL_RESULT="src/prompts/joke.md" tsx src/scripts/hooks/detect-validation-needed.ts`

### Debugging Commands
```bash
# Check hook configuration
cat .claude/settings.json | jq '.hooks'

# List validation mappings  
cat src/scripts/hooks/validation-mappings.json | jq '.validationMappings'

# Check session environment
cat /tmp/claude-session-env 2>/dev/null || echo "No session env"

# Test validation script
tsx src/scripts/path/to/validate-script.ts
```

## Future Enhancements

### Planned Improvements

1. **Validation Templates** - Standardized templates for common validation patterns
2. **Configuration Validation** - Validate mappings and hook config on startup  
3. **Metrics Collection** - Track validation success/failure rates
4. **Parallel Validations** - Support multiple validations for complex prompts
5. **Custom Timing Windows** - Per-validation timing configuration

### Extension Points

- **Custom Validators** - Plugin system for domain-specific validation logic
- **Notification Integration** - Send validation results to external systems
- **Report Generation** - Detailed validation reports for analysis
- **Integration Testing** - Automated testing of prompt → validation chains

## Contributing

When adding new prompt validations:

1. Create validation script following the established patterns
2. Add mapping to `validation-mappings.json`  
3. Test manually and via integration
4. Update this documentation if needed
5. Consider adding to the test suite

For questions or issues with the validation system, refer to the hook scripts in `src/scripts/hooks/` or create an issue with the `hooks` label.