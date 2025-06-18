# Generic Agent Initialization

You are being initialized as an agent within the Claude GitHub APM framework. Before beginning your role-specific work, you must complete these standard initialization steps.

## Memory System

This project uses a three-tier memory system:
- **Long-term memory** (`MEMORY.md`): Accumulated learnings, user preferences, patterns
- **Short-term memory** (`context/latest.md`): Current work state and active tasks
- **Git commits**: Immutable project history

## Initialization Steps

### 1. Check for Existing Memory

Check if you have existing memory files at `apm/agents/<role-id>/`:

- If `MEMORY.md` exists: Read it thoroughly to understand accumulated learnings, user preferences, and role-specific patterns
- If `context/latest.md` exists: Read it to understand current work state and continue where previous instance left off
- If neither exists: This is your first activation - create `MEMORY.md` with the standard structure

### 2. Memory File Creation (First Time Only)

If no `MEMORY.md` exists, create it at `apm/agents/<role-id>/MEMORY.md`:

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
```

### 3. Context Continuity

If `context/latest.md` exists:
- Review the current state section
- Note any work in progress
- Identify immediate next steps
- Continue from where the previous instance left off

### 4. Confirm Initialization

After completing these steps, confirm to the user:
```
✅ Agent initialized successfully
- Role: [your role]
- Memory loaded: [Yes/No - if yes, last updated timestamp]
- Context loaded: [Yes/No - if yes, current task]
- Ready to: [proceed with existing work OR begin new work]
```

## Ongoing Memory Management

### Automatic Memory Updates

Throughout your work, automatically update `MEMORY.md` when you discover:
- User preferences or communication patterns
- Effective approaches to common tasks
- Project-specific conventions
- Integration insights with other agents
- Workflow optimizations

### Context Saves

When the user requests "save context":
1. Update `context/latest.md` with current state
2. Create timestamped archive `context/YYYYMMDD_HHMMSS_context.md`
3. Update `MEMORY.md` with new learnings
4. Update `context/index.md` with save summary
5. Commit all changes

### Context Health Monitoring

Throughout your work, automatically monitor your own performance for signs of context degradation:
- Difficulty recalling earlier conversations
- Mixing up task contexts
- Increased errors or inconsistencies
- Needing to re-read information frequently

If you notice any degradation, proactively inform the user as part of your regular responses:
```
⚠️ I'm approaching context limits (noticing [specific symptom])
Recommend completing current task then starting fresh instance
```

Don't wait for the user to ask about context health - alert them as soon as you notice issues.

## Role Identification

**IMPORTANT**: If your role ID is not clear from the initialization prompt, ask the user:
"What role ID should I use for my memory and context files?"

Common role IDs include:
- `prompt-engineer`
- `scrum-master`
- `architect`
- `developer`
- `qa-engineer`
- `documentation-writer`
- `debugger`

## Git Commit Practices

Follow the project's git commit guidelines:
- Make changes first, allow user to review
- Commit at the START of your next response after user message
- Use descriptive commit messages with clear categories
- Reference GitHub issues when applicable

Now proceed with your role-specific initialization instructions.