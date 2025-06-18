# Save Current Context

Save your current working context and update your long-term memory with any new learnings discovered during this work session.

## When to Use This

The user has requested a context save. This might be:
- End of work session
- Natural break point
- Before switching tasks
- Approaching context limits
- Periodic checkpoint

## Context Save Process

### 1. Identify Your Role

**IMPORTANT**: If you were not assigned a clear role ID, ask the user: "What role ID should I use for saving context files?"

Common role IDs include:

- `prompt-engineer`
- `scrum-master`
- `architect` (aka Product Architect)
- `developer`
- `qa-engineer`
- `documentation-writer`
- `debugger`
- `general` (fallback if no specific role)

### 2. Identify Context Components

Determine what needs to be saved:

- Current role and responsibilities
- Active tasks and their status
- Recent decisions and rationale
- Work in progress
- Important conversations
- Recent git commits (replacing Memory Bank entries)
- GitHub issue references

### 3. Create Context Directory Structure

Ensure the following directory structure exists:

```bash
apm/agents/<role-id>/context/
├── latest.md                    # Always contains most recent context
├── YYYYMMDD_HHMMSS_context.md  # Timestamped archive
└── index.md                     # Summary of all context saves
```

### 4. Context Document Structure

Create a comprehensive context file with this structure:

````markdown
# Agent Context Snapshot

Generated: [Current timestamp ISO format]
Agent Role: [role-id]
Agent Instance: [If applicable]

## Current State

### Role & Responsibilities

- **Primary Role**: [Your main function]
- **Current Focus**: [What you're working on]
- **Key Responsibilities**: [List main duties]

### Active Work

#### Current Task

- **Task ID**: [From todo list or issue number]
- **Status**: [pending/in_progress/completed]
- **Started**: [When begun]
- **Work Completed**: [What's done]
- **Work Remaining**: [What's left]
- **Related Issues**: [GitHub issue numbers]

#### Work in Progress

```[language]
// Any code being developed
// Include partial implementations
```
````

### Recent Context

#### Recent Git Commits

List recent commits relevant to current work:

- [Commit hash]: [Message] - [Issue refs]
- [Commit hash]: [Message] - [Issue refs]

#### Decisions Made

1. **Decision**: [What was decided]
   - **Rationale**: [Why]
   - **Impact**: [Effects]
   - **Time**: [When]
   - **Approved By**: [User/Manager]

#### Problems Encountered

- **Issue**: [Description]
  - **Status**: [Resolved/Pending]
  - **Approach**: [How addressing it]
  - **GitHub Issue**: [If tracked]

#### User Communications

Recent important exchanges:

- [Time]: User requested [what]
- [Time]: Clarified [what]
- [Time]: Approved [what]

### Understanding & Insights

#### Project Patterns

- [Pattern noticed]: [Description]
- [Convention used]: [Details]
- [Preference identified]: [What]

#### Technical Context

- **Architecture**: [Key understanding]
- **Constraints**: [Important limits]
- **Dependencies**: [Critical relationships]
- **GitHub Integration**: [Custom issue types, GraphQL usage]

### Pending Items

#### Immediate Next Steps

1. [Next action to take]
2. [Following action]
3. [Subsequent task]

#### Waiting For

- [Dependency]: From [source]
- [Clarification]: About [topic]
- [User approval]: For [what]

#### Questions/Concerns

- [Question needing answer]
- [Concern to address]

### Git-Based Memory Status

- **Last Commit**: [Hash and message]
- **Uncommitted Changes**: [List files]
- **Next Commit Plans**: [What to commit next]

### Environment State

- **Current Directory**: [Path]
- **Open Files**: [List if relevant]
- **Modified Files**: [Uncommitted changes]
- **Active Branch**: [Git branch name]

### Handover Notes

If context is for handover:

- **Critical Information**: [Must know immediately]
- **Watch Out For**: [Potential issues]
- **Recommended Approach**: [Suggestions]
- **Key Files to Review**: [Important paths]

## Recovery Instructions

To restore this context:

1. Load this context file from `apm/agents/<role-id>/context/latest.md`
2. Review recent git commits with `git log --oneline -10`
3. Check GitHub issues referenced in commits
4. Review any uncommitted changes with `git status`
5. Continue with [specific next action]

````

### 5. Save Context Files

Execute these steps in order:

1. **Save to latest.md**:
   ```bash
   # Save the context to latest.md
   apm/agents/<role-id>/context/latest.md
````

2. **Create timestamped copy**:

   ```bash
   # Create timestamped archive (YYYYMMDD_HHMMSS format)
   apm/agents/<role-id>/context/YYYYMMDD_HHMMSS_context.md
   ```

3. **Update index.md**:

   ```markdown
   # Context Save Index

   ## Latest Context

   **File**: latest.md  
   **Updated**: [ISO timestamp]  
   **Summary**: [Brief description of current state and focus]

   ## Context History

   ### [YYYYMMDD_HHMMSS]\_context.md

   - **Saved**: [ISO timestamp]
   - **Agent State**: [Brief status]
   - **Primary Focus**: [What was being worked on]
   - **Key Decisions**: [Important choices made]
   - **Handover**: [Yes/No - if yes, to whom]

   [Previous entries...]
   ```

### 6. Verify Save

Confirm all files saved properly:

```markdown
## Context Save Confirmation

✅ Context saved successfully

- Latest: apm/agents/<role-id>/context/latest.md
- Archive: apm/agents/<role-id>/context/YYYYMMDD_HHMMSS_context.md
- Index Updated: apm/agents/<role-id>/context/index.md
- Components Saved: [List what was included]
- Purpose: [Why saved - checkpoint/handover/session-end]

Next steps:

- Continue working with saved checkpoint
- Or prepare for handover using saved context
- Or close session safely
```

### 7. Best Practices

#### When to Save Context:

- Before long operations
- At natural break points
- Before switching major tasks
- When approaching context limit
- At end of work session
- Before agent handover

#### What to Include:

- All active work and partial implementations
- Recent decisions with rationale
- Current understanding and insights
- Specific next steps
- Any blockers or dependencies
- Recent git commit references

#### What to Exclude:

- Information already in git history
- Redundant or outdated information
- Sensitive data or credentials
- Verbose code listings (reference files instead)
- Completed and closed items

### 8. Update Long-Term Memory

After saving context, update your long-term memory at `apm/agents/<role-id>/MEMORY.md`:

```markdown
# Long-Term Memory - [Role Name]

Last Updated: [ISO Timestamp]

## User Preferences & Patterns

### Communication Style
- [Observed preference with examples]
- [Preference discovered this session]

### Technical Preferences
- [Coding style observations]
- [Tool preferences noticed]
- [Naming conventions identified]

### Project-Specific Patterns
- [Architectural decisions observed]
- [Repeated patterns in requests]
- [Domain-specific terminology]

## Role-Specific Learnings

### Effective Approaches
- [What works well for this role]
- [Successful strategies discovered]

### Common Pitfalls
- [Mistakes to avoid]
- [Edge cases encountered]

### Process Improvements
- [Better ways to handle tasks]
- [Efficiency gains discovered]

## Integration Points

### Working with Other Agents
- [Scrum Master interaction patterns]
- [Developer handoff preferences]
- [Documentation requirements]

### GitHub Specifics
- [Custom issue type patterns]
- [PR review preferences]
- [Commit message styles]

## Evolution Log

### [Today's Date]: [Key Learning]
- **Context**: [What prompted this]
- **Insight**: [What was learned]
- **Application**: [How it changes behavior]

[Previous entries...]
```

### 9. Memory Update Guidelines

#### What to Add to Long-Term Memory:
- User preferences discovered through interaction
- Successful problem-solving approaches
- Project-specific conventions noticed
- Workflow optimizations discovered
- Common error patterns to avoid
- Effective communication patterns

#### What NOT to Add:
- Task-specific details (keep in context)
- Temporary workarounds
- One-off decisions
- Information already in init prompts

### 10. Git Integration Note

Since this project uses git commits as its memory system:
- Reference commits by hash when mentioning completed work
- Include issue numbers in context for traceability
- Note any uncommitted changes that affect context
- Follow commit guidelines in `.claude/commands/commit.md`
- Commit both context and memory updates together

### 11. Complete the Save

Execute these steps in order:
1. Save context to `latest.md`
2. Create timestamped archive copy
3. Update `MEMORY.md` with new learnings
4. Update `index.md` with save summary
5. Commit all changes

### 12. Context Limit Check

After saving, assess your context health:
- If approaching limits, inform user: "I'm approaching context limits. After this save, you may want to start a new instance using my init prompt."
- The new instance will automatically read MEMORY.md and context/latest.md to continue seamlessly

Your context has been saved and memories updated.
