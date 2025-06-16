# Claude GitHub APM Framework

## Vision

An enterprise-scale project management framework that enhances Claude Code's APM system with deep GitHub integration, maintaining simplicity for small projects while scaling to complex organizational needs.

## Core Principles

1. **Build-Time Enhancement**: Prompts are transformed during build, not runtime
2. **GitHub as Source of Truth**: All project state lives in GitHub (issues, PRs, projects)
3. **Scale-Adaptive**: Works for solo developers and large teams
4. **Non-Invasive**: Enhances APM without breaking core functionality

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Original APM      │────▶│  Post-Processing │────▶│ Enhanced Prompts│
│   Prompts (.apm)    │     │  Transformations │     │   (dist/)       │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  GitHub Context  │
                            │  - Issue Types   │
                            │  - Project State │
                            │  - Team Config   │
                            └──────────────────┘
```

## Usage Workflow

### 1. Project Setup
```bash
# Initialize project
npx claude-github-apm init

# Configure GitHub integration
npx claude-github-apm config --org MyOrg --project 1

# Build enhanced prompts
npm run build:prompts
```

### 2. Development Flow
```bash
# Manager creates plan using enhanced prompts
claude --run dist/prompts/ez/manager-plan.md

# System automatically:
# - Creates GitHub issues for each plan item
# - Sets up parent-child relationships
# - Adds to project board

# Implementation agent picks up work
claude --run dist/prompts/ez/implement-start.md --issue 123

# Agent work is tracked through:
# - Branch creation (feature/123-implement-auth)
# - Commit messages (feat(#123): add login form)
# - PR creation with issue linking
```

### 3. Scaling Patterns

#### Solo Developer
- Simplified issue types (feature, task, bug only)
- Linear project board
- Minimal ceremony

#### Small Team (2-5)
- Full issue hierarchy
- Sprint planning support
- Code review workflows

#### Enterprise
- Multi-project coordination
- Compliance tracking
- Detailed metrics and reporting

## Key Features

### 1. Automatic Issue Creation
Transform Implementation_Plan.md sections into GitHub issues with proper hierarchy:
```
Phase 1: MVP Launch (phase)
└── User Authentication (project)
    └── OAuth Integration (epic)
        ├── Add Google OAuth (feature)
        └── Add GitHub OAuth (feature)
```

### 2. Context-Aware Prompts
Each prompt includes:
- Current sprint goals
- Open issues assigned to agent
- Recent PR feedback
- Team conventions

### 3. Seamless Handovers
Agent transitions preserve:
- Issue assignment history
- Branch state
- Uncommitted changes
- Context documents

### 4. Progress Visualization
```bash
# View agent productivity
npx claude-github-apm report --agent Implementation_1

# Sprint burndown
npx claude-github-apm sprint --current

# Project timeline
npx claude-github-apm timeline --project "User Auth"
```

## Implementation Phases

### Phase 1: Core Integration (Current)
- [x] Issue type mapping
- [x] Build system design
- [ ] Basic post-processors
- [ ] GitHub scripts

### Phase 2: Enhanced Workflows
- [ ] Sprint management
- [ ] PR automation
- [ ] Review workflows
- [ ] Metrics collection

### Phase 3: Enterprise Features
- [ ] Multi-repo support
- [ ] Team permissions
- [ ] Compliance tracking
- [ ] Advanced analytics

## Testing with Journal-AI-CLI

Our guinea pig project will demonstrate:
1. Creating project structure from scratch
2. Managing feature development
3. Handling bug fixes
4. Coordinating multiple agents
5. Scaling from solo to team development

## Next Steps

1. Complete post-processing templates for all APM prompts
2. Create GitHub automation scripts
3. Build the `claude-github-apm` CLI tool
4. Document best practices
5. Create video tutorials