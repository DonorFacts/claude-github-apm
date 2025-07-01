# APM Collective Intelligence Architecture - Final Design

**Version**: 3.0 Final  
**Date**: 2025-07-01  
**Paradigm**: Ephemeral Specialists with Collective Memory and Intelligent Context

## Executive Summary

The APM architecture has evolved from simple multi-agent coordination to a **collective intelligence system** where ephemeral agent instances share knowledge, search across conversations, dynamically load capabilities, and work with intelligent code summaries to maximize token efficiency.

## Core Architecture Principles

1. **Agents are Ephemeral**: Task-focused instances, not persistent personas
2. **Memory is Collective**: Shared knowledge pools with intelligent promotion
3. **Context is Searchable**: Any agent can reference any conversation
4. **Capabilities are Dynamic**: Agents load/stack roles as needed
5. **Code is Summarized**: Work with semantic understanding, not raw syntax
6. **Tools are Intelligent**: Enhanced Read/Write/Search with built-in optimization

## System Components

### 1. Conversation Management Layer

**Storage Format**: YAML files in `../apm/conversations/`

```yaml
# ../apm/conversations/active/auth-dev-001-20250701.yaml
conversation:
  id: auth-dev-001-20250701
  agent: auth-dev-001
  role: developer
  specialization: authentication
  status: active
  created: 2025-07-01T14:30:00Z
  worktree: feature-auth-system
  branch: feature/oauth-implementation

messages:
  - role: user
    timestamp: 2025-07-01T14:30:00Z
    content: "Implement OAuth flow"
    metadata:
      turn: 1
      tokens_used: 7234
      tokens_remaining: 192766
      git_status: "3 files modified"

  - role: assistant
    timestamp: 2025-07-01T14:30:45Z
    content: "I'll implement OAuth..."
    tool_calls_approved: 3
    tool_calls_rejected: 1
```

**Key Features**:

- Searchable across all active conversations
- Automatic metadata injection with each message
- Token tracking for intelligent packaging
- Git context awareness

### 2. Session Recovery System

**Commands**:

```bash
apm list                      # Show all active conversations
apm list --crashed           # Show terminated conversations
apm recover <id>             # Restore specific conversation
apm recover all              # Restore all crashed conversations
apm search "OAuth" --active  # Search across active conversations
```

**Recovery Process**:

1. Detect crashed sessions (no heartbeat >2 minutes)
2. Restore terminal in correct VS Code window
3. Inject team status brief
4. Resume with full context

### 3. Collective Memory Hierarchy

```
Memory Structure:
├── Ephemeral (per conversation)
│   └── ../apm/sessions/{id}/context.md
├── Role-Level (shared by role)
│   └── apm/agents/{role}/MEMORY.md
└── Global (project-wide)
    └── ../apm/memory/global.md
```

**Memory Promotion**:

```typescript
// Automatic promotion at conversation end
if (insight.reused_count > 3) promoteToRoleMemory();
if (insight.architectural) promoteToGlobalMemory();
if (insight.pattern) promoteToPatternLibrary();
```

### 4. Dynamic Capability System

**Role Loading**:

```
# Start as developer
Agent: I'm a developer working on authentication

# User: "Put on your prompt-engineer hat"
Agent: *loads PE capability additively*
Agent: I now have both developer and prompt-engineer perspectives

# User: "Think like an architect"
Agent: *loads architect capability*
Agent: Looking at this from an architectural viewpoint while maintaining my dev context...
```

**Implementation**:

- Capabilities stack (not replace)
- Token-efficient progressive loading
- Role-specific knowledge injection

### 5. Intelligent Context Layer

**Code Summarization**:

```
For files >50 lines:
├── Generate semantic summary
├── Cache as {file}-summary.md
├── Update on file changes
└── Serve summary by default

Token Savings:
- Full file: 5-50K tokens
- Summary: 500-1000 tokens
- Reduction: 90-95%
```

**Enhanced Tools**:

- **Read**: Returns summaries + key snippets
- **Write**: Triggers summary regeneration
- **Search**: Semantic search across summaries
- **Explore**: Guided codebase navigation

### 6. Cross-Conversation Search

**User Story**:

```
User: "I was discussing OAuth with another dev agent"
Agent: *searches all active conversations*
Agent: "Found auth-dev-003's discussion on token refresh (2h ago).
        They implemented rotation with 15-minute expiry..."
```

**Implementation**:

- Grep across conversation YAML files
- Extract relevant context (2-3K tokens)
- Inject into current conversation

### 7. Intelligent Tool Overrides

**Before**: Agent reads 3000-line file → uses 15K tokens
**After**: Agent gets summary + snippets → uses 1.5K tokens

**Tool Enhancements**:

```typescript
Read: {
  intelligent: true,
  summarize: true,
  snippets: true,
  relationships: true
}

Search: {
  semantic: true,
  summaries: true,
  ranking: true,
  context_aware: true
}
```

## Data Flow Architecture

```
User Message → Metadata Injection → Agent Processing
                                          ↓
                                   Intelligent Tools
                                   ├── Read (summarized)
                                   ├── Search (semantic)
                                   └── Write (triggers summary)
                                          ↓
                                   Response Generation
                                          ↓
                        Conversation Storage (YAML)
                                          ↓
                    Memory Promotion (if valuable)
```

## Storage Structure

```
Project Repository (./)
├── apm/                     # COMMITTED to repo
│   ├── memory/              # Collective memories
│   │   ├── global.md       # Project-wide insights
│   │   ├── patterns/       # Reusable patterns
│   │   └── bugs/           # Bug patterns & solutions
│   ├── code-summaries/      # Generated summaries
│   │   ├── src/
│   │   └── .metadata.yaml  # Generation timestamps
│   └── scripts/             # Agent tools
│       ├── apm/            # CLI commands
│       ├── search/         # Search tools
│       ├── summarize/      # Summary generation
│       ├── bugs/           # Bug extraction
│       └── intercept/      # Metadata injection

External Storage (../apm/)   # TOO LARGE for repo
├── conversations/           # Full conversation YAMLs
│   ├── active/
│   └── completed/
└── sessions/               # Session registry
    └── registry.json
```

## Key Architectural Decisions

1. **YAML over JSON**: Human-readable, grep-friendly conversation storage
2. **Summaries over Full Files**: 90% token reduction with preserved understanding
3. **Additive Capabilities**: Agents stack roles rather than switching
4. **Externalized Scripts**: Bash operations outside prompts to save tokens
5. **Progressive Loading**: Start minimal, load context as needed
6. **Collective Knowledge**: Insights promoted based on reusability

## Integration Points

### With Claude Code

- Override default Read/Write/Search tools
- Inject metadata with each user message
- Monitor token usage for auto-packaging

### With VS Code

- Terminal restoration
- Worktree detection for correct window
- Git status integration

### With Slack (Future)

- Bidirectional communication
- Team coordination commands
- Status updates from collective

## Performance Characteristics

- **Conversation Search**: <1 second across 100 conversations
- **Summary Generation**: 2-5 seconds per file (async)
- **Session Recovery**: <10 seconds per agent
- **Memory Promotion**: Automatic at conversation end
- **Token Efficiency**: 80-90% reduction in code context

## This is the Way

This architecture embraces the fundamental nature of AI agents:

- Not human team members but collective intelligence nodes
- Not persistent identities but ephemeral task specialists
- Not isolated conversations but searchable shared knowledge
- Not token-hungry but intelligently efficient

The result is a system that can handle 12+ concurrent agents, massive codebases, and complex interdependencies while maintaining context quality and token efficiency.
