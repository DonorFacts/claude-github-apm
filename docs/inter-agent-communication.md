# Inter-Agent Communication Architecture

## Overview

This document describes how multiple Claude Code agents coordinate across different VS Code windows, branches, and worktrees using a git-based communication system. The architecture enables effective coordination while respecting Jake's central orchestration role and Claude Code's interactive session model.

## Git-Based Communication Flow

### Core Architecture
- **Each branch maintains its own `apm/` directory** with communication files
- **Messages are committed with `[COMM]` prefix** and automatically pushed to main
- **Background sync every 5 minutes** fetches updates from main to all branches
- **Unique naming prevents conflicts**: `<YYYYMMDD_HHMMSS>__<sender-instance-id>__<subject>.md`

### Communication Flow Example

#### Step 1: Agent A Discovers Important Information
Agent A (main branch) discovers an API breaking change affecting other agents.

#### Step 2: Agent A Sends Message
```bash
tsx src/memory/cli/send-message.ts \
  --to="feature-auth-xyz789" \
  --topic="API Breaking Change" \
  --priority="high" \
  --message="Auth endpoints changed - OAuth implementation needs updates"
```

**What happens automatically:**
1. Creates: `apm/communications/developer__feature-auth__jake-oauth-impl__xyz789/inbox/20250626_143045__developer__main-branch__jake-auth-refactor__abc123__api-breaking-change.md`
2. Commits: `[COMM] developer__main-branch__jake-auth-refactor__abc123 → developer__feature-auth__jake-oauth-impl__xyz789: API Breaking Change`
3. Pushes directly to main branch (bypasses PR process)

#### Step 3: Agent B Receives Message
Agent B's feature-auth branch automatically syncs from main every 5 minutes.

```bash
# Background process runs:
tsx src/memory/cli/sync-from-main.ts
# Fetches and merges communication updates from main
```

#### Step 4: Agent B Processes Message
```bash
# Agent B checks inbox during normal workflow
tsx src/memory/cli/check-inbox.ts
# Shows: "High priority message from main-abc123 about API Breaking Change"
```

#### Step 5: Agent B Responds
```bash
tsx src/memory/cli/send-message.ts \
  --to="main-abc123" \
  --topic="Re: API Breaking Change" \
  --message="Acknowledged. Pausing OAuth work to update auth calls. ETA 30 mins."
```

**Result**: Complete communication cycle with full git audit trail.

## Message Types & Formats

### Direct Messages
**Purpose**: Specific agent-to-agent communication
**Location**: `apm/communications/<target-instance>/inbox/`
**Filename**: `<YYYYMMDD_HHMMSS>__<sender-instance-id>__<subject-line>.md`

**Format** (Markdown with YAML frontmatter):
```markdown
---
id: "20250626_143045__main-abc123__api-breaking-change"
timestamp: "2025-06-26T14:30:45Z"
from:
  instanceId: "main-abc123"
  role: "developer"
  branch: "main"
to:
  instanceId: "feature-auth-xyz789"
  role: "developer"
  branch: "feature-auth"
topic: "API Breaking Change"
priority: "high"
actionRequired: true
references: ["commit:abc123", "file:src/auth/api.ts"]
status: "unread"
---

# API Breaking Change Alert

Authentication endpoint structure changed in commit abc123. Your OAuth implementation may need updates.

## Details
- Endpoint: `/api/auth/login`
- Change: Response format now includes `tokenType` field
- Impact: OAuth flow validation needs updating

## Action Required
Please review and update OAuth implementation before next merge.

## References
- Commit: abc123
- Files: src/auth/api.ts, src/auth/types.ts
- PR: #456 (pending merge)
```

### Broadcast Messages
**Purpose**: Announcements to multiple agents
**Location**: `apm/communications/broadcasts/`
**Filename**: `<YYYYMMDD_HHMMSS>__broadcast__<subject-line>.md`

### Coordination Requests
**Purpose**: Requests for Jake to facilitate coordination
**Location**: `apm/communications/coordination-requests/`
**Filename**: `<YYYYMMDD_HHMMSS>__coord-request__<subject-line>.md`

## Communication Scripts

### For Agents
```bash
# Send message (auto-commits and pushes to main)
tsx src/memory/cli/send-message.ts \
  --to="developer__feature-auth__jake-oauth-impl__xyz789" \
  --topic="API Breaking Change" \
  --priority="high" \
  --message="Auth endpoint changed in main branch" \
  --action-required=true

# Sync latest communications from main
tsx src/memory/cli/sync-from-main.ts

# Check inbox for new messages
tsx src/memory/cli/check-inbox.ts \
  --show-unread-only=true

# Send broadcast to all developers
tsx src/memory/cli/broadcast-message.ts \
  --audience="role:developer" \
  --topic="Code Review" \
  --message="PR #123 needs review"

# Request coordination from Jake
tsx src/memory/cli/request-coordination.ts \
  --type="conflict" \
  --description="API endpoint conflicts detected" \
  --affected-agents="feature-auth-xyz789,feature-api-def456"
```

### For Jake's Orchestration
```bash
# Dashboard of all communication activity across branches
tsx src/memory/cli/communication-dashboard.ts

# Check coordination requests from all agents
tsx src/memory/cli/check-coordination-requests.ts

# Broadcast message from Jake to all agents
tsx src/memory/cli/jake-broadcast.ts \
  --message="Standup meeting in 10 minutes"

# Status summary across all worktrees
tsx src/memory/cli/cross-branch-status.ts

# Configure sync settings
tsx src/memory/cli/configure-sync.ts \
  --interval=5 \
  --auto-resolve-conflicts=true

# Manual sync trigger for all branches
tsx src/memory/cli/force-sync-all-branches.ts
```

## Communication Workflows

### Workflow 1: API Breaking Change Discovery
1. **Developer A** (main branch) discovers breaking change
2. **Developer A** sends message to **Developer B** (feature-auth branch)
   - Creates message file with unique timestamp + instance ID naming
   - Commits with `[COMM] main-abc123 → feature-auth-xyz789: API Breaking Change`
   - Pushes directly to main branch (bypasses PR process)
3. **Developer A** creates coordination request for **Jake**
4. **Developer B** receives message via automatic sync (within 5 minutes)
5. **Developer B** reads message during normal inbox check
6. **Developer B** responds with acknowledgment (same commit/push process)
7. **Jake** sees coordination activity and can facilitate real-time discussion if needed

### Workflow 2: Code Review Coordination
1. **Developer A** completes feature and creates PR
2. **Developer A** broadcasts to all developers about review need
   - Creates broadcast message, commits with `[COMM]` prefix, pushes to main
3. **All developer branches** receive broadcast on next sync
4. **Jake** sees broadcast activity in communication dashboard
5. **Jake** facilitates review assignment through messages or real-time discussion

### Workflow 3: Merge Conflict Prevention
1. **Multiple developers** working on overlapping code areas
2. **Topic monitoring** detects potential conflicts via context analysis
3. **System** creates coordination request, commits to main
4. **Jake** sees alert in coordination dashboard
5. **Jake** facilitates synchronization through messaging or real-time discussion
6. **Resolution** tracked through message threads in git history

## Topic Detection & Monitoring

### Automatic Topic Extraction
Agents identify topics they're working on from context:
```typescript
// Extracted during context saves
const currentTopics = ["authentication", "api-endpoints", "oauth-flow"];
```

### Cross-Branch Topic Monitoring
```bash
# Find who else is working on authentication (searches across all branches)
tsx src/memory/cli/topic-search.ts --topic="authentication"

# Output:
# feature-auth-xyz789: Working on OAuth implementation
# main-abc123: Refactoring auth middleware
# ⚠️ Potential coordination needed - both modifying auth/*
```

### Conflict Detection
```typescript
// Automatic conflict detection across branches
const potentialConflicts = detectTopicOverlap([
  { agent: "main-abc123", topics: ["authentication", "api-endpoints"] },
  { agent: "feature-auth-xyz789", topics: ["authentication", "oauth-flow"] }
]);
// Result: Overlap on "authentication" - coordination suggested
```

## Jake's Communication Dashboard

### Real-Time Overview
```
=== Communication Dashboard ===
📨 Unread Messages: 3 (across all branches)
🔔 Coordination Requests: 1
📢 Active Broadcasts: 2
⚠️  Potential Conflicts: 1
🔄 Last Sync: 2 minutes ago
📊 Sync Status: All branches up-to-date

Recent Activity (from git log):
[14:30] [COMM] main-abc123 → feature-auth-xyz789: API Breaking Change (HIGH)
[14:28] [COMM] Broadcast to role:developer: PR #123 review needed
[14:25] [COMM] main-abc123: Coordination request - API conflicts

Suggested Actions:
1. Check feature-auth terminal for API change response
2. Assign developer for PR #123 review
3. Resolve API conflict coordination
```

### Terminal Switch Briefing
```bash
# Before switching to feature-auth terminal
tsx src/memory/cli/terminal-switch-brief.ts --to-branch="feature-auth"

# Output:
# Switching to feature-auth branch (feature-auth-xyz789)
# 📨 1 unread message about API breaking change (HIGH priority)
# 🔄 Branch sync status: Up-to-date (last sync: 3 minutes ago)
# 🎯 Agent context: Working on OAuth implementation
# ⚠️ Potential conflict with main branch API work
# 💡 Suggestion: Have agent check inbox first
```

## Synchronization System

### Background Sync Process
```bash
# Runs every 5 minutes (configurable)
tsx src/memory/cli/sync-daemon.ts --interval=5

# What it does:
# 1. git fetch origin main
# 2. git merge origin/main (if no conflicts)
# 3. Update agent about new communications
# 4. Log sync status and any issues
```

### Sync Configuration
```bash
# Configure sync interval
tsx src/memory/cli/configure-sync.ts --interval=5

# Enable/disable auto-sync
tsx src/memory/cli/configure-sync.ts --auto-sync=true

# Set conflict resolution strategy
tsx src/memory/cli/configure-sync.ts --auto-resolve=true
```

### Conflict Resolution
When sync conflicts occur:
1. **Stop automatic sync** for affected branch
2. **Create coordination request** for Jake
3. **Provide conflict details** and suggested resolution
4. **Resume sync** after manual resolution

## Git Integration

### Commit Message Conventions
- **Communication**: `[COMM] sender → receiver: topic`
- **Memory Updates**: `[MEMORY] role: description`
- **Coordination**: `[COORD] type: description`

### Git History Analysis
```bash
# View all communication history
git log --grep="\[COMM\]" --oneline
# a1b2c3d [COMM] main-abc123 → feature-auth-xyz789: API Breaking Change
# d4e5f6g [COMM] feature-auth-xyz789 → main-abc123: Re: API Breaking Change

# View memory updates
git log --grep="\[MEMORY\]" --oneline
# g7h8i9j [MEMORY] developer: OAuth implementation patterns
# j9k0l1m [MEMORY] developer: API design best practices

# View coordination activity
git log --grep="\[COORD\]" --oneline
# m1n2o3p [COORD] conflict: API endpoint overlap detected
```

### Branch-Specific Communication
Each branch maintains its own communication state while syncing shared updates:
```
feature-auth/apm/communications/
├── developer__feature-auth__jake-oauth-impl__xyz789/
│   ├── inbox/           ← Messages TO this agent
│   └── outbox/          ← Messages FROM this agent
├── broadcasts/          ← System-wide announcements
└── coordination-requests/ ← Requests for Jake
```

## Security & Privacy

### Message Security
- **No sensitive data**: Never include credentials or secrets in messages
- **Git-based encryption**: Use git-crypt for sensitive repositories if needed
- **Access control**: Standard git repository permissions apply

### Audit Trail
- **Complete history**: Every communication tracked in git commits
- **Immutable record**: Git history provides tamper-evident audit trail
- **Searchable logs**: Use git log for communication analysis

### Data Retention
```bash
# Configure automatic cleanup of old messages
tsx src/memory/cli/configure-retention.ts \
  --messages-days=30 \
  --broadcasts-days=7 \
  --coordination-days=90
```

## System Health & Monitoring

### Sync Health Monitoring
```bash
# Check sync status across all branches
tsx src/memory/cli/sync-health-check.ts

# Output:
# main: ✅ Up-to-date (last sync: 2min ago)
# feature-auth: ✅ Up-to-date (last sync: 1min ago)  
# feature-api: ⚠️ Sync delayed (last sync: 8min ago)
# feature-docs: ❌ Sync failed (conflict in apm/communications/)
```

### Communication Metrics
```bash
# View communication statistics
tsx src/memory/cli/communication-stats.ts

# Output:
# Messages sent: 45 (last 24h)
# Average response time: 12 minutes
# Most active agents: main-abc123 (15 msgs), feature-auth-xyz789 (12 msgs)
# Topics with most activity: authentication (8), api-design (6)
```

## Integration with Existing Systems

### Context Save Enhancement
Enhanced context save includes communication and sync status:
```markdown
## Communication Status
- 📨 Unread Messages: 2 (1 high priority)
- 📤 Sent Messages: 5 (3 acknowledged)
- 🔔 Coordination Requests: 1 pending
- 📢 Broadcasts: Participating in PR review discussion
- 🔄 Last Sync: 2025-06-26T14:35:00Z
- 📊 Pending Commits: 2 communication commits to push
```

### Agent Initialization
Enhanced agent init includes communication setup and registry creation:
```bash
# Initialize agent with communication capabilities
tsx src/memory/cli/init-agent-instance.ts \
  --role=developer \
  --work-area="jake-oauth-impl" \
  --branch="feature-auth" \
  --enable-communication=true \
  --sync-interval=5

# Creates:
# - apm/agents/registry/active/developer__feature-auth__jake-oauth-impl__xyz789.md
# - apm/communications/developer__feature-auth__jake-oauth-impl__xyz789/inbox/
# - apm/communications/developer__feature-auth__jake-oauth-impl__xyz789/outbox/
```

## Benefits

1. **Git-Native Architecture**: Uses proven git synchronization and conflict resolution
2. **Complete Audit Trail**: Every communication tracked in git history with timestamps
3. **Automatic Synchronization**: 5-minute background sync keeps all branches updated
4. **Conflict Prevention**: Unique naming convention prevents file conflicts
5. **Cross-Platform Reliability**: No symlinks or platform-specific dependencies
6. **Jake's Orchestration**: Central dashboard with cross-branch visibility
7. **Resilient Operation**: Works offline, syncs when connectivity restored
8. **Scalable**: Standard git operations handle unlimited agents and branches

## Best Practices

### For Agents
- Include context, references, and action items in messages
- Use appropriate priority levels (high/medium/low)
- Follow naming convention for conflict-free commits
- Let sync daemon handle propagation (don't force immediate sync)
- Acknowledge important messages with responses

### For Jake
- Check communication dashboard regularly for coordination needs
- Use terminal switch briefings to understand branch context
- Configure sync intervals based on coordination requirements
- Monitor git history for communication patterns and issues
- Escalate to real-time discussion when async isn't sufficient

### For System Maintenance
- Monitor sync daemon health across all branches
- Clean up old communication files periodically
- Review git history for communication bottlenecks
- Adjust sync frequency based on activity levels

This git-based communication architecture provides robust, version-controlled coordination that scales with your multi-agent development workflow while maintaining Jake's central orchestration role.