# Claude Code Message Preprocessor Design

> **Status**: Planning Phase  
> **Priority**: High  
> **Complexity**: Medium-High  
> **Dependencies**: Claude Code SDK, APM Memory System

## Problem Statement

The Claude GitHub APM framework requires automatic context injection into user messages to enable:

1. **Multi-Agent Coordination**: Agents need awareness of other agents' current work and recent decisions
2. **Context Continuity**: Automatic injection of timestamps, git status, project phase, and agent role
3. **Workflow Intelligence**: Dynamic context about issue hierarchies, sprint status, and handoff states
4. **Memory Integration**: Seamless incorporation of agent memory and project context

Currently, this context must be manually provided by users, leading to:
- Inconsistent agent behavior across sessions
- Lost context during agent handoffs
- Manual overhead for maintaining project awareness
- Reduced effectiveness of the multi-agent system

## Solution Overview

Implement a transparent message preprocessing layer that intercepts Claude Code's API calls and automatically enhances user messages with relevant context, inspired by the proven approach from [claude-trace](https://github.com/badlogic/lemmy/blob/main/apps/claude-trace/README.md).

### Core Principles

1. **Transparency**: No changes to existing Claude Code CLI usage patterns
2. **Safety**: Graceful degradation with comprehensive error handling
3. **Configurability**: Easy to enable/disable and customize per project
4. **Performance**: Minimal overhead on request processing
5. **Compatibility**: Works across Claude Code versions and API changes

## Technical Architecture

### High-Level Flow

```
User Message → Fetch Interceptor → Context Injector → Enhanced Message → Anthropic API
                      ↓
              APM Context Sources:
              - Git status & branch
              - Agent memory files  
              - GitHub issue status
              - Project phase data
              - Inter-agent handoffs
```

### Component Architecture

```typescript
// Core interceptor system
interface MessagePreprocessor {
  preprocess(messages: AnthropicMessage[]): Promise<AnthropicMessage[]>;
  isEnabled(): boolean;
  configure(config: PreprocessorConfig): void;
}

// APM-specific context injection
interface APMContextProvider {
  getCurrentAgentContext(): Promise<AgentContext>;
  getProjectContext(): Promise<ProjectContext>;
  getGitContext(): Promise<GitContext>;
  getHandoffContext(): Promise<HandoffContext>;
}

// Configuration management
interface PreprocessorConfig {
  enabled: boolean;
  contextSources: ContextSource[];
  agentRole?: string;
  projectRoot: string;
  maxContextLength: number;
  debug: boolean;
}
```

### Context Injection Strategy

The system will prepend structured context to user messages:

```
[AUTO-CONTEXT 2024-07-02T15:30:45Z]
Agent: developer
Branch: feature/user-auth
Phase: Implementation (Sprint 3)
Active Issues: #123, #124, #125
Last Handoff: scrum-master → developer (2024-07-02T14:15:00Z)
Recent Commits: feat: add JWT middleware (hash: abc123f)

Memory Updates:
- JWT implementation patterns learned
- Authentication flow documented
- Security considerations noted

Inter-Agent Status:
- qa-engineer: Testing #120 (blocked on environment)  
- documentation: Updating API docs for #118

---
[Original user message follows]
```

## Implementation Plan (TDD Approach)

### Phase 1: Core Interceptor System

#### Step 1: Failing Tests First

Create comprehensive test suite that defines expected behavior:

```typescript
// tests/interceptor.test.ts
describe('Fetch Interceptor', () => {
  let originalFetch: typeof globalThis.fetch;
  
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('API Detection', () => {
    it('should identify Anthropic API requests', async () => {
      const interceptor = new FetchInterceptor();
      expect(interceptor.isAnthropicRequest('https://api.anthropic.com/v1/messages')).toBe(true);
      expect(interceptor.isAnthropicRequest('https://other.api.com/endpoint')).toBe(false);
    });

    it('should identify Claude Code user agent patterns', async () => {
      const headers = new Headers({
        'User-Agent': 'Claude-Code/1.0.0 (darwin; x64) Node.js/20.0.0'
      });
      const interceptor = new FetchInterceptor();
      expect(interceptor.isClaudeCodeRequest(headers)).toBe(true);
    });
  });

  describe('Message Preprocessing', () => {
    it('should enhance user messages with context', async () => {
      const mockMessages = [
        { role: 'user', content: 'Help me debug this function' }
      ];
      
      const interceptor = new FetchInterceptor({
        enabled: true,
        contextSources: ['git', 'agent', 'project']
      });
      
      const enhanced = await interceptor.preprocessMessages(mockMessages);
      
      expect(enhanced[0].content).toContain('[AUTO-CONTEXT');
      expect(enhanced[0].content).toContain('Branch:');
      expect(enhanced[0].content).toContain('Agent:');
      expect(enhanced[0].content).toContain('Help me debug this function');
    });

    it('should preserve original message structure', async () => {
      const originalMessages = [
        { role: 'user', content: 'test message' },
        { role: 'assistant', content: 'assistant response' }
      ];
      
      const interceptor = new FetchInterceptor({ enabled: true });
      const enhanced = await interceptor.preprocessMessages([...originalMessages]);
      
      expect(enhanced).toHaveLength(2);
      expect(enhanced[1]).toEqual(originalMessages[1]); // Assistant message unchanged
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle context provider failures', async () => {
      const failingProvider = {
        getContext: () => Promise.reject(new Error('Context unavailable'))
      };
      
      const interceptor = new FetchInterceptor({
        enabled: true,
        contextProviders: [failingProvider]
      });
      
      const messages = [{ role: 'user', content: 'test' }];
      const result = await interceptor.preprocessMessages(messages);
      
      // Should not throw, should return original messages
      expect(result).toEqual(messages);
    });

    it('should never break original fetch functionality', async () => {
      const interceptor = new FetchInterceptor({ enabled: true });
      interceptor.install();
      
      // Non-Anthropic request should pass through unchanged
      const response = await fetch('https://httpbin.org/json');
      expect(response.ok).toBe(true);
    });
  });
});
```

#### Step 2: Context Provider Tests

```typescript
// tests/apm-context-provider.test.ts
describe('APM Context Provider', () => {
  describe('Git Context', () => {
    it('should extract current branch and recent commits', async () => {
      const provider = new APMContextProvider('/fake/project/root');
      const context = await provider.getGitContext();
      
      expect(context.branch).toBeDefined();
      expect(context.recentCommits).toHaveLength(3);
      expect(context.recentCommits[0]).toHaveProperty('hash');
      expect(context.recentCommits[0]).toHaveProperty('message');
    });

    it('should handle repositories without commits gracefully', async () => {
      const provider = new APMContextProvider('/empty/repo');
      const context = await provider.getGitContext();
      
      expect(context.branch).toBe('main');
      expect(context.recentCommits).toEqual([]);
    });
  });

  describe('Agent Memory Context', () => {
    it('should read current agent role from memory files', async () => {
      const provider = new APMContextProvider('/project/with/agents');
      const context = await provider.getCurrentAgentContext();
      
      expect(context.role).toBe('developer');
      expect(context.recentLearnings).toBeDefined();
      expect(context.currentTasks).toBeDefined();
    });

    it('should detect agent handoffs from context files', async () => {
      const provider = new APMContextProvider('/project/root');
      const handoffs = await provider.getHandoffContext();
      
      expect(handoffs.recent).toHaveLength(1);
      expect(handoffs.recent[0]).toMatchObject({
        from: 'scrum-master',
        to: 'developer',
        timestamp: expect.any(Date),
        context: expect.any(String)
      });
    });
  });

  describe('Project Context', () => {
    it('should extract GitHub issue hierarchy', async () => {
      const provider = new APMContextProvider('/project/root');
      const context = await provider.getProjectContext();
      
      expect(context.currentPhase).toBeDefined();
      expect(context.activeIssues).toBeInstanceOf(Array);
      expect(context.sprintStatus).toBeDefined();
    });
  });
});
```

#### Step 3: Integration Tests

```typescript
// tests/integration.test.ts
describe('End-to-End Integration', () => {
  it('should enhance real Claude Code API calls', async () => {
    // Mock Anthropic API
    const mockResponse = new Response(JSON.stringify({
      content: [{ text: 'Enhanced response' }]
    }));
    
    let capturedRequest: Request | undefined;
    globalThis.fetch = jest.fn().mockImplementation((req) => {
      capturedRequest = req as Request;
      return Promise.resolve(mockResponse);
    });

    // Install interceptor
    const interceptor = new FetchInterceptor({
      enabled: true,
      projectRoot: '/test/project'
    });
    interceptor.install();

    // Simulate Claude Code API call
    await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Claude-Code/1.0.0'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message' }]
      })
    });

    // Verify enhancement occurred
    expect(capturedRequest).toBeDefined();
    const requestBody = JSON.parse(await capturedRequest!.text());
    expect(requestBody.messages[0].content).toContain('[AUTO-CONTEXT');
  });
});
```

### Phase 2: APM Context Integration

#### Step 4: Context Source Implementation

Following TDD, implement each context provider to pass the failing tests:

```typescript
// src/interceptor/apm-context-provider.ts
export class APMContextProvider implements ContextProvider {
  constructor(private projectRoot: string) {}

  async getGitContext(): Promise<GitContext> {
    // Implementation follows from failing tests
    // Must handle edge cases defined in tests
  }

  async getCurrentAgentContext(): Promise<AgentContext> {
    // Read from apm/agents/*/MEMORY.md and context/ files
    // Extract current role, recent learnings, active tasks
  }

  async getProjectContext(): Promise<ProjectContext> {
    // GitHub API integration
    // Issue hierarchy extraction
    // Sprint status determination
  }
}
```

#### Step 5: Message Enhancement Logic

```typescript
// src/interceptor/message-enhancer.ts
export class MessageEnhancer {
  async enhanceUserMessage(
    message: AnthropicMessage,
    context: APMContext
  ): Promise<AnthropicMessage> {
    const contextHeader = this.buildContextHeader(context);
    
    return {
      ...message,
      content: `${contextHeader}\n\n---\n${message.content}`
    };
  }

  private buildContextHeader(context: APMContext): string {
    // Format context as structured header
    // Handle missing context gracefully
    // Respect max length limits
  }
}
```

### Phase 3: Integration & Deployment

#### Step 6: CLI Integration

```typescript
// src/cli/interceptor-launcher.ts
export class InterceptorLauncher {
  static async launch(config: PreprocessorConfig): Promise<void> {
    const interceptor = new FetchInterceptor(config);
    interceptor.install();
    
    // Launch Claude Code with preprocessing enabled
    process.env.CLAUDE_MESSAGE_PREPROCESSING = 'enabled';
  }
}
```

#### Step 7: Configuration Management

```typescript
// .claude/preprocessing.json
{
  "enabled": true,
  "contextSources": ["git", "agent", "project", "handoffs"],
  "agentRole": "auto-detect",
  "maxContextLength": 2000,
  "debug": false,
  "filters": {
    "includeOnlyAgentSessions": true,
    "excludeSystemMessages": true
  }
}
```

## Security & Compatibility Considerations

### Security Model

1. **No External Network Access**: Interceptor only reads local files and git state
2. **User Permission Model**: Runs with same permissions as Claude Code
3. **API Key Security**: Never logs or modifies API keys or sensitive headers
4. **Content Filtering**: Excludes sensitive patterns from context injection

### Compatibility Strategy

1. **Version Detection**: Detect Claude Code version and adapt accordingly
2. **API Format Resilience**: Handle API schema changes gracefully
3. **Graceful Degradation**: Fall back to no preprocessing on errors
4. **Debug Mode**: Comprehensive logging for troubleshooting

### Performance Optimization

1. **Context Caching**: Cache expensive operations (git log, file reads)
2. **Lazy Loading**: Only compute context when needed
3. **Size Limits**: Respect token limits and truncate appropriately
4. **Async Processing**: Non-blocking context gathering

## Testing Strategy

### Test Categories

1. **Unit Tests**: Individual components (85% coverage target)
2. **Integration Tests**: End-to-end message flow
3. **Compatibility Tests**: Multiple Claude Code versions
4. **Performance Tests**: Latency and memory usage
5. **Security Tests**: No data leakage, permission boundaries

### Test Environment Setup

```bash
# Test project setup
mkdir -p test-fixtures/apm-project/{apm/agents/developer,docs,src}
git init test-fixtures/apm-project
cd test-fixtures/apm-project

# Create test agent memory files
echo "# Developer Agent Memory" > apm/agents/developer/MEMORY.md
echo "Current tasks: Implementing user authentication" >> apm/agents/developer/MEMORY.md

# Create test commits
git commit --allow-empty -m "feat: initial commit"
git commit --allow-empty -m "feat: add user auth endpoints"
```

### Continuous Testing

```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration",
    "test:compatibility": "jest --testPathPattern=compatibility",
    "test:watch": "jest --watch --testPathPattern=unit"
  }
}
```

## Deployment & Integration

### Package Structure

```
src/
├── interceptor/
│   ├── fetch-interceptor.ts       # Core interception logic
│   ├── message-enhancer.ts        # Context injection
│   └── apm-context-provider.ts    # APM-specific context
├── config/
│   ├── preprocessor-config.ts     # Configuration management
│   └── detection.ts               # Claude Code version detection
├── cli/
│   └── launcher.ts                # CLI integration
└── types/
    └── anthropic-api.ts           # API type definitions
```

### Installation Integration

```bash
# Add to existing APM setup
pnpm add -D @claude-apm/message-preprocessor

# Update pnpm claude script
"claude": "claude-preprocessor && claude"
```

### Environment Configuration

```bash
# .env or project configuration
CLAUDE_PREPROCESSING_ENABLED=true
CLAUDE_PREPROCESSING_DEBUG=false
CLAUDE_PREPROCESSING_MAX_CONTEXT=2000
CLAUDE_APM_AGENT_ROLE=auto-detect
```

## Success Metrics

### Functional Success

- [ ] 100% transparent to existing Claude Code workflows
- [ ] Context injection works across all agent roles
- [ ] Graceful handling of all error conditions
- [ ] No performance degradation > 100ms per request

### APM Framework Integration

- [ ] Agents automatically receive project context
- [ ] Inter-agent handoffs include full context transfer
- [ ] Memory system integration provides relevant learnings
- [ ] GitHub issue hierarchy reflected in all agent interactions

### Quality Gates

- [ ] 90%+ test coverage across all components
- [ ] Zero breaking changes to existing APM workflows
- [ ] Compatibility across Claude Code versions
- [ ] Security audit passes with no high-severity findings

## Future Enhancements

### Phase 2 Features

1. **Smart Context Filtering**: ML-based relevance scoring for context inclusion
2. **Multi-Repository Support**: Context aggregation across related repositories
3. **Team Coordination**: Real-time status sharing between multiple developers
4. **Performance Analytics**: Context effectiveness measurement and optimization

### Advanced Integration

1. **Custom Context Providers**: Plugin system for domain-specific context
2. **Context Templates**: Pre-configured context patterns for different workflows
3. **Real-time Updates**: Live context updates during long-running sessions
4. **Context Versioning**: Track context evolution and impact on agent performance

---

**Next Steps**: 
1. Review and approve this design
2. Set up test environment with failing tests
3. Begin TDD implementation of core interceptor
4. Iterate based on real-world APM framework usage
