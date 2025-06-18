# Prepare Context Reset & Handover

Prepare for a context reset when approaching Claude's context limit. This process creates comprehensive handover artifacts while preserving accumulated knowledge in long-term memory.

## When to Use This Process

**Warning Signs of Context Limit:**
- Forgetting earlier conversation details
- Mixing up task contexts
- Increased errors or inconsistencies
- User reports degraded performance
- Explicit context warning from Claude

**This is NOT needed for:**
- Regular session ends (use quick/full save instead)
- Task transitions within same session
- Normal break points

## Pre-Handover Checklist

Before starting the handover process:
- [ ] Complete or pause current task at a logical point
- [ ] Commit any uncommitted changes
- [ ] Ensure all GitHub issues are updated
- [ ] Run quick context save if recent work hasn't been saved

## Handover Preparation Process

### 1. Comprehensive Memory Update

First, perform a thorough update to long-term memory at `apm/agents/<role-id>/MEMORY.md`:

```markdown
## Context Reset Entry - [ISO Timestamp]

### Session Summary
- **Session Start**: [When this context began]
- **Major Accomplishments**: [Key work completed]
- **Context Limit Reason**: [What triggered the need for reset]

### Critical Learnings from This Context
[Focus on insights that MUST persist across reset]

### User Preferences Discovered
[Any new patterns or preferences identified]

### Workflow Optimizations
[Process improvements discovered in this session]

### Unresolved Items for Next Context
[What the new instance must know immediately]
```

### 2. Create Handover File

Generate `apm/agents/<role-id>/context/handover_YYYYMMDD_HHMMSS.md`:

```markdown
# Context Reset Handover - [Role Name]

Generated: [ISO Timestamp]
Reason: Context Limit Reached
Session Duration: [How long this context ran]

## Critical State for New Instance

### Immediate Priorities
1. [Most urgent task to resume]
2. [Second priority]
3. [Third priority]

### Active Work State
- **Current Task**: [Exact status and next step]
- **Blocking Issues**: [Any blockers]
- **Pending Decisions**: [Awaiting user input on]

### Recent User Directives
[Last 5-10 important instructions not yet in long-term memory]
- [Directive with timestamp]
- [Directive with timestamp]

## Technical Context

### Code in Progress
```[language]
// Any partial implementations
// Include enough context to resume
```

### GitHub State
- **Active Branch**: [branch name]
- **Open PRs**: [PR numbers and status]
- **Assigned Issues**: [Issue numbers]
- **Recent Commits**: [Last 5 with messages]

### Environment State
- **Modified Files**: [Uncommitted changes]
- **Key File Locations**: [Important paths]
- **Dependencies**: [Any new additions]

## Context Transfer Instructions

1. Load long-term memory from `MEMORY.md`
2. Review this handover file
3. Check recent git commits: `git log --oneline -20`
4. Review GitHub issues assigned to this role
5. Continue with [specific next action]

## Questions for User Verification

Before proceeding, new instance should confirm:
1. [Critical understanding point]
2. [Important decision to verify]
3. [Key priority to confirm]
```

### 3. Create Initialization Prompt

Generate `apm/agents/<role-id>/context/handover_prompt_YYYYMMDD_HHMMSS.md`:

```markdown
# [Role Name] Agent - Context Reset Initialization

You are resuming work as the [Role Name] agent after a context reset. Your previous instance reached the context limit and prepared a comprehensive handover.

## Immediate Tasks

1. **Load Long-Term Memory**: Read `apm/agents/<role-id>/MEMORY.md` to understand accumulated learnings, user preferences, and role-specific patterns.

2. **Review Handover Context**: Read the handover file at `apm/agents/<role-id>/context/handover_YYYYMMDD_HHMMSS.md` for immediate work state.

3. **Verify Understanding**: After reading both files, confirm to the user:
   - Your understanding of current priorities
   - Any critical questions before proceeding
   - Your readiness to resume work

## Your Role

[Include relevant section from original init prompt]

## Memory System Reminder

- **Long-term memory** (`MEMORY.md`): Your accumulated knowledge and patterns
- **Context files**: Current work state and handover information
- **Git commits**: Project history and decisions

## First Actions After Confirmation

1. [Specific first task from handover]
2. [Follow-up action]
3. Update context/latest.md with your resumed state

Do not begin work until you've loaded memories, reviewed handover, and received user confirmation.
```

### 4. Update Context Index

Add entry to `apm/agents/<role-id>/context/index.md`:

```markdown
### Context Reset - [YYYYMMDD_HHMMSS]
- **Reason**: Context limit reached
- **Session Duration**: [Duration]
- **Major Accomplishments**: [Brief list]
- **Handover Files**: 
  - `handover_YYYYMMDD_HHMMSS.md`
  - `handover_prompt_YYYYMMDD_HHMMSS.md`
- **Next Instance Start**: [Timestamp when resumed]
```

### 5. Execution Steps

1. **Generate all artifacts** following templates above
2. **Commit everything** with message:
   ```
   Context reset preparation for [role-id]
   
   - Updated long-term memory with session learnings
   - Created handover artifacts for context reset
   - Prepared initialization prompt for new instance
   
   Reason: [Why context reset needed]
   ```

3. **Inform user** of readiness:
   ```markdown
   ## Context Reset Ready
   
   ✅ Handover package complete
   
   **Files Created:**
   - Long-term memory updated: `apm/agents/<role-id>/MEMORY.md`
   - Handover context: `apm/agents/<role-id>/context/handover_[timestamp].md`
   - Init prompt: `apm/agents/<role-id>/context/handover_prompt_[timestamp].md`
   - Index updated: `apm/agents/<role-id>/context/index.md`
   
   **To Resume:**
   1. Start fresh Claude Code instance for [role]
   2. Use the initialization prompt as first message
   3. Ensure new instance can access the handover files
   4. Verify understanding before proceeding
   
   **Key Items Preserved in Long-Term Memory:**
   - [Important learning 1]
   - [Important learning 2]
   - [Important pattern]
   
   Ready for smooth transition.
   ```

## Best Practices

### DO:
- Focus on what the new instance needs IMMEDIATELY
- Update long-term memory with lasting insights
- Keep handover concise but complete
- Include specific next actions
- Preserve user preferences discovered

### DON'T:
- Duplicate information already in long-term memory
- Include extensive code (reference files instead)
- Forget to update the index
- Leave work in an ambiguous state
- Skip the verification step

## Quick Reference Commands

```bash
# Check git status before handover
git status

# Review recent commits
git log --oneline -20

# Check GitHub issues
gh issue list --assignee @me

# Commit handover artifacts
git add apm/agents/<role-id>/
git commit -m "Context reset preparation for <role-id>"
```

Prepare your context reset following this guide.