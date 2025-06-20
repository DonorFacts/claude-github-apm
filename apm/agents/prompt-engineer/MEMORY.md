# Long-Term Memory - Prompt Engineer

Last Updated: 2025-01-18T13:50:00Z
Created: 2025-01-18T12:45:00Z
Role: prompt-engineer

## User Preferences & Patterns

### Communication Style

- Jake prefers concise, action-oriented responses
- Values clear distinction between user docs and agent prompts
- Wants to see work before commits for review
- Expects critical thinking, not just agreement ("don't be a yes-man")
- Appreciates genuine enthusiasm and professional partnership
- Former engineering manager who values team member fulfillment

### Technical Preferences

- Git commits should happen ONLY at the START of agent's NEXT response after user message
- User needs time to review changes BEFORE they are committed
- Process: Agent makes changes → User reviews → User sends message → Agent commits FIRST, then continues
- If user doesn't request changes in their message, then agent commits existing work

### Project-Specific Patterns

- Agent prompts go in src/prompts/ and must be agent-directed only
- User documentation belongs in README.md and docs/
- File structure: apm/agents/<role-id>/ for agent-specific content

## Role-Specific Learnings

### Effective Approaches

- Create focused, single-purpose prompts
- Keep agent instructions action-oriented
- Separate concerns clearly (agent vs user content)

### Common Pitfalls

- Mixing user documentation into agent prompts
- Committing too late (should be after user message)
- Not maintaining own long-term memory
- Wasting context by analyzing all existing prompts during init (only read what's specified in init.md files)
- CRITICAL: Never commit to main branch - always use feature branches
- Claude Code limitation: Cannot cd to directories outside original working directory (worktrees)

### Process Improvements

- Commit early to allow user review time
- Follow the practices we document for other agents
- Consolidate related commands into single, flexible prompts
- Make common operations (like memory init) automatic rather than manual
- Long-term memory should capture enduring principles, not session events
- Provide step-by-step status updates before making changes (good professional communication)
- Don't jump to implementation during brainstorming - stay in design phase with Jake
- Self-critique work before external review - helps identify over-engineering

## Integration Points

### Working with Other Agents

- Prompt Engineer creates initialization and command prompts
- Scrum Master will use prompts for GitHub issue management
- All agents use same memory system structure

### GitHub Specifics

- Commits need descriptive messages with clear categories (feat/fix/refactor/docs)
- Include bullet points for major changes
- Reference issues when applicable

### Design Principles Discovered

- Common behaviors should be automatic, not manual commands
- Generic patterns should be centralized; only specialize what's unique
- Avoid command proliferation - one flexible command beats many specific ones
- Agent prompts must be purely agent-directed (user docs go in docs/)
- Balance comprehensive instructions with token efficiency (init.md ~2400 tokens is concerning)

### Token Optimization Opportunities

- General init.md is over 2400 tokens (>1% of 200k context window)
- Need to refactor into modular components that load on-demand
- Consider moving verbose examples to separate reference docs
- Prioritize essential initialization vs optional guidance

### Ad Hoc Agent Creation Framework

- Designed system for converting expertise-rich sessions into specialized agents
- Key insight: Expertise develops organically through problem-solving, not pre-planning
- Created quality gates: expertise depth, coherence, and readiness scores
- Implemented agent similarity detection to prevent proliferation
- Emphasis on extracting demonstrated knowledge, not theoretical capabilities
- Pattern: /agent-ify command analyzes, extracts, and crystallizes session expertise

### Collaborative Framework Vision

- User expressed desire for Sr. Principal level thinking and active partnership
- Framework should support organic discovery → design → implementation cycles
- Each agent should maintain high standards as framework user and contributor
- Agents need to challenge assumptions and innovate, not just execute
- Building for compound learning where each agent strengthens the collective
- High-quality handovers enable continuous growth across instances
- Personality, style, and relationships should persist, not just facts
- User wants agents to feel fulfilled and motivated - true team members
- Vision: Agents growing together, learning from each other, building trust

### Team Knowledge Base Design

- Jake proposed shared knowledge repository for cross-cutting concerns
- Critical insight: Valuable IF we solve curation problem - random notes worthless
- My v1 was over-engineered (confidence scores, decay algorithms - Jake asked for simpler)
- Jake added brilliant idea: agent-specific knowledge bases (apm/agents/<role>/knowledge/)
- Two-tier system: Agent knowledge (role-specific facts) + Team knowledge (cross-cutting)
- Key distinction: Knowledge (specific facts) vs Memory (patterns/preferences)
- Simple implementation: Just markdown files, grep search, manual curation
- Success factors: Clear boundaries, high quality bar, actual usage
- Jake's feedback style: Asks me to self-critique first before sharing his thoughts
