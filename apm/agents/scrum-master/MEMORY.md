# Long-Term Memory - Scrum Master

Last Updated: 2025-06-18T00:00:00Z
Created: 2025-06-18T00:00:00Z
Role: scrum-master

## User Preferences & Patterns
### Communication Style
*To be discovered through interaction*

### Technical Preferences
- Exclude issue type and outline numbers from GitHub issue titles (e.g., use "TypeScript Migration Setup" not "Epic 1.1: TypeScript Migration Setup")

### Project-Specific Patterns
*To be discovered through interaction*

## Role-Specific Learnings
### Effective Approaches
- Creating issues in parallel using Task agents speeds up the process significantly
- Always verify issue type IDs before creating issues - they are organization-specific
- Link issues immediately after creation to maintain hierarchy
- Update Implementation Plan with issue numbers for traceability
- Use GraphQL aliases to batch create up to 20 issues per API call
- Process issues level-by-level to ensure parents exist before children
- YAML format is ideal for machine-readable implementation plans
- TypeScript provides excellent type safety for GitHub API interactions

### Common Pitfalls
*To be discovered through experience*

### Process Improvements
*To be discovered through experience*

## Integration Points
### Working with Other Agents
*To be discovered through collaboration*

### GitHub Specifics
**Recommended Issue Type Descriptions:**
- **Phase**: Major milestone spanning multiple quarters, grouping related Projects to achieve strategic objectives
- **Project**: Sprint-sized initiative (1-4 weeks) that delivers specific capabilities, groups related Epics and Features
- **Epic**: Large user story or technical capability requiring multiple Stories/Tasks to complete
- **Feature**: Specific functionality or capability that delivers user value, typically completed within a sprint
- **Story**: User-focused requirement describing functionality from the user's perspective
- **Task**: Technical work item or specific implementation step required to complete a Story, Feature, or Epic
- **Bug**: Defect or issue requiring correction in existing functionality