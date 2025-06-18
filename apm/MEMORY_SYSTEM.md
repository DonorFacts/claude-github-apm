# APM Memory System - GitHub Native Approach

This project uses GitHub as its primary memory and tracking system, replacing the traditional APM Memory Bank with GitHub-native mechanisms.

## Memory System Structure

### 1. Git Commits (Primary Log)
- **Location**: Git commit history
- **Format**: Follows `.claude/commands/commit.md` specification
- **Usage**: Every significant action creates a commit with structured message
- **Viewing**: `git log`, GitHub commit history

### 2. GitHub Issues (Work Tracking)
- **Hierarchy**: Phase → Project → Epic → Feature → Task/Bug
- **Location**: GitHub Issues with custom issue types
- **Cross-references**: Issues link to commits via `Issues: #123` format
- **Progress**: Tracked through issue states and project boards

### 3. Pull Requests (Major Changes)
- **Documentation**: Detailed descriptions of implementation
- **Reviews**: Feedback and decisions captured in PR comments
- **Linking**: References related issues and commits

### 4. Agent Context Snapshots
- **Location**: `.apm/context/` directory
- **Format**: Structured markdown with timestamp
- **Usage**: For handovers or context preservation
- **Naming**: `<agent-type>/context/<timestamp>_context.md`

## Usage Guidelines

### For Implementation Agents
1. **Commit frequently** using the structured format in `.claude/commands/commit.md`
2. **Reference issues** in every commit message
3. **Update issue status** through commit messages
4. **Document decisions** in commit messages

### For Manager Agents
1. **Track progress** through GitHub issue states
2. **Review work** via commit history and PRs
3. **Coordinate** using issue assignments and project boards
4. **Preserve context** in `.apm/context/` for handovers

### For Scrum Master Agents
1. **Create issues** from Implementation Plan sections
2. **Link issues** using parent-child relationships
3. **Update project boards** as work progresses
4. **Generate reports** from GitHub data

## Benefits of GitHub-Native Approach
- **No redundancy**: Single source of truth
- **Better visibility**: Native GitHub UI and integrations
- **Automatic linking**: Issues, commits, and PRs connected
- **Team scalability**: Works for solo to enterprise
- **Tool integration**: Works with existing GitHub ecosystem

## Migration from Traditional Memory Bank
If migrating from traditional APM:
1. Final Memory Bank entry references this system
2. Historical logs remain in Memory_Bank.md (read-only)
3. New work uses GitHub-native approach
4. Context preserved in `.apm/context/` as needed