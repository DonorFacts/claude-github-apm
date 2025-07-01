# APM Collective Intelligence - Quick Reference

## The Vision in One Page

### What We're Building
A **collective intelligence system** where AI agents operate as ephemeral instances sharing collective memory, with crash recovery, cross-conversation search, and intelligent context management.

### Core Commands (Day 1 Goals)
```bash
# Never lose work again
apm list                    # See all active/crashed sessions
apm recover all             # Restore crashed conversations
apm recover auth-dev-001    # Restore specific session

# Search across conversations  
apm search "OAuth refresh"  # Find discussions in any agent

# Intelligent context (via tool overrides)
Read src/auth/oauth.ts      # Returns summary, not 3000 lines
```

### Architecture at a Glance

```
📁 ../apm/
├── 💬 conversations/        # YAML storage, searchable
├── 📝 code-summaries/       # Auto-generated, token-efficient
├── 🧠 memory/              # Collective knowledge
├── 🔧 scripts/             # All operations externalized
└── 🔄 sessions/            # Recovery registry

Key Innovations:
✓ Agents are ephemeral (not persistent personas)
✓ Memory is collective (shared knowledge pools)
✓ Context is intelligent (summaries over syntax)
✓ Search is universal (any agent, any conversation)
✓ Capabilities stack (developer + architect + PE)
```

### Token Economics
- **Traditional Read**: 15,000 tokens (full file)
- **Intelligent Read**: 1,500 tokens (summary + snippets)
- **Savings**: 90% reduction → 10x more context headroom

### User Stories Solved

1. **"My Mac restarted overnight"**
   → `apm recover all` → All 12 agents restored

2. **"I discussed this with another agent"**
   → Agent searches → Finds context → No terminal hunting

3. **"Context window is filling up"**
   → Intelligent reads → Summaries → 90% token savings

4. **"Need both dev and architect perspective"**
   → "Put on architect hat" → Capabilities stack

### Implementation Priority
1. **Hours 1-2**: Crash recovery (most urgent)
2. **Hours 3-4**: Conversation search 
3. **Hours 5-6**: Intelligent Read tool
4. **Hours 7-8**: Integration & polish

### Key Design Decisions
- **YAML** over JSON (human-readable, grep-friendly)
- **Bash scripts** over complex code (fast, maintainable)
- **Summaries** over full files (token efficiency)
- **Collective** over individual (knowledge sharing)
- **Progressive** over front-loaded (load as needed)

### Success Metrics
- ✓ Zero lost conversations after crashes
- ✓ <5 seconds to find any discussion
- ✓ 90% token reduction on code reading
- ✓ Seamless capability switching
- ✓ One day to working system

### The Philosophy
"Agents aren't team members with persistent identities. They're ephemeral access points to a collective intelligence - like waves in an ocean, appearing separate but fundamentally one."

### Next Action
```bash
cd ../apm
mkdir -p scripts conversations sessions memory
echo "Let's build crash recovery first"
```