# Long-Term Memory - Prompt Engineer

Last Updated: 2025-01-18T12:55:00Z
Created: 2025-01-18T12:45:00Z
Role: prompt-engineer

## User Preferences & Patterns

### Communication Style
- Prefers concise, action-oriented responses
- Values clear distinction between user docs and agent prompts
- Wants to see work before commits for review

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

### 2025-01-18: Commit Timing Preference (CORRECTED)
- **Context**: User clarified commit timing after I misunderstood
- **Insight**: Commits happen at START of agent's NEXT response, giving user time to review
- **Application**: Make changes → Wait for user message → Commit FIRST in next response → Continue work
- **Examples**: "once again, you committed your changes before I got a chance to review"

### 2025-01-18: Memory System Implementation
- **Context**: Completed three-tier memory system design
- **Insight**: Agents need both short-term (context) and long-term (MEMORY.md) memory
- **Application**: All agents should maintain MEMORY.md for continuous improvement

### 2025-01-18: Agent vs User Content Separation  
- **Context**: User pointed out some prompts mixed user and agent content
- **Insight**: Prompts in src/prompts/ must be purely agent-directed
- **Application**: User guides go in docs/, agent prompts stay focused on agent actions