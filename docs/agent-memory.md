# Agent Memory Architecture

## Overview

This document describes the memory architecture for supporting multiple concurrent agent instances across different VS Code windows and git worktrees. The system uses git commits as the synchronization mechanism, with each branch maintaining its own memory files that are synchronized to main and then propagated to other branches through regular git fetches.

## Directory Structure

### Git-Based Memory System
```
www/claude-github/
├── claude-github-apm/              ← Main branch worktree
│   ├── apm/
│   │   ├── agents/
│   │   │   ├── registry/
│   │   │   │   ├── active/         ← Current agent instances
│   │   │   │   │   ├── developer__main-branch__jake-auth-refactor__abc123.md
│   │   │   │   │   ├── developer__feature-auth__jake-oauth-impl__xyz789.md
│   │   │   │   │   └── prompt-engineer__feature-docs__solo-api-docs__def456.md
│   │   │   │   └── archive/        ← Previous sessions (context window full)
│   │   │   │       ├── developer__feature-auth__jake-oauth-impl__xyz789__session-001.md
│   │   │   │       ├── developer__feature-auth__jake-oauth-impl__xyz789__session-002.md
│   │   │   │       └── developer__main-branch__jake-api-design__old123__session-001.md
│   │   │   ├── developer/
│   │   │   │   ├── MEMORY.md
│   │   │   │   ├── instances/
│   │   │   │   │   ├── abc123/     ← Instance-specific context
│   │   │   │   │   │   └── latest.md
│   │   │   │   │   └── xyz789/
│   │   │   │   │       └── latest.md
│   │   │   │   └── knowledge/
│   │   │   └── prompt-engineer/
│   │   ├── communications/
│   │   │   ├── developer__main-branch__jake-auth-refactor__abc123/
│   │   │   │   ├── inbox/
│   │   │   │   └── outbox/
│   │   │   ├── developer__feature-auth__jake-oauth-impl__xyz789/
│   │   │   │   ├── inbox/
│   │   │   │   └── outbox/
│   │   │   └── broadcasts/
│   │   └── sessions/
│   │       ├── active/
│   │       │   ├── session__main-branch__abc123__auth-refactor.md
│   │       │   └── session__feature-auth__xyz789__oauth-implementation.md
│   │       └── archive/
│   │           └── session__feature-auth__xyz789__oauth-implementation__session-001.md
│   └── src/
└── worktrees/
    ├── feature-auth/
    │   ├── apm/                    ← Independent copy, synced via git
    │   │   ├── agents/
    │   │   ├── communications/
    │   │   └── sessions/
    │   └── src/
    └── feature-api/
        ├── apm/                    ← Independent copy, synced via git
        └── src/
```

### Git Synchronization Strategy

**Version Controlled (Committed to Git):**
- `apm/agents/*/MEMORY.md` - Persistent role-based learnings
- `apm/agents/*/knowledge/` - Reusable patterns and solutions  
- `apm/communications/` - All inter-agent messages and coordination
- `apm/agents/*/instances/*/latest.md` - Agent context for handoffs

**Excluded from Git (.gitignore):**
```gitignore
# Ephemeral runtime data  
*.tmp
*.lock
*.swp
.DS_Store
```

**Note**: Registry files are now included in git for better coordination and handoff tracking.

**Synchronization Flow:**
1. **Agent Updates** → Commit to current branch
2. **Push to Main** → Direct push for memory/communication commits
3. **Propagate** → Other branches fetch from main every 5 minutes
4. **Merge** → Automatic merge unless conflicts (escalate to Jake)

## Memory Types & Purposes

### 1. Instance Memory
**Location**: `apm/agents/<role>/instances/<branch-instance-id>/latest.md`
**Purpose**: Current session state, work in progress, conversation history
**Scope**: Single agent instance in specific branch
**Lifetime**: Duration of agent session
**Git Status**: Excluded (ephemeral)

### 2. Role Memory
**Location**: `apm/agents/<role>/MEMORY.md`
**Purpose**: Accumulated learnings across ALL branches for this role type
**Scope**: All instances of same role across all worktrees
**Lifetime**: Persistent, grows over time
**Git Status**: Included (valuable knowledge)

### 3. Cross-Branch Knowledge
**Location**: `apm/agents/<role>/knowledge/`
**Purpose**: Patterns, solutions, and best practices discovered in any branch
**Scope**: All agents of same role across all worktrees
**Lifetime**: Persistent, curated collection
**Git Status**: Included (reusable solutions)

### 4. Agent Registry
**Location**: `apm/agents/registry/active/<instance-filename>.md`
**Purpose**: Real-time tracking of all active agent instances with rich context
**Scope**: System-wide coordination with human-readable status
**Lifetime**: Dynamic, moved to archive/ when context window full
**Git Status**: Included (valuable for coordination and handoffs)

**Filename Convention**: `<role>__<branch>__<work-area>__<instance-id>.md`

**Archive Location**: `apm/agents/registry/archive/<instance-filename>__session-<number>.md`
**Purpose**: Historical record of agent sessions and context handoffs
**Scope**: Institutional memory and agent evolution tracking
**Lifetime**: Persistent historical record

## Instance Naming Convention

### Registry Filename Format
`<role>__<branch>__<work-area>__<instance-id>.md`

**Examples**:
- `developer__main-branch__jake-auth-refactor__abc123.md`
- `developer__feature-auth__jake-oauth-impl__xyz789.md`
- `prompt-engineer__feature-docs__solo-api-docs__def456.md`
- `scrum-master__main-branch__jake-project-mgmt__ghi789.md`

### Instance ID Preservation
Instance IDs persist across context window handoffs:
- **Session 1**: `xyz789` (active)
- **Session 2**: `xyz789__session-001` (archived), `xyz789` (new active)
- **Session 3**: `xyz789__session-002` (archived), `xyz789` (new active)

This ensures communication continuity and Jake's mental model consistency.

## Memory Operations

### Agent Initialization
```typescript
// Example agent startup sequence
const branchName = getCurrentBranch();
const workArea = "jake-oauth-impl"; // Derived from current task
const instanceId = generateId(); // e.g., "xyz789"
const registryFilename = `developer__${branchName}__${workArea}__${instanceId}.md`;

// Register in active registry
await createAgentRegistry(registryFilename, {
  role: 'developer',
  branch: branchName,
  workArea: workArea,
  instanceId: instanceId,
  sessionNumber: 1,
  status: 'active',
  startedAt: new Date().toISOString()
});

// Load role memory and setup communication
await loadRoleMemory('developer');
await setupCommunication(instanceId);
```

### Context Saving (Enhanced)
Extends existing `context-save.md` pattern:

1. **Save Instance Context**: `apm/agents/<role>/instances/<branch-instance>/latest.md`
2. **Update Role Memory**: Merge learnings into `apm/agents/<role>/MEMORY.md`
3. **Contribute Knowledge**: Add reusable patterns to `apm/agents/<role>/knowledge/`
4. **Update Activity**: Timestamp in global registry

### Git-Based Synchronization
```bash
# Send message (creates file + commits + pushes to main)
tsx src/memory/cli/send-message.ts \
  --to="feature-auth-xyz789" \
  --topic="API Breaking Change" \
  --message="Auth endpoint structure changed in main"
# Creates: apm/communications/feature-auth-xyz789/inbox/20250626_143045__main-abc123__api-breaking-change.md
# Commits: [COMM] main-abc123 → feature-auth-xyz789: API Breaking Change
# Pushes directly to main branch

# Background sync (runs every 5 minutes)
tsx src/memory/cli/sync-from-main.ts
# Fetches latest commits from main and merges communication/memory updates

# Configure sync frequency
tsx src/memory/cli/configure-sync.ts --interval=5
```

## Jake's Orchestration Tools

### Multi-Terminal Management
```bash
# Overview of all active agents across all VS Code windows
tsx src/memory/cli/agent-dashboard.ts

# What's happening in each branch?
tsx src/memory/cli/branch-activity-summary.ts

# Any coordination opportunities or conflicts?
tsx src/memory/cli/coordination-analyzer.ts
```

### Example Output:
```
=== Agent Activity Dashboard ===
Main Branch (main-abc123):
  Role: Developer  
  Status: Active - Working on payment API
  Last Activity: 2 minutes ago
  
Feature Auth (auth-xyz789):
  Role: Developer
  Status: Active - Implementing OAuth flow  
  Last Activity: 1 minute ago
  
⚠️  Coordination Alert:
Both agents working on authentication-related code.
Consider synchronization before merge.
```

## Setup Instructions

### Initial Setup (One-time)
```bash
# Initialize memory structure in main branch
cd www/claude-github/claude-github-apm
tsx src/memory/cli/init-memory-system.ts

# This creates:
# apm/agents/registry/active/.gitkeep
# apm/agents/registry/archive/.gitkeep
# apm/communications/.gitkeep
# apm/sessions/active/.gitkeep
# apm/sessions/archive/.gitkeep

git add apm/
git commit -m "Initialize APM memory system with registry structure"
git push origin main
```

### Adding New Worktrees
```bash
# After creating new worktree
cd www/claude-github/worktrees/new-feature

# Fetch latest memory structure from main
git fetch origin main
git merge origin/main

# Initialize agent instance (creates registry entry)
tsx src/memory/cli/init-agent-instance.ts \
  --role=developer \
  --work-area="jake-payment-api" \
  --branch="feature-payment"

# Start background sync
tsx src/memory/cli/start-sync-daemon.ts --interval=5
```

## Security Considerations

### Access Control
- **Git-based permissions**: Standard git repository permissions apply
- **Branch protection**: Communication commits bypass PR requirements
- **Sensitive data**: Never store secrets or credentials in memory files
- **Audit trail**: Complete git history of all memory operations

### Data Protection
```bash
# Configure git to handle memory commits
git config user.name "APM Agent System"
git config user.email "apm-agent@local"

# Exclude sensitive patterns
echo "*.secret" >> .gitignore
echo "*.key" >> .gitignore
echo "*.env" >> .gitignore
```

## Benefits

1. **Git-Native Synchronization**: Uses git's robust merge and conflict resolution
2. **Complete Audit Trail**: Every communication and memory update is version controlled
3. **Cross-Platform Compatibility**: No symlink dependencies, works everywhere
4. **Automatic Conflict Resolution**: Unique naming prevents most conflicts
5. **Jake's Oversight**: All coordination visible in git history
6. **Resilient**: Works offline, syncs when connection restored
7. **Scalable**: Standard git operations handle any number of agents/branches

## Migration from Existing System

### Phase 1: Git-Based Foundation
1. Initialize memory structure in main branch
2. Implement sync scripts and background daemon
3. Create communication and memory management CLI tools
4. Update `.gitignore` for ephemeral data exclusion

### Phase 2: Agent Integration
1. Update agent initialization to use git-sync memory
2. Enhance context-save process to commit memory updates
3. Implement cross-branch communication workflows
4. Add Jake's coordination dashboard tools

### Phase 3: Testing and Optimization
1. Test multi-agent scenarios across worktrees
2. Optimize sync frequency and conflict resolution
3. Add monitoring and health check capabilities
4. Document best practices and troubleshooting guides

This git-based architecture provides robust cross-branch coordination while leveraging git's proven synchronization and conflict resolution capabilities.