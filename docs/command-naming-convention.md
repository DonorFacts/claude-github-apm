# Claude Command Naming Convention

## Overview

This document defines the naming convention for Claude commands stored in `.claude/commands/`. The convention uses a hierarchical prefix-based system that maintains clarity in a flat directory structure.

## Naming Format

```
[domain]-[category]-[action]-[modifier].md
```

- **domain**: Top-level functional area (required)
- **category**: Sub-domain or feature group (required)
- **action**: Primary verb or operation (required)
- **modifier**: Additional context or variant (optional)

### Examples
- `agent-init-developer.md`
- `agent-scrum-create-issues.md`
- `git-workflow-commit.md`
- `code-review-security-checklist.md`
- `test-tdd-workflow.md`

## Public vs Private Prompts

### Public Prompts (Commands)
These are prompts that can be directly invoked by users and will be synced to `.claude/commands/`:

- Standalone prompt files with no dependencies
- Files that provide complete functionality
- Agent initialization prompts
- Workflow commands
- Tool commands

### Private Prompts (Includes)
These are supporting files only meant to be imported by other prompts:

- Files that are imported via `@import` or `@src/` directives
- Base templates and shared components
- Configuration snippets
- Utility functions
- Files that don't make sense as standalone commands

Examples of private prompts:
- `agents/init.md` (generic init imported by specific agents)
- Base configuration templates
- Shared prompt components

## Domain Prefixes

### Core Domains

| Domain | Description | Example Commands |
|--------|-------------|------------------|
| `agent` | Agent initialization and management | `agent-init-developer.md`, `agent-handover-prepare.md` |
| `code` | Code generation and patterns | `code-pattern-react-component.md`, `code-review-checklist.md` |
| `test` | Testing workflows and strategies | `test-tdd-workflow.md`, `test-unit-jest.md` |
| `git` | Version control operations | `git-workflow-commit.md`, `git-branch-strategy.md` |
| `docs` | Documentation generation | `docs-generate-readme.md`, `docs-api-reference.md` |
| `project` | Project management | `project-plan-breakdown.md`, `project-issue-create.md` |
| `debug` | Debugging and troubleshooting | `debug-error-analysis.md`, `debug-performance-profile.md` |
| `review` | Code and design reviews | `review-code-security.md`, `review-architecture-design.md` |
| `refactor` | Refactoring operations | `refactor-extract-function.md`, `refactor-clean-code.md` |
| `deploy` | Deployment and CI/CD | `deploy-docker-build.md`, `deploy-github-actions.md` |

### Special Domains

| Domain | Description | Usage |
|--------|-------------|-------|
| `meta` | Commands about commands | `meta-command-index.md`, `meta-naming-guide.md` |
| `util` | General utilities | `util-context-save.md`, `util-memory-sync.md` |
| `lang` | Language-specific | `lang-ts-types.md`, `lang-python-async.md` |
| `misc` | Uncategorized/fallback | `misc-new-feature.md` |

## Category Guidelines

Categories provide the second level of organization within domains:

### Agent Categories
- `init` - Initialization commands
- `handover` - Handover and context transfer
- `memory` - Memory management
- `collab` - Inter-agent collaboration

### Code Categories
- `pattern` - Design patterns and templates
- `review` - Review checklists and guidelines
- `generate` - Code generation templates
- `analyze` - Code analysis tools

### Test Categories
- `tdd` - Test-driven development
- `unit` - Unit testing
- `integration` - Integration testing
- `e2e` - End-to-end testing

## Action Verbs

Use consistent action verbs for clarity:

### Primary Actions
- `init` - Initialize or setup
- `create` - Create new resources
- `update` - Modify existing resources
- `review` - Review or analyze
- `generate` - Generate code/docs
- `analyze` - Perform analysis
- `validate` - Validate or check
- `migrate` - Move or transform
- `sync` - Synchronize data
- `export` - Export data/reports

## Modifiers

Optional modifiers provide additional context:

### Common Modifiers
- Framework names: `react`, `vue`, `angular`
- Languages: `ts`, `js`, `python`
- Tools: `jest`, `docker`, `github`
- Patterns: `singleton`, `factory`, `observer`
- Scopes: `full`, `quick`, `minimal`

## Migration Mapping

Current file to new name mapping:

```typescript
const migrationMap = {
  // Agent commands
  'agents/init.md': 'agent-init-generic.md',
  'agents/developer/init.md': 'agent-init-developer.md',
  'agents/prompt-engineer/init.md': 'agent-init-prompt-engineer.md',
  'agents/scrum-master/init.md': 'agent-init-scrum-master.md',
  
  // Developer workflows
  'agents/developer/tdd-workflow.md': 'test-tdd-workflow.md',
  'agents/developer/code-patterns.md': 'code-pattern-collection.md',
  'agents/developer/security-checklist.md': 'review-code-security.md',
  
  // Scrum master commands
  'agents/scrum-master/create-project-issues.md': 'project-issue-create-bulk.md',
  'agents/scrum-master/breakdown-project-plan.md': 'project-plan-breakdown.md',
  'agents/scrum-master/github-link-sub-issue.md': 'project-issue-link-github.md',
  
  // Utility commands
  'context-save.md': 'util-context-save.md',
  'commit.md': 'git-workflow-commit.md',
  'agent-ify.md': 'meta-agent-create.md',
  'reflect-for-docs.md': 'docs-generate-reflection.md',
  
  // Collaboration
  'agents/handover-quality.md': 'agent-handover-quality.md',
  'agents/inter-agent-collaboration.md': 'agent-collab-guidelines.md',
  'team-knowledge-contribution.md': 'docs-knowledge-contribute.md'
};
```

## Classification Rules

The automatic classifier uses these rules to determine public vs private prompts:

1. **Excluded Directories**: Files in these directories are always private:
   - `wip/` - Work in progress
   - `test/` - Test files
   - `_x_/` - Experimental/archived
   - `templates/` - Template files
   - `includes/` - Include-only files

2. **Content Analysis**:
   - Empty files → Private
   - Files containing only imports → Private
   - Files with substantial content → Potentially public

3. **Import Analysis**:
   - Files only imported by others → Private
   - Files with no imports and not imported → Public
   - Files imported but also standalone-capable → Public

## Best Practices

1. **Keep names concise**: Aim for 3-4 segments maximum
2. **Use lowercase**: All segments should be lowercase
3. **Use hyphens**: Separate words with hyphens, not underscores
4. **Be descriptive**: Names should clearly indicate purpose
5. **Avoid abbreviations**: Unless widely recognized (e.g., `ts`, `js`)
6. **Group related commands**: Use consistent domain and category
7. **Version variants**: Use modifiers for versions (e.g., `-v2`)

## Searchability

The naming convention optimizes for:

1. **Alphabetical listing**: Related commands group together
2. **Fuzzy search**: Partial matches find relevant commands
3. **Tab completion**: Predictable prefixes enable completion
4. **grep/find**: Pattern matching for bulk operations

## Future Expansion

Reserved prefixes for future use:

- `ai-*` - AI/ML specific operations
- `cloud-*` - Cloud provider integrations
- `security-*` - Security-specific workflows
- `perf-*` - Performance optimization
- `data-*` - Data processing and ETL

## File Watcher Implementation

The command sync system automatically:

1. Watches `src/prompts/**/*.md` for changes
2. Analyzes files to detect imports and classify as public/private
3. Transforms public prompt paths to command names
4. Syncs public prompts to `.claude/commands/`
5. Removes commands when source files are deleted

### Running the File Watcher

```bash
# Start the watcher
tsx src/command-sync/watch.ts

# Or add to package.json scripts
"watch:commands": "tsx src/command-sync/watch.ts"
```

## Implementation Checklist

- [x] Create `.claude/commands/` directory structure
- [x] Design naming convention and classification rules
- [ ] Implement file analyzer for import detection
- [ ] Implement command classifier (public vs private)
- [ ] Implement command name transformer
- [ ] Implement file watcher for auto-sync
- [ ] Write comprehensive tests
- [ ] Create migration script for existing files
- [ ] Add VS Code snippets for common commands
- [ ] Create command discovery tool