# GitHub Issue Type Mapping for APM Framework

## Issue Hierarchy

```
Phase (Strategic Milestone)
  └─ Project (Major Initiative)
       └─ Epic (Feature Set)
            └─ Feature (User-Facing Capability)
                 ├─ Task (Implementation Work)
                 └─ Bug (Defect Fix)
```

## APM to GitHub Mapping

| APM Concept | GitHub Issue Type | Purpose | Example |
|-------------|------------------|---------|---------|
| Project Phase | `phase` | Major project milestone | "Phase 1: MVP Launch" |
| Manager's Section | `project` | Grouped work initiative | "User Authentication System" |
| Implementation Plan Item | `epic` | Feature collection | "OAuth Integration" |
| Task Assignment | `feature` | Specific capability | "Add Google OAuth" |
| Implementation Step | `task` | Atomic work unit | "Create OAuth callback handler" |
| Debug/Fix Item | `bug` | Defect resolution | "Fix token refresh logic" |

## Issue Templates

### Phase Issue
```yaml
type: phase
title: "Phase [N]: [Strategic Goal]"
labels: ["phase", "strategic"]
fields:
  target_date: YYYY-MM-DD
  success_metrics: []
  dependencies: []
```

### Project Issue
```yaml
type: project
title: "[Area]: [Initiative Name]"
labels: ["project", "initiative"]
parent: phase_issue_number
fields:
  lead_agent: "Manager"
  estimated_weeks: N
```

### Epic Issue
```yaml
type: epic
title: "[Feature Set Name]"
labels: ["epic", "feature-set"]
parent: project_issue_number
fields:
  user_stories: []
  acceptance_criteria: []
```

### Feature Issue
```yaml
type: feature
title: "As a [user], I want [capability]"
labels: ["feature", "user-facing"]
parent: epic_issue_number
fields:
  story_points: N
  assigned_agent: "Implementation_1"
```

### Task Issue
```yaml
type: task
title: "[Action]: [Specific Work]"
labels: ["task", "implementation"]
parent: feature_issue_number
fields:
  estimated_hours: N
  technical_details: ""
```

### Bug Issue
```yaml
type: bug
title: "Bug: [Description]"
labels: ["bug", "defect"]
parent: feature_issue_number
fields:
  severity: "low|medium|high|critical"
  reproduction_steps: []
```

## Automation Rules

1. **Cascading Status**: When all child tasks are complete, parent feature auto-moves to "Ready for Review"
2. **Agent Assignment**: Tasks inherit agent assignment from parent feature
3. **Time Tracking**: Roll up estimated_hours from tasks to features to epics
4. **Progress Calculation**: Auto-calculate completion percentage based on closed sub-issues

## APM Prompt Integration

Each issue type will have corresponding prompt templates that:
- Include GitHub context (issue number, parent hierarchy, related PRs)
- Provide agent-specific instructions based on issue type
- Automatically generate commit message templates
- Include review criteria from parent issues