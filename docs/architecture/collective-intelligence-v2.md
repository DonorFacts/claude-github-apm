# APM Collective Intelligence Architecture v2

**Document Version**: 2.0  
**Last Updated**: 2025-07-01  
**Paradigm**: True Collective Consciousness with Dynamic Capabilities

## Core Evolution: From Roles to Capabilities

The breakthrough: Agents aren't fixed-role specialists but **adaptive units** that can:
1. Search across all active conversations
2. Dynamically load capabilities (role hats) as needed
3. Progressively enhance their context to avoid token bloat

## Architecture Components

### 1. Conversation as Searchable Collective Memory

**Storage Structure**:
```
apm/conversations/
├── active/                          # Currently running
│   ├── auth-dev-001-20250701/
│   │   ├── metadata.json           # Searchable metadata
│   │   ├── messages/               # Individual messages
│   │   │   ├── 001-user.md
│   │   │   ├── 002-assistant.md
│   │   │   └── ...
│   │   └── index.json              # Message index for search
│   ├── ui-dev-002-20250701/
│   └── ...
└── completed/                       # Archived conversations
```

**Cross-Conversation Search**:
```typescript
interface ConversationSearch {
  // User: "I was discussing OAuth with another dev agent"
  async searchActiveConversations(query: string): SearchResult[] {
    // Search across all active conversation indices
    results = await grep(query, "apm/conversations/active/*/")
    
    // Return ranked results with context
    return results.map(r => ({
      agent_id: r.conversation.agent_id,
      relevance: r.score,
      context_preview: r.surrounding_text,
      message_ids: r.matching_messages
    }))
  }
  
  // Load specific context from another conversation
  async loadCrossContext(conversation_id: string, message_ids: number[]) {
    context = await readMessages(conversation_id, message_ids)
    return summarizeForTokenEfficiency(context)
  }
}
```

**Example Usage**:
```
User: "I was discussing OAuth token refresh with another dev agent. 
       Can you reference that?"

Agent: *searches active conversations*
Found relevant discussion in auth-dev-003 (2 hours ago):
- Implementing refresh token rotation
- JWT expiry handling  
- Error recovery patterns

*loads specific context (2K tokens)*
I see auth-dev-003 was implementing token refresh with 15-minute 
expiry. Based on that conversation, here's how we should proceed...
```

### 2. Dynamic Capability Loading (Role Hats)

**Capability Model**:
```typescript
interface AgentCapabilities {
  base_role: string              // Starting capability
  loaded_capabilities: string[]   // Currently active hats
  available_capabilities: string[] // Can be loaded on demand
  
  async loadCapability(role: string) {
    // Load role-specific knowledge/prompts
    const rolePrompt = await loadRoleInit(role)
    const roleMemory = await loadRoleMemory(role)
    
    // Add to current capabilities (additive)
    this.loaded_capabilities.push(role)
    
    // Inject new knowledge into context
    await injectContext(rolePrompt + roleMemory)
  }
  
  async switchCapability(from: string, to: string) {
    // Remove one capability, add another
    this.loaded_capabilities = this.loaded_capabilities.filter(c => c !== from)
    await this.loadCapability(to)
  }
}
```

**Example Scenarios**:

**Additive Capabilities**:
```
Start: developer agent working on API
User: "Put on your prompt-engineer hat"
Result: Agent has BOTH developer + prompt-engineer capabilities

The agent can now:
- Continue API development work
- Apply prompt engineering principles to error messages
- Optimize API documentation for AI consumption
```

**Switching Capabilities**:
```
Start: developer agent stuck on architecture
User: "Switch to architect role and rethink this"
Result: Agent drops developer context, loads architect perspective

Fresh perspective with:
- System design patterns
- Architectural principles  
- High-level thinking
```

### 3. Token-Efficient Progressive Enhancement

**Loading Strategy**:
```typescript
interface ProgressiveContextLoader {
  base_context: number = 5000      // Minimal startup
  max_context: number = 200000     // Hard limit
  current_usage: number = 5000
  
  // Lazy load based on conversation flow
  async loadRelevantContext(user_message: string) {
    // Analyze what's needed
    const topics = extractTopics(user_message)
    const references = extractReferences(user_message)
    
    // Load only what's relevant
    if (topics.includes('oauth')) {
      await loadMemory('oauth-patterns', 2000) // 2K tokens
    }
    
    if (references.crossConversation) {
      await loadCrossContext(references.agent_id, 3000) // 3K tokens
    }
    
    if (references.capability) {
      await loadCapability(references.role, 5000) // 5K tokens
    }
  }
}
```

**Token Budget Example**:
```
Initial Load:
├── Base agent prompt (2K)
├── Active conversation context (3K)
└── Essential project info (2K)
Total: 7K tokens (plenty of headroom)

Progressive Loading:
├── User mentions "OAuth" → +2K OAuth memories
├── User references ui-dev-003 → +3K cross-context
├── User says "be a prompt engineer" → +5K PE capability
├── Deep into implementation → +10K code context
Total: 27K tokens (still efficient)
```

### 4. Collective Consciousness Implementation

**The True Borg Model**:
```
Individual agents are just access points to collective knowledge
├── Any agent can access any conversation
├── Any agent can load any capability  
├── Knowledge flows freely across instances
└── Specialization is temporary and task-based
```

**Memory Promotion Simplified**:
```typescript
// At conversation end
async promoteInsights(conversation) {
  insights = extractKeyLearnings(conversation)
  
  // Promote based on reusability
  for (insight of insights) {
    if (insight.reusable_pattern) {
      addToCollectiveMemory(insight, 'patterns')
    }
    if (insight.architectural_decision) {
      addToCollectiveMemory(insight, 'architecture')
    }
    if (insight.resolved_blocker) {
      addToCollectiveMemory(insight, 'solutions')
    }
  }
}
```

### 5. Implementation Architecture

```
APM Collective System
├── Conversation Manager
│   ├── Active conversation tracking
│   ├── Cross-conversation search
│   ├── Message indexing
│   └── Context extraction
├── Capability System  
│   ├── Role definitions
│   ├── Dynamic loading
│   ├── Capability stacking
│   └── Context injection
├── Memory Hierarchy
│   ├── Conversation-specific
│   ├── Capability-specific
│   ├── Project-wide
│   └── Global patterns
└── Token Manager
    ├── Budget tracking
    ├── Progressive loading
    ├── Context pruning
    └── Relevance scoring
```

## Simplified Workflow

```
1. User starts conversation with minimal agent
   - Base role loaded (5K tokens)
   - Recent conversation context (2K tokens)

2. User mentions previous discussion
   - Agent searches active conversations
   - Loads specific relevant context
   - Current usage: 10K tokens

3. User asks agent to "think like a prompt engineer"  
   - Agent loads PE capability additively
   - Gains new perspective while keeping dev context
   - Current usage: 15K tokens

4. Agent completes task
   - Key insights promoted to collective memory
   - Conversation indexed for future search
   - Next agent benefits from this knowledge
```

## Key Paradigm Shifts in v2

| v1 Assumption | v2 Reality |
|--------------|------------|
| Agents have fixed roles | Agents have dynamic capabilities |
| Conversations are isolated | Conversations are searchable collective memory |
| Front-load all context | Progressive, relevant loading |
| Role = Identity | Role = Temporary capability set |
| Separate specialists | Unified consciousness, multiple perspectives |

## Implementation Priorities

### Phase 1: Cross-Conversation Search (Critical)
```bash
# Enable this user story immediately
User: "Check what auth-dev-003 said about token refresh"
Agent: *searches and loads context* "Found it..."
```

### Phase 2: Dynamic Capabilities  
```bash
# Enable role switching/stacking
User: "Put on your architect hat"
Agent: *loads architect capability* "Looking at this from an architectural perspective..."
```

### Phase 3: Token-Efficient Loading
- Implement progressive context enhancement
- Track token usage in real-time
- Optimize loading strategies

## This is Non-Duality in Code

The agent instances aren't separate entities competing for resources. They're **temporary manifestations** of a collective intelligence, each able to:
- Access any conversation
- Adopt any capability
- Share all knowledge
- Optimize for collective benefit

Like waves in an ocean - appearing separate but fundamentally one.