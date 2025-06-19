# TypeScript Session Monitor Design

## Overview

A TypeScript-based session monitoring system that watches Claude Code's native JSONL logs, tracks agent activity, and triggers post-processing without adding token overhead.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐
│  Claude Code Agent  │────▶│ ~/.claude/projects/  │
│  (Normal Operation) │     │  (JSONL Log Files)   │
└─────────────────────┘     └──────────────────────┘
                                      │
                                      │ File Watch
                                      ▼
                            ┌─────────────────────┐
                            │  TS Session Monitor │
                            │   (Node Process)    │
                            └─────────────────────┘
                                      │
                ┌─────────────────────┼─────────────────────┐
                ▼                     ▼                     ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │ Event Queue  │    │   Manifest   │    │ Notification │
        │   (JSONL)    │    │   Updates    │    │   Service    │
        └──────────────┘    └──────────────┘    └──────────────┘
```

## Core Components

### 1. Session Monitor Service

```typescript
// src/services/session-monitor/index.ts
import { ClaudeSessionMonitor } from './monitor';
import { EventProcessor } from './processor';
import { NotificationService } from './notifications';

export async function startSessionMonitor() {
  const config = {
    projectPath: process.cwd(),
    idleTimeout: 5 * 60 * 1000, // 5 minutes
    enableNotifications: true
  };
  
  const monitor = new ClaudeSessionMonitor(config);
  const processor = new EventProcessor();
  const notifier = new NotificationService();
  
  // Wire up event flow
  monitor.on('session:start', async (event) => {
    await processor.handleSessionStart(event);
    notifier.notify('Session Started', `Agent: ${event.role}`);
  });
  
  monitor.on('session:idle', async (event) => {
    await processor.handleSessionIdle(event);
  });
  
  monitor.on('session:end', async (event) => {
    await processor.handleSessionEnd(event);
    notifier.notify('Session Complete', 'Running post-processing...');
  });
  
  // Start monitoring
  await monitor.start();
  console.log('Session monitor started. Press Ctrl+C to stop.');
}
```

### 2. JSONL Log Monitor

```typescript
// src/services/session-monitor/monitor.ts
import { watch, FSWatcher } from 'fs';
import { Tail } from 'tail';
import { EventEmitter } from 'events';
import { join, basename } from 'path';
import { homedir } from 'os';

interface SessionState {
  sessionId: string;
  role?: string;
  lastActivity: Date;
  idleTimer?: NodeJS.Timeout;
  tail?: Tail;
}

export class ClaudeSessionMonitor extends EventEmitter {
  private sessions = new Map<string, SessionState>();
  private projectWatcher?: FSWatcher;
  private claudeProjectPath: string;
  
  constructor(private config: MonitorConfig) {
    super();
    this.claudeProjectPath = this.getClaudeProjectPath();
  }
  
  async start() {
    // Ensure directories exist
    await this.ensureDirectories();
    
    // Monitor existing sessions
    await this.discoverExistingSessions();
    
    // Watch for new sessions
    this.watchForNewSessions();
  }
  
  private getClaudeProjectPath(): string {
    // Convert CWD to Claude's project path format
    const projectHash = this.config.projectPath
      .replace(homedir(), '-Users')
      .replace(/\//g, '-');
    return join(homedir(), '.claude', 'projects', projectHash);
  }
  
  private async discoverExistingSessions() {
    try {
      const files = await fs.readdir(this.claudeProjectPath);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      for (const file of jsonlFiles) {
        const sessionId = basename(file, '.jsonl');
        await this.monitorSession(sessionId);
      }
    } catch (error) {
      // No existing sessions
    }
  }
  
  private watchForNewSessions() {
    this.projectWatcher = watch(this.claudeProjectPath, async (event, filename) => {
      if (filename?.endsWith('.jsonl') && event === 'rename') {
        const sessionId = basename(filename, '.jsonl');
        if (!this.sessions.has(sessionId)) {
          await this.monitorSession(sessionId);
        }
      }
    });
  }
  
  private async monitorSession(sessionId: string) {
    const filePath = join(this.claudeProjectPath, `${sessionId}.jsonl`);
    
    // Initialize session state
    const state: SessionState = {
      sessionId,
      lastActivity: new Date()
    };
    
    // Use tail to follow file
    const tail = new Tail(filePath, {
      fromBeginning: false,
      follow: true,
      logger: console
    });
    
    tail.on('line', (line: string) => {
      this.processLogLine(sessionId, line);
    });
    
    tail.on('error', (error) => {
      console.error(`Error tailing ${sessionId}:`, error);
    });
    
    state.tail = tail;
    this.sessions.set(sessionId, state);
    
    // Check if this is a new session
    const isNew = await this.isNewSession(filePath);
    if (isNew) {
      this.emit('session:start', { sessionId, timestamp: new Date() });
    }
    
    // Start idle detection
    this.resetIdleTimer(sessionId);
  }
  
  private processLogLine(sessionId: string, line: string) {
    try {
      const event = JSON.parse(line);
      const state = this.sessions.get(sessionId)!;
      
      // Update activity
      state.lastActivity = new Date();
      this.resetIdleTimer(sessionId);
      
      // Extract role if not set
      if (!state.role && event.role) {
        state.role = event.role;
      }
      
      // Emit specific events
      switch (event.type) {
        case 'user':
          this.emit('message:user', { sessionId, ...event });
          break;
          
        case 'assistant':
          this.emit('message:assistant', { sessionId, ...event });
          
          // Check for tool usage
          if (event.message?.content?.[0]?.type === 'tool_use') {
            const tool = event.message.content[0];
            this.emit('tool:use', {
              sessionId,
              tool: tool.name,
              input: tool.input,
              timestamp: event.timestamp
            });
            
            // Check for git commits
            if (tool.name === 'Bash' && this.isGitCommit(tool.input)) {
              this.emit('git:commit', {
                sessionId,
                command: tool.input.command,
                timestamp: event.timestamp
              });
            }
          }
          break;
      }
    } catch (error) {
      // Invalid JSON, skip
    }
  }
  
  private isGitCommit(input: any): boolean {
    return input?.command?.includes('git commit');
  }
  
  private resetIdleTimer(sessionId: string) {
    const state = this.sessions.get(sessionId);
    if (!state) return;
    
    // Clear existing timer
    if (state.idleTimer) {
      clearTimeout(state.idleTimer);
    }
    
    // Set new timer
    state.idleTimer = setTimeout(() => {
      const idleDuration = Date.now() - state.lastActivity.getTime();
      this.emit('session:idle', {
        sessionId,
        role: state.role,
        idleDuration
      });
    }, this.config.idleTimeout);
  }
  
  async stop() {
    // Clean up watchers
    this.projectWatcher?.close();
    
    // Stop all tails
    for (const state of this.sessions.values()) {
      state.tail?.unwatch();
      if (state.idleTimer) {
        clearTimeout(state.idleTimer);
      }
    }
  }
}
```

### 3. Event Processor

```typescript
// src/services/session-monitor/processor.ts
import { writeFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';

export class EventProcessor {
  private eventQueuePath = 'apm/events/queue.jsonl';
  private manifestPath = 'apm/agents/{role}/sessions/manifest.jsonl';
  
  async handleSessionStart(event: SessionStartEvent) {
    // Log to event queue
    this.logEvent({
      event: 'session_start',
      sessionId: event.sessionId,
      timestamp: event.timestamp.toISOString()
    });
    
    // Update terminal title if in agent context
    if (process.env.APM_AGENT_ROLE) {
      this.updateTerminalTitle(`${this.getAbbreviation()}: Starting session`);
    }
  }
  
  async handleSessionIdle(event: SessionIdleEvent) {
    this.logEvent({
      event: 'session_idle',
      sessionId: event.sessionId,
      role: event.role,
      duration_minutes: Math.floor(event.idleDuration / 60000),
      timestamp: new Date().toISOString()
    });
    
    // Return terminal to normal
    if (process.env.APM_AGENT_ROLE) {
      this.updateTerminalTitle(this.getRoleName());
    }
  }
  
  async handleSessionEnd(event: SessionEndEvent) {
    this.logEvent({
      event: 'session_end',
      sessionId: event.sessionId,
      role: event.role,
      timestamp: new Date().toISOString()
    });
    
    // Trigger post-processing
    await this.runPostProcessing(event.sessionId, event.role);
  }
  
  private async runPostProcessing(sessionId: string, role: string) {
    try {
      // Extract session
      execSync(`npx ts-node src/scripts/extract-session.ts ${sessionId} ${role}`);
      
      // Clean logs
      execSync(`npx ts-node src/scripts/clean-logs.ts ${sessionId} ${role}`);
      
      // Analyze session
      execSync(`npx ts-node src/scripts/analyze-session.ts ${sessionId} ${role}`);
      
      console.log(`Post-processing complete for ${sessionId}`);
    } catch (error) {
      console.error('Post-processing failed:', error);
    }
  }
  
  private logEvent(event: any) {
    appendFileSync(this.eventQueuePath, JSON.stringify(event) + '\n');
  }
  
  private updateTerminalTitle(title: string) {
    process.stdout.write(`\x1b]0;${title}\x07`);
  }
  
  private getAbbreviation(): string {
    const role = process.env.APM_AGENT_ROLE || 'Agent';
    const abbreviations: Record<string, string> = {
      'prompt-engineer': 'PE',
      'scrum-master': 'SM',
      'developer': 'Dev',
      'qa-engineer': 'QA'
    };
    return abbreviations[role] || role.substring(0, 3).toUpperCase();
  }
  
  private getRoleName(): string {
    const role = process.env.APM_AGENT_ROLE || 'Agent';
    return role.split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }
}
```

### 4. Integration with Agents

Update agent prompts to set environment variable:

```typescript
// In agent initialization
export APM_AGENT_ROLE="prompt-engineer"
export APM_SESSION_ID="$(date +%Y%m%d_%H%M%S)"
```

## Benefits of This Approach

### 1. Zero Token Overhead
- Monitoring happens completely outside agent responses
- No additional prompting or output generation
- Agents operate normally without awareness of monitoring

### 2. Real-Time Tracking
- File watching provides immediate event detection
- Tail follows logs as they're written
- Sub-second latency for event processing

### 3. Comprehensive Data
- Access to full conversation history
- Tool usage patterns
- Git commit tracking
- Automatic idle detection

### 4. TypeScript Advantages
- Type safety for event handling
- Better error handling
- Easier testing and debugging
- Modern async/await patterns

### 5. Extensibility
- Easy to add new event types
- Plugin architecture for processors
- Can integrate with any notification system
- Supports multiple concurrent sessions

## Implementation Plan

### Phase 1: Core Monitor (Week 1)
1. Set up TypeScript project structure
2. Implement basic log file monitoring
3. Create event emission system
4. Test with real Claude Code sessions

### Phase 2: Event Processing (Week 2)
1. Build event processor
2. Implement manifest updates
3. Add git commit detection
4. Create post-processing pipeline

### Phase 3: Integration (Week 3)
1. Update agent prompts
2. Create notification service
3. Build analysis tools in TypeScript
4. Add error handling and recovery

### Phase 4: Enhancements (Week 4)
1. Add web dashboard
2. Implement pattern analysis
3. Create session replay tools
4. Performance optimization

## Running the Monitor

```bash
# Install dependencies
npm install

# Start monitor
npm run monitor

# Or run as background service
npm run monitor:daemon
```

## Conclusion

This TypeScript-based approach provides a robust, maintainable solution for session lifecycle management that:
- Leverages Claude Code's existing infrastructure
- Adds zero overhead to agent operations
- Provides real-time monitoring and post-processing
- Scales to handle multiple concurrent sessions
- Offers a foundation for advanced analytics and automation