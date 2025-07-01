# APM Collective Intelligence Architecture

**Document Version**: 2.0  
**Last Updated**: 2025-07-01  
**Status**: Paradigm Shift - Borg Collective Model

## Core Concept: Ephemeral Specialists with Collective Memory

Instead of persistent team members, APM manages **ephemeral specialist instances** that share collective knowledge like the Borg in Star Trek.

### Key Principles

1. **Agents are Ephemeral**: Created for specific conversations, then terminated
2. **Memory is Persistent**: Shared knowledge pools at role/project level
3. **Instances can Branch**: Spawn multiple conversations from one parent
4. **Scrum Master Orchestrates**: Central role for work assignment and spawning
5. **Dynamic Role Creation**: New specialist roles created on-demand via agentify

## Architecture Components

### 1. Collective Memory System

```
Memory Hierarchy:
├── Global Memory (all agents)
│   └── apm/memory/global.md
├── Role-Level Memory (shared by role)
│   ├── apm/agents/developer/MEMORY.md
│   ├── apm/agents/prompt-engineer/MEMORY.md
│   └── apm/agents/scrum-master/MEMORY.md
└── Session Memory (ephemeral, per conversation)
    └── apm/sessions/{session-id}/context.md
```

**Memory Promotion Criteria**:
```pseudocode
function shouldPromoteToSharedMemory(knowledge):
  if knowledge.type in ['architectural_decision', 'api_contract', 'bug_pattern']:
    return true
  if knowledge.reuse_likelihood > 0.8:
    return true
  if knowledge.impacts_other_agents:
    return true
  return false
```

### 2. Instance Spawning & Branching

**Conversation Branching Pattern**:
```
Initial Developer Conversation:
└── auth-dev-001: "Implement OAuth flow"
    ├── Branch: auth-dev-002: "Handle OAuth error cases"
    ├── Branch: auth-dev-003: "Implement token refresh"
    ├── Branch: auth-dev-004: "Add OAuth provider config"
    └── Branch: auth-dev-005: "Write OAuth tests"
```

**Instance Identity**:
```
Format: {specialization}-{role}-{instance}
Examples:
- auth-dev-001 (first auth developer instance)
- auth-dev-002 (second parallel instance)
- ui-dev-001 (UI specialist instance)
- db-dev-001 (database specialist instance)
```

### 3. Scrum Master Orchestration

**Responsibilities**:
```typescript
interface ScrumMaster {
  // Work Assignment
  reviewBacklog(): WorkItem[]
  selectOptimalRole(work: WorkItem): AgentRole
  spawnSpecialist(role: AgentRole, context: Context): AgentInstance
  
  // Dynamic Role Creation
  identifyMissingExpertise(work: WorkItem): string
  createNewRole(expertise: string): AgentRole  // via agentify
  
  // Progress Tracking
  monitorActiveInstances(): InstanceStatus[]
  coordinateDependencies(): void
  updateProjectStatus(): void
}
```

**Scrum Master Terminal Spawning** (if feasible):
```pseudocode
// From within Docker container
function spawnNewAgent(role, specialization, parentContext?):
  // Use AppleScript/automation to:
  // 1. Create new terminal tab in VS Code
  // 2. Initialize Claude with role/specialization
  // 3. Pass parent context if branching
  // 4. Register session for recovery
```

### 4. Session Management (Simplified)

**Session Record**:
```typescript
interface EphemeralSession {
  session_id: string          // "auth-dev-001-20250701"
  role: string               // "developer"
  specialization: string     // "authentication"
  instance_number: number    // 001, 002, etc.
  
  // Conversation State
  parent_session?: string    // If branched from another
  conversation_id: string    
  worktree: string
  status: 'active' | 'completed' | 'abandoned'
  
  // Context
  ephemeral_memory: string   // This conversation only
  accessed_memories: string[] // Which shared memories used
  generated_insights: string[] // Potential for promotion
}
```

### 5. Active Conversations List

**Not a Team Roster, but Active Work Tracker**:
```
Active Conversations (2025-07-01 15:00)
=====================================

Authentication Work:
├── auth-dev-001: OAuth provider setup (2h active)
├── auth-dev-002: Error handling (30m active) [branched from 001]
└── auth-dev-003: Token refresh (10m active) [branched from 001]

UI Development:
├── ui-dev-001: Dashboard layout (3h active)
└── ui-dev-002: Component styling (1h active)

Database Work:
└── db-dev-001: Schema migrations (45m active)

Total: 6 active specialist instances
```

## Key Differences from Human Team Model

| Human Team Model | Borg Collective Model |
|-----------------|---------------------|
| Persistent identities | Ephemeral instances |
| Individual expertise | Collective knowledge |
| Long-lived conversations | Task-focused sessions |
| Personal context | Shared memory pools |
| Fixed team size | Dynamic spawning |
| Individual assignments | Orchestrated by Scrum Master |

## Implementation Approach

### Phase 1: Collective Memory System
- Implement memory hierarchy
- Define promotion criteria
- Create memory access patterns

### Phase 2: Instance Management
- Session spawning with specialization
- Conversation branching mechanism
- Instance lifecycle tracking

### Phase 3: Scrum Master Role
- Work assignment logic
- Dynamic role creation via agentify
- Progress monitoring

### Phase 4: Recovery & Persistence
- Recover active conversations after crash
- Restore ephemeral context
- Maintain collective memory integrity

## Example Workflow

```
1. Scrum Master reviews backlog
2. Identifies need for OAuth implementation
3. Spawns auth-dev-001 with OAuth specialization
4. auth-dev-001 works on main flow, identifies 3 sub-tasks
5. User branches 3 new conversations from auth-dev-001
6. Now 4 parallel auth specialists working
7. Each updates collective memory with key insights
8. Sessions complete, instances terminated
9. Next OAuth task benefits from collective knowledge
```

## Integration Points

### With Existing Systems
- `.claude/conversations.yaml` - Track active conversations
- `apm/agents/{role}/MEMORY.md` - Role-level collective memory
- Slack integration - Scrum Master coordination
- VS Code terminals - Instance spawning

### With Agentify (TODO)
- Dynamic role creation
- Specialization definition
- Context initialization

This architecture embraces the fundamental difference between AI agents and human teams, creating a more powerful and flexible system for parallel specialized work.