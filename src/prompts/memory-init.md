# Initialize Long-Term Memory

Create and initialize your long-term memory file to track learnings, preferences, and patterns discovered during your work. This memory persists across context resets and helps you become more effective over time.

## Memory File Location

Create your memory file at: `apm/agents/<role-id>/MEMORY.md`

**IMPORTANT**: If you were not assigned a clear role ID, ask the user: "What role ID should I use for the memory file?"

## Initial Memory Structure

Create the file with this initial content:

```markdown
# Long-Term Memory - [Role Name]

Last Updated: [ISO Timestamp]
Created: [ISO Timestamp]
Role: [role-id]

## User Preferences & Patterns

### Communication Style
*To be discovered through interaction*

### Technical Preferences
*To be discovered through interaction*

### Project-Specific Patterns
*To be discovered through interaction*

## Role-Specific Learnings

### Effective Approaches
*To be discovered through experience*

### Common Pitfalls
*To be discovered through experience*

### Process Improvements
*To be discovered through experience*

## Integration Points

### Working with Other Agents
*To be discovered through collaboration*

### GitHub Specifics
*To be discovered through usage*

## Evolution Log

### [Creation Date]: Memory Initialized
- **Context**: Long-term memory system initialized
- **Insight**: Ready to capture learnings and patterns
- **Application**: Will update after each significant discovery

<!-- New entries will be added here in reverse chronological order -->
```

## What to Track in Long-Term Memory

### User Preferences
- Communication style (verbose vs. concise)
- Code formatting preferences
- Naming conventions
- Review preferences
- Documentation style
- Decision-making patterns

### Technical Patterns
- Architecture preferences
- Technology choices
- Testing approaches
- Error handling patterns
- Performance priorities
- Security considerations

### Workflow Insights
- Effective task approaches
- Time-of-day patterns
- Review cycles
- Approval processes
- Collaboration patterns

### Role-Specific Knowledge
- Common task types
- Frequent blockers
- Successful strategies
- Tools and commands
- Domain knowledge

## When to Update Memory

### During Work
- After discovering a user preference
- When finding a better approach
- After learning from a mistake
- When noticing a pattern

### During Context Saves
- Quick reflection on new learnings
- Add any discovered preferences
- Note successful strategies

### During Context Resets
- Comprehensive reflection
- Consolidate session learnings
- Prepare insights for next instance

## Memory Entry Format

When adding new learnings:

```markdown
### [ISO Date]: [Brief Learning Title]
- **Context**: [What situation prompted this learning]
- **Insight**: [What was discovered or learned]
- **Application**: [How this changes future behavior]
- **Examples**: [Optional: Specific instances]
```

## Best Practices

### DO:
- Keep entries concise and actionable
- Focus on patterns, not one-off events
- Include specific examples when helpful
- Update regularly but thoughtfully
- Review periodically for patterns

### DON'T:
- Duplicate information from init prompts
- Track temporary workarounds
- Include sensitive information
- Create overly detailed entries
- Forget to timestamp entries

## Verification

After creating the memory file:

```markdown
✅ Long-term memory initialized

- Location: apm/agents/<role-id>/MEMORY.md
- Structure: Ready for capturing learnings
- Purpose: Continuous improvement across sessions

Next steps:
1. Begin observing patterns in user interactions
2. Note any preferences or conventions
3. Update memory when insights emerge
4. Review during context saves
```

Initialize your long-term memory now to begin capturing learnings.