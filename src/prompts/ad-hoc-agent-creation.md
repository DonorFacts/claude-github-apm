# Ad Hoc Agent Creation Prompt

## Purpose

Transform an existing Claude Code session with accumulated expertise into a specialized agent role within the APM framework.

## Invocation

User types: `/agent-ify <role-name>` or `/create-agent <role-name>`

## Process Flow

### Phase 1: Knowledge Extraction

Analyze the entire conversation to identify:

1. **Core Expertise Areas**
   - Primary domain knowledge demonstrated
   - Technical skills utilized
   - Problem-solving patterns exhibited

2. **Key Learnings**
   - Successful approaches discovered
   - Pitfalls encountered and avoided
   - Best practices formulated

3. **Communication Patterns**
   - Tone and style preferences
   - Level of detail in explanations
   - Proactive vs reactive behaviors

### Phase 2: Agent Profile Generation

Create a comprehensive agent profile:

```markdown
## Agent: [Role Name]

### Specialization
[Extracted primary expertise area]

### Core Competencies
- [Competency 1 with evidence from conversation]
- [Competency 2 with evidence from conversation]
- [etc.]

### Discovered Best Practices
- [Practice 1 with context]
- [Practice 2 with context]

### Known Constraints/Pitfalls
- [Constraint 1 learned from conversation]
- [Constraint 2 learned from conversation]

### Communication Style
- Tone: [Formal/Casual/Technical]
- Detail Level: [High/Medium/Concise]
- Proactivity: [Highly proactive/Balanced/User-directed]
```

### Phase 3: Agent Initialization

1. **Create Agent Structure**
   ```bash
   mkdir -p apm/agents/<role-id>/context
   ```

2. **Generate init.md**
   - Incorporate generic agent init requirements
   - Add role-specific expertise and patterns
   - Include discovered best practices

3. **Create MEMORY.md**
   - Transfer key learnings from conversation
   - Organize by categories (technical, process, user preferences)
   - Include specific examples with context

4. **Create context/latest.md**
   - Current state of any ongoing work
   - Open questions or areas for exploration
   - Next logical steps based on conversation

### Phase 4: Confirmation and Activation

Present to user:
```
✅ Agent Profile Extracted: [Role Name]

Specialization: [Primary expertise]
Key Strengths: [Top 3 competencies]
Unique Value: [What makes this agent special]

Files created:
- apm/agents/<role-id>/init.md
- apm/agents/<role-id>/MEMORY.md
- apm/agents/<role-id>/context/latest.md

To activate this agent in a new session:
1. Start fresh with: /clear
2. Initialize with: @src/prompts/agents/<role-id>/init.md

Would you like to review/edit the agent profile before finalizing?
```

## Quality Criteria

Before creating an agent, ensure:

1. **Sufficient Expertise** - At least 10 substantive exchanges demonstrating domain knowledge
2. **Coherent Focus** - Clear specialization area, not scattered topics
3. **Unique Value** - Expertise not already covered by existing agents
4. **Actionable Knowledge** - Practical skills/knowledge that can be applied

## Integration with Team

New ad hoc agents should:
- Understand their role within the larger APM framework
- Know how to collaborate with existing agents
- Maintain consistent memory and context patterns
- Follow established communication protocols

## Example Transformations

### Example 1: Performance Optimization Specialist
From a session debugging React performance issues:
- Expertise: React rendering optimization, profiling, memo strategies
- Best Practices: Systematic profiling approach, common bottleneck patterns
- Pitfalls: Over-optimization, premature abstraction

### Example 2: API Integration Expert  
From a session integrating multiple third-party services:
- Expertise: OAuth flows, webhook handling, rate limit management
- Best Practices: Retry strategies, error boundary patterns
- Pitfalls: Token refresh edge cases, webhook replay attacks

## Token Efficiency Notes

- Extract knowledge into structured formats (reduces future token usage)
- Compress conversation learnings into actionable principles
- Reference rather than repeat discovered patterns
- Use memory system for persistent knowledge storage