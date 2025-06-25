# Worktree Handover Template

## Purpose

This template guides the creation of handover files when creating new worktrees. The handover file ensures the new Claude instance has proper context and role assignment.

## Handover File Location

Create at: `apm/worktree-handovers/YYYY_MM_DD-<branch-name>.md`

Example: `apm/worktree-handovers/2024_06_25-feature-auth.md`

## Template Structure

```markdown
# Worktree Handover: <branch-name>

## Agent Initialization

**Role**: <agent-role-id>  
**Initialize with**: `src/prompts/agents/<role-id>/init.md`

## Task Context

**GitHub Issue**: #<number>  
**Purpose**: <one-line summary of why this worktree exists>  
**Scope**: <detailed description of what needs to be done>

## Memory Transfer from Previous Session

### Work Already Completed
- <list any files created/modified>
- <decisions made>
- <discoveries about the codebase>

### Current State
- <what's working>
- <what's not working>
- <any blockers or concerns>

### Key Context
<Important information the new agent needs to know>

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as specified agent role
3. <First specific task>
4. <Second specific task>
5. <Continue with...>

## Resources and References

- Related PRs: #<numbers>
- Key files to review: <paths>
- Documentation to consult: <paths>

## Special Instructions

<Any unique requirements or warnings>
```

## Agent Role Selection Guide

### Default Role Mappings

| Task Type | Recommended Agent | Role Path |
|-----------|------------------|-----------|
| Feature implementation | Developer | `src/prompts/agents/developer/init.md` |
| Bug fixes | Developer | `src/prompts/agents/developer/init.md` |
| Prompt engineering | Prompt Engineer | `src/prompts/agents/prompt-engineer/init.md` |
| Documentation | Technical Writer | `src/prompts/agents/technical-writer/init.md` |
| Architecture/Design | System Architect | `src/prompts/agents/architect/init.md` |
| Testing | QA Engineer | `src/prompts/agents/qa/init.md` |
| Code review | Senior Developer | `src/prompts/agents/senior-developer/init.md` |

### Role Selection Decision Tree

```
Is this primarily about prompts/agents?
├─ YES → Prompt Engineer
└─ NO → Is this fixing existing code?
    ├─ YES → Developer
    └─ NO → Is this designing new systems?
        ├─ YES → System Architect
        └─ NO → Is this documentation?
            ├─ YES → Technical Writer
            └─ NO → Default to Developer
```

### Special Considerations

1. **Cross-Role Handoffs**: When your current role differs from needed role
   - Scrum Master → Developer (common for task assignment)
   - Architect → Developer (after design phase)
   - Developer → QA Engineer (for testing phase)

2. **Uncertain Role**: If no existing role fits perfectly
   - Note in handover: "Consider creating new agent role for <specific need>"
   - Default to Developer with specific instructions

3. **Multi-Disciplinary Tasks**: When task needs multiple expertises
   - Choose primary role based on immediate next steps
   - Note secondary roles needed in handover

## Example Handovers

### Example 1: Scrum Master to Developer

```markdown
# Worktree Handover: feature-234-user-auth

## Agent Initialization

**Role**: developer  
**Initialize with**: `src/prompts/agents/developer/init.md`

## Task Context

**GitHub Issue**: #234  
**Purpose**: Implement user authentication system  
**Scope**: Create login/logout functionality with JWT tokens

## Memory Transfer from Previous Session

### Work Already Completed
- Created this worktree from issue #234
- No code written yet (handoff from Scrum Master)

### Current State
- Fresh worktree ready for development
- All dependencies installed

### Key Context
- Customer specifically requested JWT-based auth
- Must integrate with existing user database
- Security audit required before deployment

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as Developer agent
3. Review existing auth-related code in src/auth/
4. Create auth service architecture plan
5. Implement JWT token generation

## Resources and References

- Related PRs: #230 (database schema)
- Key files to review: src/models/user.ts
- Documentation to consult: docs/security-guidelines.md
```

### Example 2: Developer to Prompt Engineer

```markdown
# Worktree Handover: feature-240-enhance-agent-prompts

## Agent Initialization

**Role**: prompt-engineer  
**Initialize with**: `src/prompts/agents/prompt-engineer/init.md`

## Task Context

**GitHub Issue**: #240  
**Purpose**: Enhance agent prompts for better context retention  
**Scope**: Refactor existing prompts to improve memory handling

## Memory Transfer from Previous Session

### Work Already Completed
- Identified memory issues in current prompts
- Created list of prompts needing updates (see below)

### Current State
- Analysis complete, ready for prompt redesign
- No code changes yet

### Key Context
- Agents losing context after ~10 exchanges
- Need to incorporate memory preservation patterns
- Must maintain backward compatibility

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as Prompt Engineer agent
3. Review current prompts in src/prompts/agents/
4. Design memory preservation template
5. Update developer agent prompt first (highest impact)

## Resources and References

- Problem analysis: docs/agent-memory-issues.md
- Prompts needing update:
  - src/prompts/agents/developer/init.md
  - src/prompts/agents/architect/init.md
  - src/prompts/agents/qa/init.md
```

## Implementation Checklist

When creating a handover:

- [ ] Determine appropriate agent role for the task
- [ ] Create handover file BEFORE opening new VS Code
- [ ] Include all relevant context from current session
- [ ] Specify clear next steps
- [ ] Reference relevant issues/PRs/files
- [ ] Consider if task needs special instructions
- [ ] Ensure branch name in filename matches actual branch