# APM Architecture Design Evolution & Insights

This document preserves key insights and ideas from the architecture evolution process.

## Evolution Timeline

1. **Phase 1**: Persistent Team Management (human-like agents)
2. **Phase 2**: Collective Intelligence v1 (shift to ephemeral)
3. **Phase 3**: Collective Intelligence v2 (added search & capabilities)
4. **Phase 4**: Final Architecture (consolidated with all features)

## Key Insights Preserved

### From Team Management Phase

#### Team Awareness Concept
Each agent receives a **Team Status Brief** showing all active agents and their current work. This prevents context confusion when users open the wrong specialist.

#### Intelligent Routing
When an agent detects off-domain questions, it can suggest the appropriate specialist:
```
"I notice you're asking about UI styling, but I'm auth-dev-001. 
You might want to talk to ui-dev-002 in terminal tab 3."
```

### From Collective Intelligence v1

#### The Borg Collective Model
- Agents as ephemeral instances sharing collective knowledge
- Memory hierarchy: Ephemeral → Role → Global
- Conversation branching for parallel work
- Scrum Master as central orchestrator

#### Memory Promotion Criteria
```typescript
function shouldPromoteToSharedMemory(knowledge):
  if knowledge.type in ['architectural_decision', 'api_contract', 'bug_pattern']:
    return true
  if knowledge.reuse_likelihood > 0.8:
    return true
  if knowledge.impacts_other_agents:
    return true
  return false
```

### From Collective Intelligence v2

#### Cross-Conversation Search Implementation
```typescript
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
```

#### Dynamic Capability Loading
Agents can stack multiple capabilities:
```
Start: developer
Add: prompt-engineer → developer + prompt-engineer
Add: architect → developer + prompt-engineer + architect
```

#### Token-Efficient Progressive Enhancement
- Start minimal (7K tokens)
- Load OAuth context when mentioned (+2K)
- Load cross-conversation context when referenced (+3K)
- Load new capability when requested (+5K)

### From Implementation Roadmaps

#### Phased Approach Lessons
- Week-based plans are too slow for Claude Code
- 1-day focused sprints are more effective
- Core features first, polish later
- Test continuously, not at end

#### Critical Path Insights
1. Crash recovery is most urgent
2. Search enables everything else
3. Summaries provide massive efficiency
4. Integration can be incremental

### From UML Diagrams

#### Key Architectural Flows

**Agent Lifecycle**:
```
Start → Check Existing Session → Load/Create
→ Active with Team Awareness → Heartbeat Loop
→ Graceful/Crash Shutdown → Context Preserved
```

**Recovery Process**:
```
System Restart → Detect Crashed Sessions
→ User: apm recover all → Restore in Correct Windows
→ Load Context → Resume Work
```

**Data Relationships**:
- AgentIdentity (1) → (many) SessionRecord
- TeamStatus (1) → (many) AgentIdentity
- Conversation (1) → (many) Messages
- Memory (shared) ← (promoted from) Conversations

## Design Principles That Emerged

1. **Ephemeral > Persistent**: Agents are task-focused, not long-lived personas
2. **Collective > Individual**: Shared knowledge trumps isolated memory
3. **Progressive > Preloaded**: Load context as needed, not upfront
4. **Searchable > Siloed**: Any agent can access any conversation
5. **Summarized > Verbose**: Semantic understanding over raw syntax
6. **Externalized > Embedded**: Scripts outside prompts save tokens

## Rejected Approaches

1. **Cloud Infrastructure**: Too complex, local is sufficient
2. **Persistent Agent Identities**: Too human-like, limits flexibility
3. **Fixed Role Assignment**: Prevents capability stacking
4. **Front-loaded Context**: Wastes tokens on unused information
5. **Individual Message Files**: YAML conversations are more searchable

## Future Considerations

1. **Agent Spawning Automation**: Scrum Master creates terminals
2. **Semantic Code Index**: Beyond summaries to relationships
3. **Multi-Developer Coordination**: Extend to team scenarios
4. **Pattern Library**: Accumulated solutions to common problems
5. **Performance Analytics**: Agent efficiency metrics

## The Journey

This architecture evolved from treating agents like human team members to embracing their true nature as ephemeral access points to collective intelligence. The key breakthrough was realizing agents don't need persistent identities - they need shared knowledge and intelligent context management.

The final design enables:
- Zero lost work (crash recovery)
- Instant knowledge access (cross-conversation search)
- Massive efficiency (90% token reduction)
- Flexible expertise (capability stacking)
- True collective intelligence (shared memory pools)