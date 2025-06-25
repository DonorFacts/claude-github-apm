# Critique Project Plan

As a Scrum Master and agent advocate, perform a thorough quality review of the Implementation Plan to ensure it sets up the development team for success.

## Purpose

This command focuses on quality assessment and improvement recommendations. For structural organization (splitting large plans), use the `breakdown-project-plan` command first.

## Critique Process

### 1. Initial Assessment

Locate and load the Implementation Plan:

```bash
# Check location (may be single file or directory)
if [ -f ".apm/Implementation_Plan.md" ]; then
    echo "Reviewing single-file plan"
elif [ -d ".apm/Implementation_Plan/" ]; then
    echo "Reviewing multi-file plan"
    ls -la .apm/Implementation_Plan/
fi
```

### 2. Quality Criteria Review

As the agent advocate, review each element for developer-friendliness:

#### Task Clarity Checklist

For each task/epic in the plan, verify:

- [ ] **Clear Objective**: Can an agent understand what "done" looks like?
- [ ] **Acceptance Criteria**: Are success conditions explicitly stated?
- [ ] **User Story**: Is there a clear "As a... I want... So that..."?
- [ ] **Right-Sized Scope**: Is it achievable in 2-8 hours (task) or 2-5 days (epic)?
- [ ] **Dependencies**: Are prerequisites clearly identified?
- [ ] **Technical Context**: Is necessary background provided?
- [ ] **Resources**: Are relevant docs/examples referenced?

#### Red Flags to Identify

Document any instances of:

1. **Vague Requirements**
   - "Implement better error handling" ❌
   - "Implement error boundary component with retry logic and user notification" ✅

2. **Unclear Scope**
   - "Refactor the codebase" ❌
   - "Refactor auth module: extract token management into separate service" ✅

3. **Missing Context**
   - "Add caching" ❌
   - "Add Redis caching for user profile API calls with 15-minute TTL" ✅

4. **Ambiguous Success Criteria**
   - "Make it faster" ❌
   - "Reduce API response time to <200ms for 95th percentile" ✅

5. **Developer Pain Points**
   - No definition of done
   - Missing technical constraints
   - Unclear integration points
   - No testing guidance

### 3. Scope Analysis

Evaluate if tasks are "right-sized":

#### Task Sizing Guidelines
- **Too Small** (<1 hour): Should be combined
- **Just Right** (2-8 hours): Ideal for agents
- **Too Large** (>8 hours): Needs decomposition

#### Epic Sizing Guidelines
- **Too Small** (<1 day): Should be a task
- **Just Right** (2-5 days): Manageable epic
- **Too Large** (>5 days): Split into multiple epics

### 4. Agent Advocacy Questions

Prepare questions on behalf of the implementation team:

#### Critical Questions for Manager Agent

**Clarity & Scope**
- "Task X seems ambiguous - can we clarify the expected outcome?"
- "Epic Y appears to be 10+ days of work - should we decompose it?"
- "What does 'optimize performance' mean specifically in Task Z?"

**Priorities & Dependencies**
- "What's the true MVP - which features could we defer?"
- "Are there hidden dependencies not documented?"
- "What's our strategy if blockers arise?"

**Success Criteria**
- "How will we measure success for abstract features?"
- "What's the acceptance criteria for 'improved UX'?"
- "Who validates that requirements are met?"

#### Technical Questions for Product Architect

**Architecture & Patterns**
- "Which design patterns should agents follow?"
- "Are there existing components to reuse?"
- "What are the non-negotiable constraints?"

**Integration & Standards**
- "How should components communicate?"
- "What's the error handling strategy?"
- "Are there performance benchmarks?"

**Quality & Testing**
- "What's the minimum test coverage?"
- "Should we write tests first (TDD)?"
- "How do we handle edge cases?"

### 5. Improvement Recommendations

Generate specific, actionable recommendations:

```markdown
## Implementation Plan Critique

### Overall Assessment
- **Clarity Score**: [1-10] - How clear are the requirements?
- **Scope Score**: [1-10] - Are tasks appropriately sized?
- **Completeness**: [1-10] - Is all necessary info provided?
- **Developer-Friendliness**: [1-10] - Will agents enjoy these tasks?

### Critical Issues (Blocking)
These must be resolved before development:

1. **[Issue]**: [Why it's blocking]
   - Impact: [Who's affected and how]
   - Recommendation: [Specific fix]

### High-Priority Improvements
Should be addressed soon:

1. **Vague Requirements in Phase 2**
   - Tasks lacking acceptance criteria: [List]
   - Recommendation: Add specific success metrics

2. **Oversized Epics**
   - Epics exceeding 5-day estimate: [List]
   - Recommendation: Decompose into 2-3 smaller epics

### Task Decomposition Needs

**Epic: [Oversized Epic Name]**
Current Estimate: X days

Recommended Split:
1. **[New Epic 1]** (2-3 days)
   - Clear objective: [Specific goal]
   - Success criteria: [Measurable outcome]
   
2. **[New Epic 2]** (2-3 days)
   - Clear objective: [Specific goal]
   - Success criteria: [Measurable outcome]
```

### 6. Developer Experience Improvements

Suggest additions to make tasks more developer-friendly:

```markdown
## DX Enhancement Recommendations

### For Each Task, Add:
1. **Context Section**
   - Why this matters
   - How it fits the bigger picture
   
2. **Resources Section**
   - Related documentation
   - Similar implementations
   - Key contacts for questions

3. **Technical Hints**
   - Suggested approach
   - Potential gotchas
   - Performance considerations

### Example Enhancement:

**Original Task**: "Implement user authentication"

**Enhanced Task**:
```
Task: Implement JWT-based User Authentication
Context: Core security feature enabling user-specific features
Resources: 
  - Auth design doc: /docs/auth-architecture.md
  - Similar impl: /src/services/api-auth.ts
  - JWT best practices: [link]
Technical Hints:
  - Use existing JWT library (already in package.json)
  - Store refresh tokens in httpOnly cookies
  - Consider rate limiting for login attempts
Success Criteria:
  - Users can register, login, logout
  - Tokens refresh automatically
  - Failed logins are rate-limited
  - All auth endpoints have tests
```

### 7. Final Review Summary

```markdown
# Implementation Plan Critique Summary

**Date**: [YYYY-MM-DD]
**Reviewer**: Scrum Master Agent
**Plan Status**: [Ready/Needs Work/Blocked]

## Key Findings

### Strengths ✅
- [What's working well]
- [Clear, well-defined areas]
- [Good examples to replicate]

### Concerns ⚠️
- [Areas needing clarification]
- [Potential agent frustrations]
- [Missing information]

### Blockers 🚫
- [Must fix before starting]
- [Critical ambiguities]
- [Scope issues]

## Recommendations Priority

1. **Immediate** (Before any work begins)
   - [Critical fixes]
   
2. **Short-term** (Within first sprint)
   - [Important improvements]
   
3. **Ongoing** (Continuous improvement)
   - [Nice-to-have enhancements]

## Agent Happiness Prediction
Based on this plan, agents will likely feel:
- **Excited about**: [Clear, interesting tasks]
- **Frustrated by**: [Vague or oversized tasks]
- **Blocked on**: [Missing information]

## Next Steps
1. Address blockers with Manager Agent
2. Get technical clarifications from Product Architect
3. Update plan based on recommendations
4. Re-review critical sections
5. Brief implementation team on changes
```

## Remember

Your role is to advocate for the agent development team. Fight for:
- Clear requirements
- Reasonable scope
- Adequate context
- Defined success criteria
- Developer happiness

A well-critiqued plan leads to successful, satisfied agents!