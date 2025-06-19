# Claude Code SDK Research

## Executive Summary

The Claude Code SDK provides programmatic access to Claude Code capabilities but does not include built-in session monitoring or event listening features. However, Claude Code generates detailed JSONL logs that can be monitored for implementing our session lifecycle management system.

## Claude Code SDK Overview

### Official SDK
- **Package**: `@anthropic-ai/claude-code`
- **Languages**: TypeScript, Python, CLI
- **Installation**: `npm install @anthropic-ai/claude-code`

### Core Capabilities
```typescript
import { query } from "@anthropic-ai/claude-code";

const messages = [];
for await (const message of query({
  prompt: "Write a haiku about foo.py",
  options: { maxTurns: 3 }
})) {
  messages.push(message);
}
```

### SDK Configuration Options
```typescript
query({
  prompt: string,
  abortController: AbortController,
  options: {
    maxTurns: number,
    cwd?: string,
    executable?: 'node' | 'bun',
    executableArgs?: string[]
  }
})
```

## Session Logs Structure

### Location
Claude Code stores session logs in:
```
~/.claude/projects/<project-path-hash>/<session-id>.jsonl
```

### JSONL Format
Each line is a JSON object representing different event types:

```json
// Summary entry
{"type":"summary","summary":"Terminal Tab Naming for Agent Initialization","leafUuid":"5abfa185-a3a2-4e92-a93a-760c66ed9fa0"}

// User message
{
  "type": "user",
  "uuid": "6bc2e122-6e0a-4c47-a1bf-f4e3f46942a0",
  "parentUuid": null,
  "timestamp": "2025-06-18T20:50:30.281Z",
  "sessionId": "d1ba1f60-f36d-48cc-ad4f-3af5446b2c93",
  "cwd": "/Users/jakedetels/www/claude-github-apm",
  "message": {
    "role": "user",
    "content": "@src/prompts/agents/prompt-engineer/init.md"
  }
}

// Assistant response with tool use
{
  "type": "assistant",
  "uuid": "8c2317b6-f63c-4c27-8643-e72b47e502f1",
  "parentUuid": "1f5444a1-3f13-4c4b-b5eb-130f73700984",
  "timestamp": "2025-06-18T20:50:38.447Z",
  "message": {
    "role": "assistant",
    "content": [{
      "type": "tool_use",
      "id": "toolu_018FPDFUqWQwpJcX5bisfVcA",
      "name": "Task",
      "input": {"description": "Analyze prompt structure", "prompt": "..."}
    }]
  }
}
```

### Key Fields
- `type`: Event type (user, assistant, summary)
- `uuid`: Unique message identifier
- `parentUuid`: Links conversation flow
- `timestamp`: ISO timestamp
- `sessionId`: Session identifier
- `isSidechain`: Indicates tool use chains
- `message`: Actual content

## Streaming Capabilities

### Stream JSON Output
```bash
claude -p "Build a React component" --output-format stream-json
```

Outputs real-time JSON events:
```json
{
  "type": "system",
  "subtype": "init",
  "session_id": "a458d2ce-2fa5-4fbe-b550-336a32858c37",
  "tools": ["Task", "Bash", "Glob", "Grep", ...],
  "model": "claude-sonnet-4-20250514"
}
```

### Streaming Benefits
- Real-time event processing
- Session ID provided immediately
- Tool usage tracked
- Error handling support

## Monitoring Options

### 1. OpenTelemetry Integration
Claude Code supports OTEL metrics and events:
```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### 2. File Watching Approach
No built-in file watching API, but we can:
- Monitor `~/.claude/projects/` for new JSONL files
- Watch existing files for appended lines
- Parse events as they're written

### 3. Stream Processing
Using `--output-format stream-json`:
- Capture events in real-time
- Process without file watching delays
- Direct integration with TypeScript

## Proposed TypeScript Solution

### Architecture
```typescript
// src/monitors/session-monitor.ts
import { FSWatcher, watch } from 'fs';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';

export class ClaudeSessionMonitor extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private sessionManifests: Map<string, SessionManifest> = new Map();
  
  constructor(private projectPath: string) {
    super();
    this.initializeMonitoring();
  }
  
  private async initializeMonitoring() {
    // 1. Find Claude projects directory
    const claudeProjectDir = this.getClaudeProjectDir();
    
    // 2. Watch for new session files
    this.watchForNewSessions(claudeProjectDir);
    
    // 3. Monitor existing sessions
    this.monitorExistingSessions(claudeProjectDir);
  }
  
  private getClaudeProjectDir(): string {
    // Convert project path to Claude's hash format
    const projectHash = this.projectPath.replace(/\//g, '-');
    return `${process.env.HOME}/.claude/projects/${projectHash}`;
  }
  
  private watchForNewSessions(dir: string) {
    const watcher = watch(dir, (eventType, filename) => {
      if (filename?.endsWith('.jsonl')) {
        this.emit('session:start', { 
          sessionId: filename.replace('.jsonl', ''),
          timestamp: new Date()
        });
        this.monitorSession(`${dir}/${filename}`);
      }
    });
    this.watchers.set('directory', watcher);
  }
  
  private monitorSession(filePath: string) {
    // Read new lines as they're appended
    const stream = createReadStream(filePath, { 
      encoding: 'utf8',
      start: 0 
    });
    
    const rl = createInterface({ input: stream });
    
    rl.on('line', (line) => {
      try {
        const event = JSON.parse(line);
        this.processEvent(event);
      } catch (e) {
        // Skip invalid JSON lines
      }
    });
  }
  
  private processEvent(event: any) {
    // Emit different event types
    switch (event.type) {
      case 'user':
        this.emit('message:user', event);
        this.updateActivity(event.sessionId);
        break;
        
      case 'assistant':
        this.emit('message:assistant', event);
        if (event.message?.content?.[0]?.type === 'tool_use') {
          this.emit('tool:use', {
            tool: event.message.content[0].name,
            timestamp: event.timestamp
          });
        }
        break;
        
      case 'summary':
        this.emit('session:summary', event);
        break;
    }
  }
  
  private updateActivity(sessionId: string) {
    // Track activity for idle detection
    const manifest = this.sessionManifests.get(sessionId) || {
      lastActivity: new Date(),
      idleTimer: null
    };
    
    // Clear existing timer
    if (manifest.idleTimer) {
      clearTimeout(manifest.idleTimer);
    }
    
    // Set new idle timer (5 minutes)
    manifest.idleTimer = setTimeout(() => {
      this.emit('session:idle', { 
        sessionId,
        idleDuration: 5 * 60 * 1000
      });
    }, 5 * 60 * 1000);
    
    manifest.lastActivity = new Date();
    this.sessionManifests.set(sessionId, manifest);
  }
}
```

### Usage Example
```typescript
// src/monitors/apm-monitor.ts
import { ClaudeSessionMonitor } from './session-monitor';
import { writeFileSync, appendFileSync } from 'fs';

const monitor = new ClaudeSessionMonitor(process.cwd());

// Log session events
monitor.on('session:start', ({ sessionId, timestamp }) => {
  console.log(`Session started: ${sessionId}`);
  appendFileSync('apm/events/queue.jsonl', 
    JSON.stringify({ 
      event: 'session_start',
      sessionId,
      timestamp: timestamp.toISOString()
    }) + '\n'
  );
});

monitor.on('session:idle', ({ sessionId, idleDuration }) => {
  console.log(`Session idle: ${sessionId} for ${idleDuration}ms`);
  // Trigger post-processing
});

monitor.on('tool:use', ({ tool, timestamp }) => {
  // Track tool usage patterns
});

// Git commit detection
monitor.on('tool:use', ({ tool }) => {
  if (tool === 'Bash') {
    // Check if git commit was made
    // Update session manifest
  }
});
```

## Alternative: SDK Wrapper Approach

Instead of monitoring log files, wrap the Claude SDK:

```typescript
import { query } from "@anthropic-ai/claude-code";

export class TrackedClaudeSession {
  private sessionId: string;
  private events: any[] = [];
  
  async executePrompt(prompt: string, options?: any) {
    // Log start
    this.logEvent('prompt_start', { prompt });
    
    const messages = [];
    for await (const message of query({ prompt, options })) {
      messages.push(message);
      
      // Track events
      if (message.type === 'tool_use') {
        this.logEvent('tool_use', { 
          tool: message.tool_name,
          timestamp: new Date()
        });
      }
    }
    
    // Log completion
    this.logEvent('prompt_complete', { 
      messageCount: messages.length 
    });
    
    return messages;
  }
  
  private logEvent(type: string, data: any) {
    const event = {
      type,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    this.events.push(event);
    
    // Write to event queue
    appendFileSync('apm/events/queue.jsonl', 
      JSON.stringify(event) + '\n'
    );
  }
}
```

## Recommendations

### Preferred Approach: Hybrid Solution

1. **Use SDK for new sessions**: When agents start work, use the SDK wrapper to track events in real-time
2. **Monitor logs for context**: Watch JSONL files to capture full conversation history
3. **TypeScript-based processing**: Replace bash scripts with TypeScript for better maintainability

### Implementation Priority

1. **Phase 1**: TypeScript log monitor
   - Watch ~/.claude/projects for new sessions
   - Parse JSONL events in real-time
   - Emit events for agent tracking

2. **Phase 2**: SDK integration
   - Wrap Claude SDK for direct event capture
   - Stream JSON processing
   - Real-time status updates

3. **Phase 3**: Advanced features
   - OpenTelemetry integration
   - Pattern analysis
   - Automated post-processing

### Key Advantages

- **No token overhead**: Monitoring happens outside agent responses
- **Real-time tracking**: File watching provides immediate updates
- **Full fidelity**: Access to complete conversation history
- **TypeScript benefits**: Type safety, better tooling, easier debugging

## Conclusion

While the Claude Code SDK doesn't provide built-in session monitoring, the combination of:
- JSONL log file monitoring
- Stream JSON output processing
- TypeScript event handling

Provides a robust foundation for implementing our session lifecycle management system without adding token overhead to agent operations.