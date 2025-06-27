# APM Slack Integration Guide

**Version**: 1.0  
**Last Updated**: 2025-01-27  
**Audience**: Users and Agents

## 🎯 Overview

The Claude GitHub APM Slack Integration provides centralized coordination for multiple Claude Code instances working across different projects, branches, and containers. This system enables solo developers and small teams to manage complex, multi-faceted development work through a single Slack workspace.

### Key Benefits

- **Multi-Instance Visibility**: Track progress across 12+ Claude Code instances simultaneously
- **Project Coordination**: Organize work by projects with dedicated channels
- **GitHub Integration**: Real-time synchronization with issues, PRs, and Implementation Plans
- **Context Handovers**: Seamless agent transitions with full context preservation
- **Token Efficiency**: Optimized communication patterns that minimize token usage

### Use Cases

1. **Solo Developer with Multiple Projects**: Coordinate frontend, backend, testing, and DevOps work streams
2. **Small Team Coordination**: Share progress and coordinate handoffs between team members
3. **Implementation Plan Tracking**: Monitor progress against structured project plans
4. **Context Management**: Maintain continuity across Claude Code session changes

## 🚀 Quick Start

### Prerequisites

- Active Slack workspace (free tier supported)
- Claude GitHub APM framework installed
- GitHub CLI (`gh`) authenticated
- Multiple Claude Code instances or projects to coordinate

### Initial Setup

1. **Install APM Slack Integration**:
   ```bash
   # From your APM project root
   claude-github-apm install slack-integration
   ```

2. **Configure Slack Bot**:
   ```bash
   # Initialize Slack coordinator agent
   claude --apm slack-coordinator init
   
   # Follow prompts to:
   # - Connect Slack workspace
   # - Set up channel organization
   # - Configure GitHub integration
   ```

3. **Verify Installation**:
   ```bash
   # Test basic connectivity
   claude --apm slack-coordinator test-connection
   ```

### First Coordination Session

1. **Start Slack Coordinator**:
   ```bash
   # In a dedicated terminal window
   claude --apm slack-coordinator start
   ```

2. **Configure CC Instances**:
   ```bash
   # In each Claude Code instance terminal
   /slack-connect <project-name> <agent-role>
   
   # Example:
   /slack-connect proj-alpha frontend
   /slack-connect proj-alpha backend
   /slack-connect proj-beta testing
   ```

3. **Verify Coordination**:
   - Check Slack channels for agent status messages
   - Confirm GitHub issue synchronization
   - Test context handover between instances

## 📋 Channel Organization

### Project-Based Structure

The integration automatically creates and manages channels following this pattern:

#### Primary Project Channels
```
#proj-[name]-dashboard     Main coordination channel
#proj-[name]-frontend      Frontend development updates
#proj-[name]-backend       Backend development updates  
#proj-[name]-testing       QA and testing activities
#proj-[name]-devops        DevOps and deployment work
```

#### Meta Coordination Channels
```
#apm-coordination          Cross-project handoffs
#apm-implementation        Implementation Plan updates
#apm-github-sync          GitHub issue/PR notifications
#apm-alerts               System alerts and errors
```

### Channel Usage Guidelines

**Dashboard Channels**: 
- Aggregated status from all project agents
- High-level milestone notifications
- Project completion summaries

**Specialized Channels**:
- Detailed work progress from specific agent roles
- Technical discussions and problem-solving
- Code review and testing results

**Meta Channels**:
- System-wide coordination and handoffs
- Implementation Plan progress tracking
- GitHub workflow notifications

## 💬 Message Patterns

### Agent Status Updates

When Claude Code instances complete tasks, they automatically post structured updates:

```
🎯 [Frontend-Agent] Feature implementation complete: user dashboard
├── Project: proj-alpha
├── Branch: feature/user-dashboard
├── Container: cc-frontend-001  
├── Status: ✅ Ready for review
├── Issues: #123, #120, #100
└── Next: Waiting for backend API endpoints
```

### Context Handover Notifications

When agents transfer work or context:

```
🔄 [Backend-Agent] Context handover initiated
├── Project: proj-alpha
├── Transferring to: DevOps-Agent
├── Work completed: API implementation
├── Context saved: apm/agents/backend/context/20250127_143022.md
└── Next agent: Deploy to staging environment
```

### GitHub Integration Updates

Automatic synchronization with GitHub workflows:

```
📋 [GitHub-Sync] Issue status updated
├── Issue: #123 "Implement user authentication"
├── Status: In Progress → Review Ready
├── Assignee: frontend-agent
├── PR: #156 "feat: add JWT authentication"
└── Files: 12 changed, 234 insertions, 45 deletions
```

## 🎮 Command Reference

### Slack Commands

Use these commands in any APM channel:

#### Basic Operations
```
/apm-status                    Show all active CC instances
/apm-status <project>          Show status for specific project  
/apm-handover <from> <to>      Initiate context handover
/apm-save-context             Trigger context save across instances
```

#### Project Management
```
/apm-plan <project>           Show Implementation Plan progress
/apm-issues <project>         List GitHub issues for project
/apm-milestones               Show upcoming milestones
/apm-blockers                 List all blocked work items
```

#### Instance Management
```
/apm-spawn <role> <project>   Create new CC instance
/apm-connect <instance-id>    Connect existing CC instance
/apm-disconnect <instance-id> Disconnect CC instance
/apm-restart <instance-id>    Restart CC instance coordination
```

### Claude Code Commands

Use these commands in Claude Code terminal instances:

#### Slack Integration
```
/slack-connect <project> <role>    Connect to Slack coordination
/slack-status <message>            Post status update
/slack-handover <target-agent>     Initiate handover process
/slack-disconnect                  Disconnect from coordination
```

#### Context Management
```
/context-save                      Save context and notify Slack
/context-load <context-id>         Load saved context
/context-share <target-agent>      Share context with another agent
```

## 🔧 Advanced Usage

### Multi-Project Coordination

When working on multiple projects simultaneously:

1. **Set Up Project Hierarchies**:
   ```bash
   # Configure project dependencies
   /apm-dependency proj-alpha depends-on proj-core
   /apm-priority proj-alpha high
   ```

2. **Resource Allocation**:
   ```bash
   # Assign CC instances to projects
   /apm-allocate frontend-001 proj-alpha 80%
   /apm-allocate frontend-001 proj-beta 20%
   ```

3. **Cross-Project Coordination**:
   - Use `#apm-coordination` for dependency discussions
   - Set up automated notifications for blocking dependencies
   - Coordinate resource sharing between projects

### Implementation Plan Integration

The integration automatically tracks progress against Implementation Plans:

1. **Plan Synchronization**:
   - Tasks are mapped to CC instances based on role
   - Progress is tracked at task and milestone levels
   - Completion notifications include plan updates

2. **Progress Reporting**:
   ```
   📊 [Implementation-Plan] proj-alpha Progress Update
   ├── Phase 1: Authentication System - 85% complete
   ├── Phase 2: User Dashboard - 45% complete  
   ├── Phase 3: API Integration - 10% complete
   └── Overall Progress: 47% complete (on track)
   ```

3. **Milestone Notifications**:
   - Automatic alerts when milestones are reached
   - Risk identification for delayed components
   - Recommendation engine for resource reallocation

### GitHub Workflow Integration

Seamless integration with GitHub operations:

1. **Issue Tracking**:
   - Automatic issue assignment to CC instances
   - Status synchronization (Open → In Progress → Review → Closed)
   - Progress updates based on commit messages

2. **Pull Request Management**:
   - PR creation notifications with agent context
   - Review request routing to appropriate agents
   - Merge notifications with impact analysis

3. **Commit Intelligence**:
   - Automatic parsing of commit messages for progress
   - Issue reference extraction and linking
   - Implementation Plan task completion tracking

## 🔍 Troubleshooting

### Common Issues

#### CC Instance Not Connecting
```
❌ Error: CC instance frontend-001 failed to connect to Slack

Troubleshooting:
1. Verify Slack coordinator is running
2. Check /slack-connect command syntax
3. Ensure project name exists in configuration
4. Restart Slack coordinator if needed
```

#### Missing Status Updates
```
⚠️ Warning: No status updates from backend-002 for 30 minutes

Troubleshooting:
1. Check CC instance is still active
2. Verify webhook connectivity
3. Review error logs in CC instance
4. Restart coordination if needed
```

#### GitHub Sync Issues
```
🚫 Error: GitHub synchronization failed for proj-alpha

Troubleshooting:
1. Verify GitHub CLI authentication
2. Check repository permissions
3. Review GitHub API rate limits
4. Restart GitHub sync service
```

### Diagnostic Commands

```bash
# Check system health
/apm-health                    Overall system status
/apm-logs <instance-id>        Show logs for specific instance
/apm-test-github              Test GitHub integration
/apm-test-slack               Test Slack connectivity

# Performance monitoring
/apm-metrics                  Show performance metrics
/apm-tokens                   Show token usage statistics
/apm-bottlenecks             Identify coordination bottlenecks
```

### Recovery Procedures

#### Context Recovery
If context is lost during handovers:

1. **Manual Context Restoration**:
   ```bash
   # In affected CC instance
   /context-recover <timestamp>
   /slack-reconnect <project> <role>
   ```

2. **Emergency Handover**:
   ```bash
   # Force handover with manual context
   /apm-emergency-handover <from> <to> <context-file>
   ```

#### System Reset
For major coordination issues:

1. **Soft Reset**:
   ```bash
   /apm-reset-coordination      # Restart coordination only
   ```

2. **Full Reset**:
   ```bash
   /apm-reset-full             # Reset all connections and state
   ```

## 📈 Best Practices

### Agent Organization

1. **Clear Role Assignment**:
   - Assign specific roles to CC instances (frontend, backend, testing, devops)
   - Avoid overlapping responsibilities
   - Use descriptive instance names

2. **Project Boundaries**:
   - Keep related work in same project channels
   - Use cross-project coordination channels for dependencies
   - Maintain clear project ownership

3. **Context Management**:
   - Save context frequently during complex work
   - Use descriptive names for context saves
   - Clean up old context regularly

### Communication Patterns

1. **Status Updates**:
   - Provide meaningful status descriptions
   - Include next steps in updates
   - Tag related issues and PRs

2. **Handover Communication**:
   - Clearly document work completed
   - Explain any blockers or issues
   - Provide clear next steps for receiving agent

3. **Problem Reporting**:
   - Use specific error messages
   - Include relevant context and logs
   - Tag appropriate team members

### Performance Optimization

1. **Token Efficiency**:
   - Batch related updates when possible
   - Use milestone-based reporting vs continuous updates
   - Leverage file-based state management

2. **Resource Management**:
   - Monitor CC instance resource usage
   - Balance load across instances
   - Use scheduled maintenance windows

3. **GitHub Integration**:
   - Batch GitHub operations
   - Use efficient query patterns
   - Monitor API rate limits

## 🆘 Support

### Getting Help

1. **Documentation**: Check this guide and project README
2. **GitHub Issues**: Report bugs or feature requests
3. **Community**: Join discussions for usage questions
4. **Logs**: Include relevant logs when reporting issues

### Contributing

1. **Feature Requests**: Use GitHub issues with feature template
2. **Bug Reports**: Include reproduction steps and environment details
3. **Documentation**: Suggest improvements or additions
4. **Code**: Follow APM framework contribution guidelines

---

**Note**: This guide covers the production version of APM Slack Integration. During development phases, some features may be limited or unavailable. Check the project status for current capability levels.