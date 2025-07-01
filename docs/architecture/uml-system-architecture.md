# APM System Architecture UML Diagrams

## System Architecture Diagram

```plantuml
@startuml APM_System_Architecture
!theme plain

package "APM Team Management System" {
  
  package "Team Registry" as TR {
    component "Agent Identities" as AI
    component "Domain Expertise Tracker" as DET  
    component "Assignment Status" as AS
    component "Team Relationship Mapper" as TRM
  }
  
  package "Session Management" as SM {
    component "Individual Agent Contexts" as IAC
    component "Work History & Specialization" as WHS
    component "Recovery Mechanisms" as RM
    component "Team Status Brief Generator" as TSBG
  }
  
  package "Intelligence Layer" as IL {
    component "Domain Analysis Engine" as DAE
    component "Routing Recommendations" as RR
    component "Cross-Agent Status Tracker" as CAST
    component "Dependency Coordinator" as DC
  }
  
  package "Coordination Layer" as CL {
    component "Task Assignment Engine" as TAE
    component "Team Communication Hub" as TCH
    component "Cross-Specialist Collaborator" as CSC
    component "Intelligent Handoff Manager" as IHM
  }
}

package "External Systems" {
  component "VS Code Windows" as VSC
  component "Slack Workspace" as SLACK
  component "Claude Code Instances" as CC
  component "APM CLI" as CLI
}

' Connections
VSC --> CC : spawns/manages
CC --> SM : registers/updates
CC --> IL : requests routing
CC --> CL : receives tasks

CLI --> TR : manages team
CLI --> SM : session operations
CLI --> CL : task assignment

SLACK --> CL : commands/status
CL --> SLACK : notifications/updates

TR --> SM : team data
SM --> IL : context analysis
IL --> CL : routing decisions
TR <--> CL : team coordination

@enduml
```

## Agent Lifecycle Diagram

```plantuml
@startuml Agent_Lifecycle
!theme plain

start

:User starts CC instance;
:CC reads agent configuration;

if (Existing session?) then (yes)
  :Load session from registry;
  :Read context file;
  :Generate team status brief;
  :Resume with team awareness;
else (no)
  :Create new agent identity;
  :Register with team registry;
  :Initialize new context;
  :Generate team status brief;
  :Start fresh session;
endif

:Agent active with team awareness;

fork
  :Regular work with user;
  :Update context periodically;
fork again
  :Send heartbeat to registry;
  :Update team status;
fork again
  :Monitor for routing requests;
  :Analyze message domains;
endfork

if (System crash/restart?) then (yes)
  :Session marked as 'crashed';
  :Context preserved;
  stop
else (graceful shutdown)
  :Update final status;
  :Mark session as 'closed';
  :Notify dependent agents;
  stop
endif

@enduml
```

## Team Coordination Sequence Diagram

```plantuml
@startuml Team_Coordination_Sequence
!theme plain

actor User
participant "dev-sarah-auth" as Sarah
participant "Team Registry" as Registry
participant "Intelligence Layer" as Intel
participant "dev-mike-ui" as Mike

User -> Sarah : "How do I style the dashboard buttons?"

Sarah -> Intel : analyze_message_domain("style dashboard buttons")
Intel -> Intel : domain = "ui-styling"
Intel -> Sarah : domain_mismatch(confidence=0.9, suggested="dev-mike-ui")

Sarah -> Registry : get_agent_status("dev-mike-ui")
Registry -> Sarah : {active: true, current_task: "dashboard components", terminal: "tab-3"}

Sarah -> User : """
🤔 I notice you're asking about dashboard styling, 
but I specialize in authentication systems.

You should talk to **dev-mike-ui** who's working on 
dashboard components (currently active in terminal tab 3).

Would you like me to help coordinate with him?
"""

User -> Sarah : "Yes, please coordinate"

Sarah -> Mike : coordinate_handoff(user_request="dashboard button styling")
Mike -> Sarah : acknowledge_handoff()

Sarah -> User : "I've notified dev-mike-ui. You can find him in terminal tab 3, or he may message you shortly."

note right of Sarah
  Sarah maintains context that 
  auth-related aspects of dashboard 
  styling should come back to her
end note

@enduml
```

## Data Model Diagram

```plantuml
@startuml APM_Data_Model
!theme plain

class AgentIdentity {
  +agent_id: string
  +role: string
  +specialization: string
  +human_name?: string
  +created_at: Date
  +domain_expertise: string[]
  +autonomy_level: number
}

class SessionRecord {
  +session_id: string
  +agent_id: string
  +worktree: string
  +branch: string
  +vscode_window_id: string
  +terminal_name: string
  +conversation_id: string
  +context_file: string
  +status: SessionStatus
  +last_activity: Date
  +message_count: number
  +working_directory: string
}

class TeamStatus {
  +team_id: string
  +project: string
  +active_agents: AgentIdentity[]
  +dependencies: Dependency[]
  +recent_activity: Activity[]
  +last_updated: Date
}

class Dependency {
  +from_agent: string
  +to_agent: string
  +dependency_type: string
  +description: string
  +status: DependencyStatus
}

class Activity {
  +agent_id: string
  +activity_type: string
  +description: string
  +timestamp: Date
  +related_agents?: string[]
}

class DomainExpertise {
  +agent_id: string
  +domain: string
  +expertise_level: number
  +acquired_at: Date
  +context_examples: string[]
}

enum SessionStatus {
  ACTIVE
  PAUSED
  CLOSED
  CRASHED
}

enum DependencyStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  BLOCKED
}

' Relationships
AgentIdentity ||--o{ SessionRecord : has
AgentIdentity ||--o{ DomainExpertise : develops
TeamStatus ||--o{ AgentIdentity : contains
TeamStatus ||--o{ Dependency : tracks
TeamStatus ||--o{ Activity : logs
Dependency }o--|| AgentIdentity : involves

note top of AgentIdentity : Persistent across restarts
note top of SessionRecord : Maps to conversation contexts
note top of TeamStatus : Real-time team coordination

@enduml
```

## Slack Integration Architecture

```plantuml
@startuml Slack_Integration_Architecture
!theme plain

package "Slack Workspace" {
  component "#apm-command-center" as CMD
  component "#apm-agents-activity" as ACTIVITY
  component "#proj-{name}-dashboard" as PROJ
}

package "APM Coordination System" {
  component "Slack Command Processor" as SCP
  component "Webhook Server" as WHS
  component "Task Assignment Engine" as TAE
  component "Team Status Reporter" as TSR
}

package "Agent Network" {
  component "dev-sarah-auth" as SARAH
  component "dev-mike-ui" as MIKE
  component "pe-jennifer-ux" as JENNIFER
  component "..." as MORE
}

' Slack -> APM flow
CMD -> SCP : /apm-assign, /apm-status
SCP -> TAE : parse and route commands
TAE -> SARAH : assign specific task
TAE -> MIKE : assign specific task

' APM -> Slack flow  
SARAH -> WHS : status updates
MIKE -> WHS : task completion
WHS -> ACTIVITY : post team updates
TSR -> PROJ : project status

' Cross-agent coordination
SARAH <-> MIKE : dependency coordination
JENNIFER -> TSR : expertise insights

note right of SCP
  Processes commands like:
  /apm-assign @dev-sarah-auth "fix OAuth bug"
  /apm-status team
  /apm-handoff sarah -> mike
end note

@enduml
```

## Recovery Process Flow

```plantuml
@startuml Recovery_Process_Flow
!theme plain

start

:System restart detected;
:APM CLI started;

:Scan session registry;
:Identify crashed sessions;

if (Crashed sessions found?) then (yes)
  :List crashed sessions;
  
  :User runs 'apm list sessions --crashed';
  
  fork
    :Display session details;
    :Show last activity;
    :Show specialization;
  fork again
    :Analyze VS Code windows;
    :Map sessions to worktrees;
  endfork
  
  :User chooses recovery option;
  
  if (Recovery type?) then (all sessions)
    :apm reopen sessions --all;
    fork
      :Create terminals in VS Code Window 1;
      :Initialize agents for main worktree;
    fork again
      :Create terminals in VS Code Window 2;
      :Initialize agents for feature-A worktree;
    fork again
      :Create terminals in VS Code Window 3;
      :Initialize agents for feature-B worktree;
    endfork
  elseif (current worktree)
    :apm reopen sessions;
    :Create terminals in current VS Code window;
    :Initialize agents for current worktree;
  else (specific session)
    :apm reopen session {id};
    :Create terminal for specific agent;
    :Initialize with full context;
  endif
  
  :All agents restored with team awareness;
  :Team status synchronized;
  
else (no crashes)
  :All sessions healthy;
endif

:System ready for operation;

stop

@enduml
```

These diagrams illustrate the complete architecture for the APM persistent team management system, showing how agents maintain individual identity while coordinating as a team with intelligent routing and recovery capabilities.