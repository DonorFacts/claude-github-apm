# Claude Code Hooks: Real-World Implementation Guide

## Overview

This document captures hard-learned lessons from implementing Claude Code PreToolUse hooks for session management and transcript access. It covers the gotchas, debugging techniques, and architectural insights discovered through practical implementation.

## Critical Discovery: Restart Requirement

**🚨 MOST IMPORTANT LESSON**: Claude Code hook configuration changes **require restarting and resuming the Claude Code instance** to take effect.

```bash
# After modifying .claude/settings.json:
# 1. Exit current Claude Code session (Ctrl+C)
# 2. Restart: claude --resume
# 3. Hooks will now use new configuration
```

**Why This Matters**: We spent significant time debugging "broken" hooks that were actually working perfectly - we just hadn't restarted Claude Code after configuration changes.

## Hook Input Architecture

### How Hooks Actually Receive Data

**❌ WRONG**: Reading command line arguments
```typescript
const input = process.argv[2]; // This doesn't work
```

**✅ CORRECT**: Reading from stdin
```typescript
// TypeScript approach
const input = fs.readFileSync(0, 'utf-8');
const hookInput = JSON.parse(input);

// Python approach (from working examples)
import json
import sys
hook_input = json.load(sys.stdin)
```

### Hook Input Structure

```typescript
interface HookInput {
  session_id: string;                    // Current session identifier
  transcript_path: string;               // Full path to .jsonl transcript
  hook_event_name: "PreToolUse";        // Hook type
  tool_name: string;                     // Tool being called (e.g., "Read", "Bash")
  tool_input: {                         // Tool-specific parameters
    file_path?: string;                  // For Read/Write tools
    command?: string;                    // For Bash tool
    description?: string;                // Tool description
    // ... other tool-specific fields
  };
}
```

## Parent vs Subagent Sessions: The Hidden Complexity

### The Discovery

We discovered that Claude Code creates **separate sessions for subagents** spawned via `claude -p "run src/prompts/..."` commands. This fundamentally changes how you interpret hook data.

### Session Characteristics

| Aspect | Parent Session | Subagent Session |
|--------|----------------|------------------|
| **File Size** | Large (100KB+) | Small (<50KB) |
| **Duration** | Long-running | Short-lived |
| **Content Structure** | `content: [{ type: "text", text: "..." }]` | `content: "simple string"` |
| **Typical First Message** | Complex user request | `"run src/prompts/..."` |
| **Session ID** | Stable during conversation | Unique per subagent |

### Detection Script

```typescript
// src/scripts/session/is-sub-agent.ts
function isSubAgent(transcriptPath: string): boolean {
  const content = fs.readFileSync(transcriptPath, 'utf8');
  const firstUserMessage = findFirstUserMessage(content);
  
  // Primary indicator: content structure
  const isSimpleString = typeof firstUserMessage.message.content === 'string';
  
  // Secondary indicator: subagent patterns
  const hasSubagentPattern = firstUserMessage.message.content.includes('run src/prompts/');
  
  return isSimpleString && hasSubagentPattern;
}
```

## Session Management Strategies

### Problem: "Current Session" Ambiguity

When hooks capture session data, they might capture subagent sessions instead of the main conversation you care about.

### Solution: Dual Approach

1. **For Main Conversation**: Use file system approach (largest/most recent file)
2. **For Hook Validation**: Track what hooks actually capture

```typescript
// Get current main conversation
function getCurrentMainSession(): string {
  const transcriptsDir = '/home/user/.claude/projects/-workspace-main';
  const files = fs.readdirSync(transcriptsDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      path: join(transcriptsDir, f),
      size: fs.statSync(join(transcriptsDir, f)).size,
      mtime: fs.statSync(join(transcriptsDir, f)).mtime
    }))
    .sort((a, b) => b.size - a.size); // Largest first (main conversation)
  
  return files[0]?.path;
}

// Get hook-captured session (might be subagent)
function getHookCapturedSession(): string {
  // Read from .claude/conversations/<session-id>/conversation.json
  // This reflects what hooks actually captured
}
```

## Host-Bridge Integration

### Container-to-Host Communication

Our use case required opening transcripts in VS Code on the host from within the container.

```typescript
import { hostBridge } from '../../integrations/docker/host-bridge/container';

async function openTranscriptOnHost(transcriptPath: string) {
  // Convert container path to host path
  const hostPath = transcriptPath.replace('/home/user/.claude/', '~/.claude/');
  
  // Try tilde expansion first
  let success = await hostBridge.vscode_open(hostPath);
  
  if (!success) {
    // Fallback to absolute path
    const absolutePath = transcriptPath.replace(
      '/home/user/.claude/', 
      '/Users/jakedetels/.claude/'
    );
    success = await hostBridge.vscode_open(absolutePath);
  }
  
  return success;
}
```

## Debugging Techniques

### Hook Debug Logging

```typescript
// In your hook script
const debugDir = 'tmp/hook-debug';
mkdirSync(debugDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const debugData = {
  timestamp: new Date().toISOString(),
  hookInput: inputData,
  env: Object.entries(process.env)
    .filter(([key]) => key.includes('CLAUDE'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
};

writeFileSync(join(debugDir, `${timestamp}-debug.json`), JSON.stringify(debugData, null, 2));
```

### Verification Commands

```bash
# Check if hooks are firing
ls -la tmp/hook-debug/

# Check latest hook input
cat tmp/hook-debug/$(ls -t tmp/hook-debug/ | head -1)

# Verify session capture
ls -la .claude/conversations/

# Test hook manually
echo '{"session_id":"test","transcript_path":"/test.jsonl","tool_name":"Read"}' | tsx src/scripts/hooks/your-hook.ts
```

## Error Handling Best Practices

### Graceful Degradation

```typescript
function hookMain() {
  try {
    const hookInput = parseHookInput();
    processHookData(hookInput);
  } catch (error) {
    // Log error but don't break tool execution
    console.error('Hook error:', error);
    
    const debugFile = `tmp/hook-debug/${Date.now()}-error.json`;
    writeFileSync(debugFile, JSON.stringify({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, null, 2));
  }
  
  // ALWAYS exit 0 to approve tool use
  process.exit(0);
}
```

### Exit Code Meanings

- `0`: Success, approve tool execution
- `2`: Block tool execution (dangerous operation detected)
- Other: Generally treated as error, may block execution

## Performance Considerations

### Hook Execution Speed

Hooks run synchronously before tool execution. Keep them fast:

```typescript
// ❌ SLOW: Reading large files
const content = fs.readFileSync(largePath, 'utf8');
const analysis = expensiveAnalysis(content);

// ✅ FAST: Quick checks only
const stats = fs.statSync(path);
const isLarge = stats.size > 1000000;
```

### Async Operations

```typescript
// For fire-and-forget operations
function backgroundLogging(data: any) {
  setImmediate(() => {
    // Log asynchronously after hook completes
    writeFileSync(logFile, JSON.stringify(data));
  });
}
```

## Architecture Patterns

### Hook Composition

```typescript
// Base hook functionality
abstract class BaseHook {
  abstract handle(input: HookInput): void;
  
  protected log(message: string) {
    // Centralized logging
  }
  
  protected shouldSkip(input: HookInput): boolean {
    // Common skip conditions
    return input.tool_name === 'SpecialTool';
  }
}

// Specific implementations
class SessionCaptureHook extends BaseHook {
  handle(input: HookInput) {
    if (this.shouldSkip(input)) return;
    
    this.captureSessionData(input);
  }
}
```

### Configuration Management

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",  // Empty matcher works better than "*"
        "hooks": [
          {
            "type": "command",
            "command": "cd /workspace/main && tsx src/scripts/hooks/main-hook.ts"
          }
        ]
      }
    ]
  }
}
```

## Common Pitfalls and Solutions

### 1. Hook Not Firing
- **Cause**: Forgot to restart Claude Code after config change
- **Solution**: Always restart after modifying `.claude/settings.json`

### 2. Wrong Session Data
- **Cause**: Hook captured subagent instead of parent session
- **Solution**: Use file system approach for "current session"

### 3. Path Translation Issues
- **Cause**: Container paths don't work on host
- **Solution**: Convert `/home/user/.claude/` to `~/.claude/` or absolute paths

### 4. JSON Parsing Errors
- **Cause**: Malformed hook input or wrong reading method
- **Solution**: Use stdin reading with proper error handling

### 5. Hook Blocks Tool Execution
- **Cause**: Hook script exits with non-zero code
- **Solution**: Always `process.exit(0)` unless intentionally blocking

## Testing Strategy

### Unit Testing Hooks

```typescript
// Test hook logic separately from Claude Code
describe('SessionCaptureHook', () => {
  it('should capture parent session data', () => {
    const mockInput: HookInput = {
      session_id: 'test-123',
      transcript_path: '/test/path.jsonl',
      tool_name: 'Read',
      tool_input: { file_path: '/test.txt' }
    };
    
    const result = captureSessionData(mockInput);
    expect(result.sessionId).toBe('test-123');
  });
});
```

### Integration Testing

```bash
# Test with real Claude Code commands
claude -p "ls" # Should trigger hook
cat tmp/hook-debug/latest.json # Verify hook received data
```

## Future Considerations

### Scalability
- Consider hook performance impact as project grows
- Implement hook disable flags for debugging
- Use hook matchers to target specific tools only

### Monitoring
- Track hook execution frequency
- Monitor hook error rates
- Alert on hook failures that might affect functionality

### Security
- Validate all hook inputs
- Sanitize paths and commands
- Never trust hook input data completely

## Summary

Claude Code hooks are powerful but have subtle behaviors around session management and subagent interactions. The key lessons:

1. **Always restart Claude Code** after hook configuration changes
2. **Read from stdin**, not command line arguments
3. **Understand parent vs subagent sessions** for proper session management
4. **Use file system approaches** for reliable "current session" detection
5. **Debug with comprehensive logging** to understand hook behavior
6. **Handle errors gracefully** to avoid breaking tool execution

These insights transform hooks from mysterious debugging nightmares into reliable, predictable automation tools.