# Implementation Roadmap v2: Collective Consciousness

**Updated**: 2025-07-01  
**Priority**: Cross-conversation search and dynamic capabilities

## Week 1: Foundation - Search & Recovery

### Day 1-2: Conversation Storage & Indexing
**Goal**: Make all conversations searchable

```bash
# Required immediately
Agent: "Searching active conversations for 'OAuth token refresh'..."
Agent: "Found 3 relevant discussions: auth-dev-003 (2h ago), auth-dev-001 (yesterday)..."
```

**Implementation**:
```
apm/conversations/active/
├── auth-dev-001-20250701/
│   ├── metadata.json         # {agent_id, topics, timestamps}
│   ├── messages/
│   │   ├── 001.json         # {role: "user", content: "...", timestamp}
│   │   └── 002.json         # {role: "assistant", content: "..."}
│   └── index.txt            # Searchable text for grep
```

**Search Interface**:
```typescript
// In agent response to user mentioning other conversation
const results = await searchConversations("OAuth token refresh")
const context = await loadContextFromConversation(results[0].id, results[0].messageIds)
```

### Day 3-4: Basic Recovery System
**Goal**: Restore crashed conversations with search capability

```bash
apm list                      # All active conversations  
apm recover <id>              # Restore specific conversation
apm recover all               # Restore all crashed conversations
apm search "OAuth" --active   # Search across active conversations
```

### Day 5: Cross-Context Loading
**Goal**: Agents can pull context from other conversations

**User Story Implementation**:
```
User: "I was discussing OAuth refresh with another dev agent"
Agent: 
1. Searches active conversations
2. Finds auth-dev-003's discussion
3. Loads relevant context (2-3K tokens)
4. Continues with that knowledge
```

## Week 2: Dynamic Capabilities

### Day 1-2: Capability System
**Goal**: Agents can load/switch/stack roles

```typescript
interface CapabilityManager {
  // Load additional capability (additive)
  async addHat(role: string) {
    const capability = await loadCapability(role)
    this.activeCapabilities.push(capability)
    await injectIntoContext(capability.knowledge)
  }
  
  // Switch primary capability
  async switchHat(to: string) {
    this.primaryCapability = await loadCapability(to)
    await adjustContext(this.primaryCapability)
  }
}
```

**Usage**:
```
User: "Put on your prompt-engineer hat"
Agent: *loads PE capability while keeping dev knowledge*
Agent: "I can now help optimize prompts while continuing development work"
```

### Day 3-4: Token-Efficient Loading
**Goal**: Progressive enhancement without token bloat

```typescript
class TokenBudgetManager {
  budget = { base: 5000, max: 200000, current: 5000 }
  
  async loadIfRoom(content: string, tokens: number, priority: number) {
    if (this.current + tokens < this.max * 0.8) {
      await loadContent(content)
      this.current += tokens
    } else if (priority > 8) {
      await pruneOldContext()
      await loadContent(content)
    }
  }
}
```

### Day 5: Memory Promotion System
**Goal**: Collective learning from all conversations

```bash
# At conversation end
apm complete auth-dev-001
# System extracts insights → promotes to collective memory
# Next agent benefits from these insights
```

## Week 3: Advanced Integration

### Scrum Master with Search
- Scrum Master can search all conversations before assigning work
- Avoids duplicate efforts
- Identifies dependencies across active work

### Slack + Collective Awareness
```
/apm-search "OAuth implementation"
Bot: Found 3 active conversations working on OAuth:
- auth-dev-001: Provider setup (2h ago)
- auth-dev-003: Token refresh (30m ago)  
- sec-dev-001: Security audit (active now)
```

### Intelligent Handoffs
```
User: "Hand this to whoever is working on OAuth"
Agent: *searches conversations*
Agent: "auth-dev-003 is actively working on OAuth refresh. 
        Preparing handoff with current context..."
```

## Critical Path (What to Build First)

### Phase 1: Search (Days 1-2) ⚡ HIGHEST PRIORITY
```bash
# This solves the immediate user story
grep -r "OAuth" apm/conversations/active/*/index.txt
# Agent can find and reference other discussions
```

### Phase 2: Recovery (Days 3-4)
```bash
# Restore all crashed conversations
apm recover all
# With search capability built in
```

### Phase 3: Capabilities (Week 2)
```bash
# Dynamic role loading
User: "Be a prompt engineer"
Agent: *loads capability* "Now viewing this through PE lens..."
```

## Simplified First Implementation

Start with the absolute minimum that delivers value:

```typescript
// 1. Store conversations in searchable format
async saveMessage(session_id: string, message: Message) {
  const path = `apm/conversations/active/${session_id}/`
  await appendToFile(`${path}/index.txt`, message.content)
  await saveJson(`${path}/messages/${message.id}.json`, message)
}

// 2. Search across conversations  
async searchConversations(query: string): Promise<SearchResult[]> {
  const results = await execCommand(`grep -r "${query}" apm/conversations/active/*/index.txt`)
  return parseGrepResults(results)
}

// 3. Load cross-context
async loadCrossContext(session_id: string, message_ids: number[]) {
  const messages = await loadMessages(session_id, message_ids)
  return summarizeForContext(messages, 3000) // 3K token budget
}
```

## Success Metrics

### Week 1 Success
- ✓ Agent can search all active conversations
- ✓ Agent can load context from other conversations
- ✓ Crashed conversations recoverable
- ✓ User never needs to "find the right terminal tab"

### Week 2 Success  
- ✓ Agents can dynamically load capabilities
- ✓ Token usage stays under 30K for most conversations
- ✓ Collective memory captures reusable insights

### Week 3 Success
- ✓ Full collective consciousness operational
- ✓ Scrum Master orchestrating with search awareness
- ✓ Slack integration with collective search

This roadmap prioritizes your immediate need (cross-conversation search) while building toward the full collective intelligence vision.