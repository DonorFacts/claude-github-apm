# Collective Intelligence Implementation Roadmap

**Document Version**: 2.0  
**Last Updated**: 2025-07-01  
**Paradigm**: Ephemeral Specialists with Collective Memory

## Immediate Priority: Crash Recovery for Active Conversations

### Week 1: Core Session Recovery & Memory System

#### Day 1-2: Ephemeral Session Management
**Goal**: Track and recover active specialist instances

```bash
# Commands needed immediately
apm list conversations              # Show all active conversations
apm list conversations --crashed    # Show terminated conversations
apm recover conversation <id>       # Restore specific conversation
apm recover all                     # Restore all crashed conversations
```

**Implementation**:
- Simple JSON registry of active conversations
- Heartbeat tracking for crash detection
- Context preservation for each conversation
- VS Code terminal restoration

#### Day 3-4: Collective Memory Hierarchy
**Goal**: Separate ephemeral from persistent knowledge

```
Memory Structure:
├── Ephemeral (per conversation)
│   └── apm/sessions/{id}/context.md
├── Role-Level (shared by specialists)
│   └── apm/agents/{role}/MEMORY.md
└── Global (all agents)
    └── apm/memory/global.md
```

**Memory Promotion Logic**:
```typescript
// At conversation end
analyzeConversationInsights(session) {
  insights = extractKeyLearnings(session.context)
  
  for (insight of insights) {
    if (meetsCriteria(insight)) {
      promoteToRoleMemory(insight, session.role)
    }
  }
}
```

#### Day 5: Conversation Branching
**Goal**: Enable spawning multiple specialists from one conversation

```bash
# Within active conversation
apm branch conversation --name "Handle OAuth errors"
# Creates auth-dev-002 with parent context

apm branch conversation --count 3
# Creates auth-dev-002, 003, 004 for parallel work
```

### Week 2: Scrum Master & Orchestration

#### Day 1-2: Scrum Master Foundation
**Goal**: Central orchestration role

**Core Functions**:
```typescript
interface ScrumMasterCapabilities {
  // Work distribution
  assignWork(backlogItem) => selectSpecialist()
  
  // Instance management  
  spawnSpecialist(role, specialization, context)
  monitorProgress(activeConversations)
  
  // Coordination
  notifyDependencies(completedWork)
  updateSlackStatus(teamStatus)
}
```

#### Day 3-4: Dynamic Role Creation
**Goal**: Create new specialist roles on-demand

```bash
# Scrum Master identifies new need
apm create role --name "security-analyst" \
  --specialization "OAuth vulnerabilities" \
  --base-role "developer"
```

**Integration with agentify.md** (when available):
- Template-based role generation
- Specialization inheritance
- Context initialization

#### Day 5: Slack Integration Enhancement
**Goal**: Scrum Master coordinates through Slack

```
/apm-status conversations     # Show all active work
/apm-spawn auth-dev "Fix OAuth timeout"
/apm-branch auth-dev-001 3   # Create 3 branches
/apm-complete auth-dev-002   # Mark conversation done
```

### Week 3: Advanced Features

#### Intelligent Context Sharing
- Cross-conversation awareness (limited)
- Dependency tracking between conversations
- Smart memory access patterns

#### Recovery Optimization
- Batch recovery for multiple conversations
- Priority-based restoration
- Context integrity validation

## Critical Architecture Decisions

### 1. Identity: Ephemeral with Collective Memory
```
auth-dev-001 = First auth specialist instance (ephemeral)
auth-dev-002 = Second instance (possibly branched)
NOT "Sarah" or "Mike" (no persistent personas)
```

### 2. Memory: Hierarchical Promotion
```
Conversation → Role Memory → Global Memory
(ephemeral)    (shared)       (all agents)
```

### 3. Orchestration: Scrum Master Centric
- Scrum Master spawns specialists
- Monitors progress across conversations  
- Handles cross-conversation coordination

### 4. Recovery: Conversation-Based
```bash
# Not "restore Sarah's session"
# But "restore auth-dev-001 conversation"
apm recover conversation auth-dev-001-20250701
```

## Migration from Current State

### Phase 1: Add Conversation Tracking (Days 1-2)
- Wrap existing `/agent-developer-init` with conversation tracking
- Add simple crash detection
- Enable basic recovery

### Phase 2: Implement Memory Hierarchy (Days 3-4)
- Separate ephemeral from role-level memory
- Add promotion logic at conversation end
- Update agent initialization to use both

### Phase 3: Enable Branching & Scrum Master (Week 2)
- Add conversation branching capability
- Implement Scrum Master role
- Integrate with Slack

## Success Metrics

### Immediate Goals (Week 1)
- ✓ Recover all 12 crashed conversations with context
- ✓ Separate ephemeral from persistent memory
- ✓ Enable conversation branching

### Medium Term (Week 2-3)
- ✓ Scrum Master orchestrating work assignment
- ✓ Dynamic role creation functioning
- ✓ Slack-based team coordination

### Long Term Vision
- ✓ True collective intelligence across specialists
- ✓ Automatic expertise accumulation
- ✓ Self-organizing specialist networks

## Key Paradigm Shifts

| Old Approach | New Approach |
|-------------|--------------|
| Persistent agents | Ephemeral instances |
| Individual memory | Collective knowledge |
| Fixed team roster | Dynamic spawning |
| Role = Identity | Role = Template |
| Long conversations | Task-focused sessions |

## Next Immediate Step

Start with conversation recovery (most urgent need):

```bash
# What we need TODAY
apm list conversations --crashed
apm recover all

# This solves your immediate problem
# Then we build the collective intelligence on top
```

This roadmap embraces the Borg collective model while solving your immediate crash recovery needs.