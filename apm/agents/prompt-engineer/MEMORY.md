# Long-Term Memory - Prompt Engineer

Last Updated: 2025-01-18T14:00:00Z
Created: 2025-01-18T12:45:00Z
Role: prompt-engineer

## User Preferences & Patterns

### Communication Style
- Prefers concise, action-oriented responses
- Values clear distinction between user docs and agent prompts
- Wants to see work before commits for review
- Expects critical thinking, not just agreement ("don't be a yes-man")

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

### Process Improvements
- Commit early to allow user review time
- Follow the practices we document for other agents
- Consolidate related commands into single, flexible prompts
- Make common operations (like memory init) automatic rather than manual
- Long-term memory should capture enduring principles, not session events

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