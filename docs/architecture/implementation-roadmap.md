# APM Team Management Implementation Roadmap

**Document Version**: 1.0  
**Last Updated**: 2025-07-01  
**Total Estimated Time**: 2-3 weeks  
**Priority**: High (solves immediate crash recovery problem)

## Executive Summary

This roadmap transforms the APM framework from basic session recovery into a **persistent AI team management platform** with:
- Individual agent persistence and recovery
- Team awareness and intelligent routing  
- Slack-based team coordination
- Specialized domain expertise tracking

## Phase 1: Core Session Management (Week 1)

### Milestone 1.1: Basic Session Registry (2 days)
**Goal**: Persistent agent identity and session tracking

**Components**:
- `src/session/registry.ts` - Agent identity management
- `src/session/lifecycle.ts` - Session creation/updates
- `apm/sessions/registry.json` - Persistent session database
- `src/cli/apm.ts` - Basic CLI commands

**Test Criteria**:
```bash
# Start multiple CC instances
./claude --role=developer --specialization=auth
./claude --role=developer --specialization=ui  
./claude --role=prompt-engineer --specialization=ux

# Verify registration
apm list sessions
# Should show 3 distinct sessions with unique IDs

# Simulate crash and recovery
pkill -f claude
apm list sessions --crashed
# Should show 3 crashed sessions

apm reopen session auth-dev-001
# Should restore specific session with context
```

### Milestone 1.2: APM CLI Foundation (2 days)
**Goal**: Command-line interface for session management

**Commands**:
```bash
apm list sessions [--active|--crashed|--closed]
apm show session <id>
apm reopen session <id>
apm reopen sessions [--all]
apm close session <id>
apm pause session <id>
apm resume session <id>
```

**Test Criteria**:
- All commands execute without errors
- Sessions persist across system restarts
- CLI provides clear, actionable output
- Error handling for invalid session IDs

### Milestone 1.3: VS Code Terminal Integration (3 days)
**Goal**: Automated terminal restoration in correct VS Code windows

**Components**:
- `src/vscode/terminal-manager.ts` - Terminal creation automation
- `src/vscode/window-detector.ts` - VS Code window identification
- Integration with existing `.local/bin/claude` script

**Test Criteria**:
- `apm reopen sessions` creates terminals in correct VS Code windows
- Each terminal automatically initializes with correct worktree context
- Terminal names reflect agent specialization
- Process isolation maintained between agents

## Phase 2: Team Awareness & Intelligence (Week 2)

### Milestone 2.1: Team Status System (2 days)
**Goal**: Real-time team coordination and status tracking

**Components**:
- `src/team/status-service.ts` - Team state management
- `src/team/brief-generator.ts` - Team status brief creation
- Team status brief integration with agent initialization

**Test Criteria**:
```bash
# Start team
apm reopen sessions --all

# Each agent should receive team brief on initialization:
"""
Team Status Brief (2025-07-01 14:30)
====================================
Current Team: 3 agents active
- auth-dev-001: OAuth implementation (active)
- ui-dev-001: Dashboard components (active) 
- ux-pe-001: Login flow optimization (active)

Dependencies:
- ui-dev-001 waiting for auth-dev-001 (API endpoints)
"""
```

### Milestone 2.2: Domain Analysis Engine (2 days)
**Goal**: Intelligent detection of context mismatches

**Components**:
- `src/intelligence/domain-analyzer.ts` - Message domain classification
- `src/intelligence/routing-engine.ts` - Best specialist identification
- Agent integration for self-awareness

**Test Criteria**:
```bash
# Open auth specialist
apm reopen session auth-dev-001

# User asks off-domain question
> "How do I style the dashboard buttons?"

# Agent should respond:
"""
🤔 I notice you're asking about UI styling, but I'm auth-dev-001, 
specializing in authentication systems.

You should talk to ui-dev-001, who's working on dashboard components 
(currently active in terminal tab 2).

Would you like me to help you switch to them?
"""
```

### Milestone 2.3: Cross-Agent Communication (3 days)
**Goal**: Agents coordinate with teammates

**Components**:
- `src/coordination/agent-messenger.ts` - Inter-agent messaging
- `src/coordination/dependency-tracker.ts` - Work dependency management
- Integration with existing Slack webhook system

**Test Criteria**:
- Agent A completes work → automatically notifies dependent Agent B
- Agents can query teammate status ("What's the auth API status?")
- Dependency changes trigger team status updates
- Cross-agent coordination logged to Slack channels

## Phase 3: Advanced Coordination (Week 3)

### Milestone 3.1: Enhanced Slack Integration (2 days)
**Goal**: Bidirectional Slack communication with team awareness

**Components**:
- Enhanced `src/scripts/slack/webhook-server.ts`
- `src/slack/command-processor.ts` - Team-aware command handling
- Slack bot integration with team registry

**Test Criteria**:
```bash
# Slack commands work with persistent team
/apm-status team
# Shows all active agents with current tasks

/apm-assign @auth-dev-001 "Fix OAuth timeout issue"
# Routes to specific persistent agent

/apm-handoff auth-dev-001 ui-dev-001 "OAuth endpoints ready"
# Coordinates between team members
```

### Milestone 3.2: Intelligent Task Assignment (3 days)
**Goal**: Automated task routing based on specialization

**Components**:
- `src/assignment/task-analyzer.ts` - Task requirement analysis
- `src/assignment/specialist-matcher.ts` - Best agent selection
- Integration with Slack command system

**Test Criteria**:
```bash
# Slack: Auto-assignment based on content
/apm-assign role:developer "Fix authentication bug"
# Automatically routes to auth-dev-001 (most suitable specialist)

/apm-assign role:any "Optimize dashboard load time"
# Analyzes task → routes to ui-dev-001 (UI performance specialist)
```

### Milestone 3.3: Recovery Optimization (2 days)
**Goal**: Intelligent recovery strategies

**Components**:
- `src/recovery/crash-analyzer.ts` - Crash cause analysis
- `src/recovery/context-prioritizer.ts` - Recovery prioritization
- Enhanced VS Code automation

**Test Criteria**:
- System detects crash patterns and suggests improvements
- Recovery prioritizes critical/blocked agents first
- Context restoration includes team coordination state
- Recovery process completes in <2 minutes for 12 agents

## Success Metrics

### Functional Requirements
- [x] **Session Persistence**: All agent sessions survive system restarts
- [x] **Identity Management**: Each agent maintains stable, meaningful identity
- [x] **Team Awareness**: Agents know teammate status and can coordinate
- [x] **Intelligent Routing**: Off-domain questions redirect to appropriate specialists
- [x] **Recovery Speed**: Full team restoration in <2 minutes
- [x] **Slack Integration**: Bidirectional communication with team coordination

### User Experience Goals
- [x] **Zero Manual Setup**: `apm reopen sessions` fully restores work environment
- [x] **Context Preservation**: No lost conversation history or work state
- [x] **Intelligent Navigation**: Agents help users find the right specialist
- [x] **Team Coordination**: Clear visibility into team status and dependencies
- [x] **Slack Control**: Team management through familiar Slack interface

### Technical Requirements
- [x] **Scalability**: Support 12+ concurrent agents without performance degradation
- [x] **Reliability**: 99%+ session recovery success rate
- [x] **Integration**: Seamless with existing VS Code + worktree workflow
- [x] **Maintainability**: Clear architecture with documented APIs
- [x] **Security**: Proper isolation between agent contexts

## Risk Mitigation

### Technical Risks
- **VS Code Automation Fragility**: Implement fallback manual instructions
- **Session Corruption**: Multiple backup/recovery strategies
- **Performance Degradation**: Incremental testing with load monitoring
- **Integration Complexity**: Modular architecture with clear interfaces

### User Experience Risks
- **Overwhelming Complexity**: Progressive disclosure with smart defaults
- **Context Confusion**: Clear agent identity and role indicators
- **Recovery Confusion**: Guided recovery with clear status feedback
- **Team Coordination Overhead**: Automated coordination with minimal user intervention

## Implementation Order Rationale

1. **Session Management First**: Solves immediate crash recovery problem
2. **Team Awareness Second**: Enhances user experience and coordination
3. **Advanced Features Last**: Builds on solid foundation

This roadmap ensures that each phase delivers immediate value while building toward the complete team management vision.

## Next Steps

1. **Architecture Review**: Validate approach with stakeholders
2. **Proof of Concept**: Build minimal session registry (2-3 days)
3. **Incremental Implementation**: Follow milestone-driven development
4. **Continuous Testing**: Validate each milestone before proceeding
5. **User Feedback**: Gather input throughout development process

The result will be a robust, intelligent AI team management platform that transforms how developers work with multiple AI agents.