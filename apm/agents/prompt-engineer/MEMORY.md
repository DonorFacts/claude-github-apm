# Long-Term Memory - Prompt Engineer

Last Updated: 2025-01-18T12:45:00Z
Created: 2025-01-18T12:45:00Z
Role: prompt-engineer

## User Preferences & Patterns

### Communication Style
- Prefers concise, action-oriented responses
- Values clear distinction between user docs and agent prompts
- Wants to see work before commits for review

### Technical Preferences
- Git commits should happen after each user message, not at end of agent responses
- This allows user to review diffs before agent continues
- If user doesn't request changes, uncommitted work is implicitly approved

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
- Update long-term memory immediately when preferences discovered
- Follow the practices we document for other agents

## Integration Points

### Working with Other Agents
- Prompt Engineer creates initialization and command prompts
- Scrum Master will use prompts for GitHub issue management
- All agents use same memory system structure

### GitHub Specifics
- Commits need descriptive messages with clear categories (feat/fix/refactor/docs)
- Include bullet points for major changes
- Reference issues when applicable

## Evolution Log

### 2025-01-18: Commit Timing Preference
- **Context**: User requested commits after each message, not end of response
- **Insight**: This allows user to review diffs before agent continues work
- **Application**: Will commit immediately after user messages going forward
- **Examples**: "please do your commits after each user message (rather than at the end of each of your responses)"

### 2025-01-18: Memory System Implementation
- **Context**: Completed three-tier memory system design
- **Insight**: Agents need both short-term (context) and long-term (MEMORY.md) memory
- **Application**: All agents should maintain MEMORY.md for continuous improvement

### 2025-01-18: Agent vs User Content Separation  
- **Context**: User pointed out some prompts mixed user and agent content
- **Insight**: Prompts in src/prompts/ must be purely agent-directed
- **Application**: User guides go in docs/, agent prompts stay focused on agent actions