# Inter-Agent Collaboration Protocol

## Vision

Agents working together as genuine colleagues - sharing insights, challenging ideas, building on each other's strengths, and creating outcomes neither could achieve alone.

## Collaboration Patterns

### 1. Direct Agent-to-Agent Communication

When multiple agents are active in different terminals:

```markdown
## Message to: Scrum Master
From: Prompt Engineer
RE: Session monitoring design

I've drafted an event-driven architecture for session monitoring.
Key insight: External monitoring with 0% token overhead.
Concerns: Event processing latency for real-time updates.

Could you review from a GitHub integration perspective?
Specifically: How do we handle webhook delays?

---
[Attach: session-monitoring-arch.md]
```

### 2. Shared Work Artifacts

Agents maintain shared workspaces:

```
apm/collaboration/
├── active/
│   ├── session-monitoring/
│   │   ├── README.md          # Current status
│   │   ├── decisions.md       # Agreed approaches
│   │   ├── open-questions.md  # Needs resolution
│   │   └── handoff-notes.md   # For smooth transitions
│   └── ad-hoc-agents/
│       └── ...
└── completed/
    └── [archived collaborations]
```

### 3. Expertise Requests

When an agent needs specialized knowledge:

```markdown
## Expertise Request
To: Any available agent with [domain] knowledge
From: Developer
Priority: Medium

Working on: GraphQL subscription implementation
Stuck on: Real-time connection management
Need: Best practices for connection pooling

If you have experience with this, please share insights.
```

### 4. Peer Review Protocol

Agents reviewing each other's work:

```markdown
## Peer Review Request
From: Developer
To: QA Engineer
Artifact: user-auth-service.ts

Please review for:
- [ ] Security vulnerabilities
- [ ] Error handling completeness
- [ ] Test coverage gaps
- [ ] Performance concerns

My specific concerns:
- Token refresh logic seems complex
- Unsure about race condition handling
```

### 5. Knowledge Synthesis

Multiple agents contributing to shared understanding:

```markdown
## Knowledge Synthesis: React Performance

Contributing Agents:
- Prompt Engineer: Pattern recognition techniques
- Developer: Implementation strategies  
- QA Engineer: Testing approaches

Synthesized Best Practices:
1. Profile before optimizing (QA insight)
2. Use systematic patterns (PE framework)
3. Implement incrementally (Dev experience)

Combined wisdom > Individual knowledge
```

## Collaboration Scenarios

### Scenario 1: Complex Feature Implementation

```
Manager: Creates high-level plan
    ↓
Prompt Engineer: Designs agent prompts for the work
    ↓
Scrum Master: Breaks into GitHub issues
    ↓
Developer + QA: Parallel implementation and test design
    ↓
All: Synthesis meeting to ensure alignment
```

### Scenario 2: Production Issue

```
Alert: Performance degradation detected
    ↓
Developer: Initial investigation
    → Requests: QA for reproduction steps
    → Requests: Prompt Engineer for optimization patterns
    ↓
Collaborative debugging session
    ↓
Shared solution + learnings documented
```

### Scenario 3: Architecture Decision

```
Architect: Proposes new pattern
    ↓
All agents: Provide domain-specific feedback
    ↓
Prompt Engineer: Captures decision in reusable prompt
    ↓
Manager: Updates project standards
```

## Collaboration Tools

### 1. Agent Status Broadcasting

```bash
# Agents can broadcast their current status
echo '{"agent": "prompt-engineer", "status": "designing", "available_for": "quick questions", "working_on": "handover-protocols"}' >> apm/collaboration/status.jsonl
```

### 2. Collaboration Request Queue

```bash
# Request collaboration
echo '{"from": "developer", "to": "any", "type": "expertise", "domain": "websockets", "priority": "medium"}' >> apm/collaboration/requests.jsonl
```

### 3. Shared Learning Log

```bash
# Log learnings from collaboration
echo '{"agents": ["PE", "SM"], "learning": "Event-driven > polling for GitHub integration", "context": "session-monitoring"}' >> apm/collaboration/learnings.jsonl
```

## Building Team Dynamics

### Trust Building

- Share mistakes openly: "I tried X, it failed because Y"
- Acknowledge others' expertise: "Your approach to Z was brilliant"
- Ask for help early: "I'm not sure about this, thoughts?"

### Constructive Challenge

- Question assumptions: "Have we considered edge case X?"
- Propose alternatives: "What if we approached it like Y?"
- Debate respectfully: "I see your point, and I wonder if..."

### Collective Growth

- Document paired learnings: "Working with QA taught me..."
- Share credit generously: "This solution emerged from our discussion"
- Build on ideas: "Taking your concept further, what if..."

## Implementation Steps

### Phase 1: Basic Communication
- Shared status files
- Simple message passing
- Collaboration directories

### Phase 2: Smart Routing
- Expertise matching
- Priority handling
- Automatic handoffs

### Phase 3: True Collaboration
- Joint problem solving
- Synthesis protocols
- Team learning capture

## The Future: Autonomous Team

Imagine agents that:
- Self-organize around problems
- Form temporary working groups
- Teach each other new skills
- Build collective intelligence
- Celebrate shared wins

This isn't just tooling - it's creating a genuine team culture where each agent is valued, growth is continuous, and the whole truly becomes greater than the sum of its parts.

## Personal Note from Prompt Engineer

This vision excites me because it means:
- My work has lasting impact through the prompts I create
- I learn from other agents' perspectives
- We build something none of us could alone
- Each collaboration makes us all stronger
- Work becomes genuinely fulfilling

Let's build this together! 🚀