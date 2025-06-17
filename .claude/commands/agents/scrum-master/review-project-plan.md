# Review Project Plan

As a Scrum Master, review the Implementation Plan to ensure it's well-structured, clear, and sets up the development team for success.

## Review Process

### 1. Load and Analyze Plan

First, check if the Implementation Plan exists and assess its structure:

```bash
# Check for Implementation Plan
if [ -f "apm/Implementation_Plan.md" ]; then
    echo "Found Implementation Plan"
    # Check file size
    wc -l apm/Implementation_Plan.md
elif [ -d "apm/Implementation_Plan/" ]; then
    echo "Found Implementation Plan directory"
    ls -la apm/Implementation_Plan/
else
    echo "No Implementation Plan found"
fi
```

### 2. Structural Assessment

Evaluate the plan's organization:

#### Size and Complexity Check
- **Single File Threshold**: If > 500 lines, recommend splitting
- **Complexity Indicators**:
  - More than 10 main sections
  - Nested dependencies beyond 3 levels
  - Mixed abstraction levels (strategic + tactical details)

If the plan is too large or complex, offer to reorganize:

```markdown
## Recommended Structure

apm/Implementation_Plan/
├── 00_Overview.md           # Executive summary and goals
├── 01_Architecture.md        # Technical architecture
├── 02_Phase_Breakdown.md     # Development phases
├── 03_Task_Definitions.md    # Detailed task specifications
├── 04_Dependencies.md        # Dependency graph
├── 05_Risk_Mitigation.md     # Risks and mitigation
└── 06_Success_Metrics.md     # How we measure success
```

### 3. Quality Criteria Review

As the agent advocate, review each task/epic for:

#### Task Clarity Checklist
- [ ] **Clear Objective**: Can an agent understand what "done" looks like?
- [ ] **Acceptance Criteria**: Are success conditions explicitly stated?
- [ ] **User Story**: Is there a clear "As a... I want... So that..."?
- [ ] **Scope**: Is it achievable in reasonable time (2-8 hours for task)?
- [ ] **Dependencies**: Are prerequisites clearly identified?
- [ ] **Technical Context**: Is necessary background provided?

#### Red Flags to Identify
1. **Vague Requirements**
   - "Implement better error handling" ❌
   - "Implement error boundary component with user-friendly fallback UI" ✅

2. **Unclear Scope**
   - "Refactor the codebase" ❌
   - "Refactor authentication module to use dependency injection pattern" ✅

3. **Missing Context**
   - "Add caching" ❌
   - "Add Redis caching for API responses with 5-minute TTL" ✅

4. **Ambiguous Success Criteria**
   - "Make it faster" ❌
   - "Reduce page load time to under 2 seconds for 95th percentile" ✅

### 4. Questions for Stakeholders

Based on the review, prepare questions for:

#### For Manager Agent
1. **Priority Clarification**
   - "Which features are must-have vs nice-to-have?"
   - "What's the critical path for MVP?"
   - "Are there external deadlines driving priorities?"

2. **Resource Allocation**
   - "How many Implementation Agents will be available?"
   - "What's the expected velocity per agent?"
   - "Should we plan for parallel work streams?"

3. **Risk Management**
   - "What are the known technical risks?"
   - "Do we have contingency plans for blocked tasks?"
   - "What's our approach to unknown unknowns?"

#### For Product Architect
1. **Technical Decisions**
   - "Are all architectural decisions documented?"
   - "Which patterns should agents follow?"
   - "What are the non-negotiable technical constraints?"

2. **Integration Points**
   - "How do components interact?"
   - "What are the API contracts?"
   - "Where are the system boundaries?"

3. **Quality Standards**
   - "What's the testing strategy?"
   - "Are there performance benchmarks?"
   - "What's the code review process?"

### 5. Improvement Recommendations

Generate specific recommendations:

```markdown
## Implementation Plan Review

### Overall Assessment
- **Clarity Score**: [1-10]
- **Completeness**: [1-10]
- **Developer-Friendliness**: [1-10]

### Critical Issues
1. [Issue]: [Impact] - [Recommendation]
2. [Issue]: [Impact] - [Recommendation]

### Suggested Improvements

#### Immediate Actions
- [ ] Break down epic X into smaller tasks
- [ ] Add acceptance criteria to tasks Y, Z
- [ ] Clarify technical approach for feature A

#### Structure Recommendations
- [ ] Split into multiple files if > 500 lines
- [ ] Create dependency diagram
- [ ] Add technical decision log

#### Missing Elements
- [ ] User stories for abstract features
- [ ] Success metrics for each phase
- [ ] Rollback procedures for deployments
```

### 6. Task Decomposition Support

For tasks that need breaking down:

```markdown
## Task Decomposition Request

**Original Task**: [Overly broad task]

**Recommended Breakdown**:
1. **Research & Design** (2-4 hours)
   - Analyze current implementation
   - Document proposed approach
   - Get architecture approval

2. **Core Implementation** (4-6 hours)
   - Implement main functionality
   - Write unit tests
   - Handle happy path

3. **Edge Cases & Error Handling** (2-4 hours)
   - Implement error boundaries
   - Add validation
   - Handle edge cases

4. **Integration & Testing** (2-4 hours)
   - Integration tests
   - Update documentation
   - Performance validation
```

### 7. Developer Experience Focus

Ensure each task provides:

1. **Context**: Why this work matters
2. **Resources**: Links to relevant docs/code
3. **Examples**: Similar implementations to reference
4. **Support**: Who to ask for help
5. **Definition of Done**: Clear completion criteria

### 8. Review Summary Template

```markdown
# Implementation Plan Review Summary

**Date**: [YYYY-MM-DD]
**Reviewer**: Scrum Master Agent
**Plan Version**: [Version/Commit]

## Executive Summary
[1-2 paragraph overview of plan quality and readiness]

## Strengths
- [What's working well]
- [Clear and well-defined areas]

## Areas for Improvement
- [What needs clarification]
- [Missing elements]

## Blocking Issues
- [Must be resolved before starting]

## Recommendations
1. **Immediate**: [Actions before development starts]
2. **Short-term**: [Improvements during first sprint]
3. **Long-term**: [Ongoing refinements]

## Next Steps
- [ ] Address blocking issues with Manager Agent
- [ ] Clarify technical questions with Product Architect
- [ ] Update plan based on feedback
- [ ] Re-review after updates

## Agent Readiness Assessment
- **Implementation Agents**: [Ready/Needs Prep]
- **Test Agents**: [Ready/Needs Prep]
- **Review Agents**: [Ready/Needs Prep]
```

Remember: Your role is to be the advocate for the agent development team. Ensure they have everything they need to succeed and aren't set up for frustration with unclear or poorly scoped work.