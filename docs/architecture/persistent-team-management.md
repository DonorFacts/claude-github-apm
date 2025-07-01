# APM Persistent Team Management Architecture

**Document Version**: 1.0  
**Last Updated**: 2025-07-01  
**Status**: Architecture Design Phase

## The Real Architecture Challenge: Persistent Specialized Team Members

The APM framework manages not just "session recovery" but **persistent specialized team members** with individual expertise and contexts.

### The True Scenario

**VS Code Window 1 (main):**
- Developer #1: Authentication specialist (3 hours deep in OAuth flow)
- Developer #2: UI component specialist (building dashboard widgets)  
- Developer #3: Database specialist (working on schema migrations)
- Prompt Engineer #1: Auth UX prompt optimization

**VS Code Window 2 (feature-dashboard):**
- Developer #4: Dashboard API specialist 
- Developer #5: Dashboard frontend specialist
- Prompt Engineer #2: Dashboard workflow prompts

These aren't interchangeable "developer role instances" - they're **distinct team members** with:
- Individual expertise domains
- Separate conversation histories  
- Different current contexts
- Specialized knowledge accumulated over time

## The APM Vision Connection

This connects to the larger vision: **AI Team Orchestration at Scale**

Instead of managing "tools," we're managing a **persistent software development team** where:
1. Each agent develops domain expertise over time
2. Team members maintain individual project contexts
3. Coordination happens at the "team lead" level (human + Slack)
4. Team structure persists across system interruptions
5. Task assignment targets specific specialists, not generic roles

## Session Identity Architecture

**Challenge**: How do we create persistent, meaningful identities for specialized team members?

### Proposed Identity Strategy

**Domain-Based Naming**:
```
{domain}-{role}-{specialization}-{instance}

Examples:
- auth-dev-backend-001     (backend dev specializing in auth)
- auth-dev-frontend-001    (frontend dev specializing in auth)  
- dashboard-dev-api-001    (API dev specializing in dashboard)
- payment-dev-security-001 (security dev specializing in payments)
- auth-pe-ux-001          (prompt engineer specializing in auth UX)
```

**Alternative Human-Style Naming**:
```
{role}-{firstname}-{domain}

Examples:  
- dev-sarah-auth          (Sarah, the auth specialist)
- dev-mike-ui             (Mike, the UI specialist)
- pe-jennifer-ux          (Jennifer, the UX prompt specialist)
```

## Core Architectural Principles

1. **Persistent Team Identity**: Each agent maintains a stable identity across restarts
2. **Domain Specialization**: Agents accumulate expertise in specific areas
3. **Individual Context**: Each agent maintains separate conversation/work context
4. **Team Coordination**: System supports assigning tasks to specific specialists
5. **Graceful Recovery**: Team structure reconstructs after interruptions

## High-Level Architecture

```
APM Team Management System
├── Team Registry (persistent team roster)
│   ├── Agent Identities (stable specialist IDs)  
│   ├── Domain Expertise Tracking
│   └── Current Assignment Status
├── Session Management (conversation persistence)
│   ├── Individual Agent Contexts
│   ├── Work History & Specialization  
│   └── Recovery Mechanisms
└── Coordination Layer (team leadership)
    ├── Task Assignment to Specialists
    ├── Team Status & Communication
    └── Cross-Specialist Collaboration
```

## Key Questions for Implementation

1. **Identity Management**: Should identities be user-defined, auto-generated, or hybrid?
2. **Specialization Tracking**: How do we track and evolve each agent's domain expertise?
3. **Context Boundaries**: How do we prevent context bleed between specialized agents?
4. **Team Roster**: How do we maintain the "org chart" of current team composition?
5. **Assignment Logic**: How do we route tasks to the most appropriate specialist?

## Implementation Phases

### Phase 1: Core Team Management
- Team registry system
- Agent identity management  
- Basic session persistence

### Phase 2: Specialization Tracking
- Domain expertise accumulation
- Context boundary enforcement
- Task routing logic

### Phase 3: Advanced Coordination
- Cross-agent communication
- Team status dashboards
- Intelligent task assignment

## Team Awareness & Intelligent Routing

### The Context Switching Problem

**Scenario**: User opens the wrong specialist agent and asks off-domain questions
- Opens `dev-sarah-auth` but asks about dashboard styling
- Opens `pe-jennifer-ux` but asks about database optimization
- Opens `dev-mike-ui` but asks about OAuth implementation

**Result**: Unproductive conversation, lower quality responses, context confusion

### Team Awareness Solution

Each agent receives a **Team Status Brief** on initialization:

```
Team Status Brief (2025-07-01 14:30)
====================================

Current Team Composition:
┌─────────────────────┬──────────────┬─────────────────────┬─────────────┐
│ Agent ID            │ Role         │ Specialization      │ Current Task│
├─────────────────────┼──────────────┼─────────────────────┼─────────────┤
│ dev-sarah-auth      │ Developer    │ Authentication      │ OAuth flows │
│ dev-mike-ui         │ Developer    │ UI Components       │ Dashboard   │
│ dev-tom-backend     │ Developer    │ API & Database      │ Schema mgmt │
│ pe-jennifer-ux      │ Prompt Eng   │ UX Workflows        │ Auth UX     │
│ dev-alex-payments   │ Developer    │ Payment Systems     │ Stripe API  │
└─────────────────────┴──────────────┴─────────────────────┴─────────────┘

Recent Team Activity:
- dev-tom-backend completed OAuth provider setup (2 hours ago)
- dev-sarah-auth implementing OAuth callbacks (active)
- dev-mike-ui waiting for auth API endpoints
- pe-jennifer-ux optimizing login flow prompts

Cross-Dependencies:
- dev-sarah-auth → dev-mike-ui (auth endpoints → frontend integration)
- dev-alex-payments → dev-sarah-auth (payment auth → main auth system)
```

### Intelligent Context Detection

**Agent Self-Awareness Pattern**:
```pseudocode
on_user_message(message):
  my_domain = get_my_specialization()  // "authentication"
  message_domain = analyze_message_domain(message)  // "ui-styling"
  
  if message_domain != my_domain:
    confidence = calculate_domain_mismatch_confidence()
    
    if confidence > 0.8:
      suggested_agent = find_best_specialist(message_domain)
      suggest_redirect(suggested_agent, message_domain)
```

**Example Agent Response**:
```
🤔 I notice you're asking about dashboard styling, but I'm dev-sarah-auth, 
specializing in authentication systems. 

You might want to talk to **dev-mike-ui**, who's been working on dashboard 
components and UI styling. He's currently active in terminal tab 3.

Would you like me to help you switch to him, or is there an auth-related 
aspect to this question I can help with?
```

### Team Coordination Intelligence

**Cross-Agent Status Awareness**:
```pseudocode
// Agent can reference teammate work
on_status_question():
  related_agents = find_related_specialists(my_domain)
  
  return """
  Auth System Status:
  - I'm implementing OAuth callbacks (80% complete)
  - dev-tom-backend finished OAuth provider setup ✅
  - dev-mike-ui is waiting for my API endpoints (2 hours)
  - Expected completion: end of day
  """
```

**Dependency Coordination**:
```pseudocode
on_task_completion():
  notify_dependent_agents([
    "dev-mike-ui: OAuth endpoints ready for integration",
    "dev-alex-payments: Auth tokens available for payment flows"
  ])
```

## Extended Architecture

```
APM Team Management System
├── Team Registry (persistent team roster)
│   ├── Agent Identities (stable specialist IDs)  
│   ├── Domain Expertise Tracking
│   ├── Current Assignment Status
│   └── Team Relationship Mapping
├── Session Management (conversation persistence)
│   ├── Individual Agent Contexts
│   ├── Work History & Specialization  
│   ├── Recovery Mechanisms
│   └── Team Status Brief Generation
├── Intelligence Layer (team awareness)
│   ├── Domain Analysis & Mismatch Detection
│   ├── Routing Recommendations
│   ├── Cross-Agent Status Tracking
│   └── Dependency Coordination
└── Coordination Layer (team leadership)
    ├── Task Assignment to Specialists
    ├── Team Status & Communication
    ├── Cross-Specialist Collaboration
    └── Intelligent Handoff Management
```

## Key Benefits

1. **Conversation Quality**: Prevents off-domain confusion
2. **Efficiency**: Routes users to right specialist immediately  
3. **Team Coordination**: Agents aware of teammate progress
4. **Dependency Management**: Agents coordinate interdependent work
5. **User Experience**: Seamless navigation between specialists

## Implementation Requirements

### Team Status Service
- Real-time team state tracking
- Cross-agent status updates
- Dependency relationship mapping

### Domain Analysis Engine  
- Message content analysis
- Specialization matching
- Confidence scoring

### Routing Intelligence
- Best specialist identification
- Handoff coordination
- Context preservation

This architecture transforms the APM framework from a session recovery system into a **persistent AI team management platform** with **intelligent coordination and routing**.