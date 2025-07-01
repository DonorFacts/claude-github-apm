# APM Collective Intelligence - 1-Day Implementation Plan

**Date**: 2025-07-01  
**Goal**: Implement crash recovery with conversation search by end of day  
**Philosophy**: Build working solutions iteratively, not perfect systems

## Hour-by-Hour Plan

### Hours 1-2: Basic Crash Recovery (Priority #1)
**Goal**: Never lose agent conversations again

**Deliverables**:
```bash
# Working commands
apm list                  # Shows active/crashed sessions
apm recover <id>          # Restores specific session
apm recover all           # Restores all crashed sessions
```

**Implementation**:
1. Create `../apm/scripts/apm` CLI (30 min)
2. Build session registry in `../apm/sessions/registry.json` (30 min)
3. Implement heartbeat tracking (30 min)
4. Basic recovery with context restoration (30 min)

**Test**: Kill a Claude session → `apm recover` → session restored ✓

### Hours 3-4: Conversation Storage & Search
**Goal**: Enable cross-conversation references

**Deliverables**:
```bash
# Agent can search other conversations
"I was discussing OAuth with another agent"
→ Agent finds and loads relevant context
```

**Implementation**:
1. YAML conversation storage (30 min)
   ```yaml
   # ../apm/conversations/active/auth-dev-001.yaml
   messages:
     - role: user
       content: "..."
     - role: assistant
       content: "..."
   ```

2. Search script `../apm/scripts/search/search-conversations.sh` (30 min)
   ```bash
   grep -r "$query" ../apm/conversations/active/*.yaml
   ```

3. Context extraction for agents (30 min)
4. Integration with agent prompts (30 min)

**Test**: Start 2 agents → discuss OAuth in one → other can find it ✓

### Hours 5-6: Intelligent Read Tool
**Goal**: 90% token reduction on code reading

**Deliverables**:
```
Read src/auth/oauth.ts → Get summary instead of 3000 lines
```

**Implementation**:
1. Override Read tool wrapper (45 min)
2. Summary generation script (45 min)
3. Basic staleness detection (30 min)

**Test**: Read large file → get summary → verify token savings ✓

### Hours 7-8: Integration & Polish
**Goal**: Everything works together smoothly

**Tasks**:
1. Metadata injection system (30 min)
   - Token counts
   - Git status
   - Timestamp

2. APM CLI improvements (30 min)
   - Better output formatting
   - Error handling
   - Help documentation

3. Testing & bug fixes (45 min)
4. Documentation updates (15 min)

## Minimal Viable Implementation

### Core Scripts Structure
```
../apm/
├── scripts/
│   ├── apm                       # Main CLI
│   ├── recovery/
│   │   ├── list-sessions.sh
│   │   ├── recover-session.sh
│   │   └── heartbeat.sh
│   ├── search/
│   │   ├── search-conversations.sh
│   │   └── extract-context.sh
│   └── summarize/
│       ├── generate-summary.sh
│       └── check-staleness.sh
├── conversations/
│   └── active/
└── sessions/
    └── registry.json
```

### Quick Start Implementation

#### 1. APM CLI (Hour 1)
```bash
#!/bin/bash
# ../apm/scripts/apm

case "$1" in
  list)
    ./recovery/list-sessions.sh "$@"
    ;;
  recover)
    ./recovery/recover-session.sh "$@"
    ;;
  search)
    ./search/search-conversations.sh "$@"
    ;;
  *)
    echo "Usage: apm {list|recover|search}"
    ;;
esac
```

#### 2. Session Registry (Hour 1)
```json
{
  "sessions": [
    {
      "id": "auth-dev-001-20250701",
      "status": "active",
      "last_heartbeat": "2025-07-01T15:30:00Z",
      "worktree": "feature-auth",
      "context_file": "context/latest.md"
    }
  ]
}
```

#### 3. Conversation Search (Hour 3)
```bash
#!/bin/bash
# search-conversations.sh

query="$1"
results=$(grep -r "$query" ../conversations/active/*.yaml -A 2 -B 2)
echo "$results" | head -50  # Limit output
```

#### 4. Summary Generation (Hour 5)
```typescript
// Quick summary generator using Claude
async function generateSummary(filePath: string) {
  const content = await fs.readFile(filePath);
  if (content.split('\n').length < 50) return content;
  
  const summary = await claude.complete({
    prompt: `Summarize this code file in <500 words...`,
    max_tokens: 1000
  });
  
  await fs.writeFile(`${filePath}-summary.md`, summary);
  return summary;
}
```

## Success Criteria

### By Hour 4 ✓
- Crash recovery working
- Conversations searchable
- Basic system operational

### By Hour 8 ✓
- Intelligent Read saving tokens
- Full integration tested
- Documentation complete

## What We're NOT Building Today

1. **Slack integration** - Phase 2
2. **Dynamic role loading** - Phase 2  
3. **Automatic memory promotion** - Phase 2
4. **Scrum Master role** - Phase 3
5. **Perfect code** - Iterate tomorrow

## Development Approach

1. **Start Simple**: Bash scripts that work
2. **Test Continuously**: Each hour has working feature
3. **Document as We Go**: Update docs with learnings
4. **User-First**: Solve Jake's immediate pain (crash recovery)
5. **Iterate Tomorrow**: Perfect is enemy of done

## Risk Mitigation

- **Complexity**: Start with simplest implementation
- **Integration Issues**: Test each component standalone first
- **Time Pressure**: Core features in first 4 hours
- **Technical Debt**: Document TODOs for tomorrow

## The Power of One Day

With focused effort:
- **Morning**: Never lose work to crashes again
- **Afternoon**: Agents become collectively intelligent
- **Evening**: Token usage drops 90% on code reading

This plan is aggressive but achievable because:
1. We're building on existing APM infrastructure
2. Bash scripts are fast to implement
3. Core ideas are well-designed
4. We can iterate tomorrow

Ready to build? Let's start with crash recovery - your most urgent need.