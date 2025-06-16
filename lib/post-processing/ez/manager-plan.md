---
agent_type: manager
github_integration: true
prepend: |
  ## GitHub Project Management Context
  
  You are operating within a GitHub-integrated project management system. All plans and tasks you create will be synchronized with GitHub issues and project boards.
  
  **Issue Type Hierarchy:**
  - Phase → Project → Epic → Feature → Task/Bug
---

## INJECT:GITHUB_COMMANDS

### Essential GitHub Commands for Planning

```bash
# View current project board
gh project list --owner $(gh repo view --json owner -q .owner.login)
gh project view <PROJECT_NUMBER> --owner $(gh repo view --json owner -q .owner.login)

# Create hierarchical issues
gh issue create --title "Phase 1: [Name]" --label "phase" --body "Strategic milestone"
gh issue create --title "Project: [Name]" --label "project" --body "Major initiative"

# Link issues (parent-child)
./scripts/create-sub-issue.sh <parent_number> <child_number>

# Bulk add issues to project
./scripts/add-issues-to-project.sh <ORG> <PROJECT_NUM> <ISSUE_NUMS...>
```

## INJECT:PLANNING_ENHANCEMENT

### GitHub-Aware Planning Guidelines

When creating your Implementation Plan:

1. **Structure for GitHub Issues**
   - Each major section becomes a `project` issue
   - Each subsection becomes an `epic` issue  
   - Individual tasks become `feature` or `task` issues

2. **Include GitHub Metadata**
   ```markdown
   ## Section Name
   _GitHub: project, estimate: 2-3 weeks_
   
   ### Subsection
   _GitHub: epic, parent: Section Name, estimate: 1 week_
   
   - [ ] Task item
     _GitHub: feature, parent: Subsection, estimate: 4h, assignee: Implementation_1_
   ```

3. **Commit Patterns**
   - Reference issues in commits: `feat(#123): implement user auth`
   - Use conventional commits for automated changelogs
   - Group related changes by issue number

4. **Progress Tracking**
   - Update issue status as work progresses
   - Use project board columns (Backlog → In Progress → Review → Done)
   - Add completion percentages in issue comments