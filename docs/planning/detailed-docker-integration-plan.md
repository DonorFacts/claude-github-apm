# Detailed Docker Integration Plan
## Claude GitHub APM + textcortex/claude-code-sandbox

**Created**: 2025-06-27  
**Status**: Ready for Review  
**Priority**: High - Security Enhancement  
**Estimated Timeline**: 8-12 weeks  

---

## Executive Summary

This plan details the integration of [textcortex/claude-code-sandbox](https://github.com/textcortex/claude-code-sandbox) with the Claude GitHub APM framework to provide secure containerized execution while preserving our multi-agent architecture and workflow automation.

**Key Integration Points Identified:**
- Configuration system via `claude-sandbox.config.json`
- CLI interface for programmatic container management
- Docker/Podman abstraction for container lifecycle
- Volume mounting for persistent agent memory
- Git integration hooks for GitHub workflow preservation

**Architectural Approach**: Hybrid orchestration where APM manages multiple specialized sandbox containers, each configured for specific agent roles while maintaining our existing coordination and memory systems.

---

## Integration Architecture

### Current State Analysis

**APM Framework Strengths:**
- Multi-agent role specialization (Developer, QA, Prompt Engineer, etc.)
- Persistent memory system (`MEMORY.md` + context saves)
- Cross-session handover protocols
- GitHub issue integration and PR automation
- Token-optimized prompt engineering
- Worktree-based branch isolation

**Claude Code Sandbox Strengths:**
- Secure container isolation with `--dangerously-skip-permissions`
- Docker/Podman abstraction via dockerode
- Automatic credential discovery and forwarding
- Git branch management and commit monitoring
- Web UI terminal for contained execution
- Configurable security profiles

### Proposed Hybrid Architecture

```
APM Framework (Host Orchestration)
├── Worktree Management
│   ├── Branch creation and cleanup
│   ├── GitHub issue integration
│   └── Multi-window VS Code coordination
├── Agent Coordination Layer
│   ├── Role-based container orchestration
│   ├── Inter-agent communication protocols
│   └── Memory persistence management
├── Container Management (NEW)
│   ├── Per-agent sandbox containers
│   ├── Shared volume management
│   ├── Security profile enforcement
│   └── Resource allocation
└── Existing Features (Preserved)
    ├── Agent memory system
    ├── Handover protocols
    ├── GitHub workflows
    └── Prompt optimization
```

### Container Architecture Design

**Multi-Container Agent Model:**
```
Host System
├── apm-manager (GitHub integration, no dangerous permissions)
├── apm-developer (Full sandbox execution)
├── apm-qa (Testing and validation sandbox)
├── apm-prompt-engineer (Prompt development sandbox)
└── Shared Volumes
    ├── /apm/agents (persistent agent memory)
    ├── /project (mounted project files)
    └── /shared-temp (inter-agent communication)
```

---

## Implementation Phases

### Phase 1: Foundation Setup (Weeks 1-2)
**Objective**: Establish basic APM + Sandbox integration

**Deliverables:**
1. **APM Sandbox Wrapper** (`src/scripts/docker/apm-sandbox.sh`)
   - CLI wrapper around claude-code-sandbox
   - APM-specific configuration management
   - Container lifecycle management

2. **Configuration Templates** (`src/config/docker/`)
   - Agent-specific sandbox configurations
   - Security profile definitions
   - Volume mounting templates

3. **Integration Testing Environment**
   - Isolated test environment setup
   - Basic container orchestration validation
   - Performance baseline establishment

**Technical Specifications:**

**APM Sandbox CLI Interface:**
```bash
# Core commands
./src/scripts/docker/apm-sandbox.sh start --agent developer
./src/scripts/docker/apm-sandbox.sh attach --agent developer
./src/scripts/docker/apm-sandbox.sh list
./src/scripts/docker/apm-sandbox.sh stop --agent developer
./src/scripts/docker/apm-sandbox.sh clean

# APM-specific commands
./src/scripts/docker/apm-sandbox.sh handover --from developer --to qa
./src/scripts/docker/apm-sandbox.sh memory-sync --agent developer
./src/scripts/docker/apm-sandbox.sh github-setup --agent manager
```

**Configuration Structure:**
```
src/config/docker/
├── base-config.json              # Common sandbox settings
├── agents/
│   ├── developer.config.json     # Developer-specific settings
│   ├── qa.config.json            # QA-specific settings
│   ├── prompt-engineer.config.json
│   └── manager.config.json       # GitHub integration agent
├── security-profiles/
│   ├── standard.json             # Basic isolation
│   ├── high.json                 # Enhanced security
│   └── maximum.json              # Maximum isolation
└── templates/
    ├── Dockerfile.developer      # Custom developer environment
    ├── Dockerfile.qa            # Testing-focused environment
    └── Dockerfile.base          # Common base image
```

### Phase 2: Agent Integration (Weeks 3-6)
**Objective**: Integrate containerized execution with existing agent workflows

**Deliverables:**
1. **Enhanced Worktree Creation**
   - Modify `src/prompts/git/worktrees/create.md`
   - Add Docker option to worktree initialization
   - Container setup automation

2. **Agent Memory Persistence**
   - Volume mounting for `apm/agents/` directories
   - Container-aware context saves
   - Memory synchronization between host and containers

3. **Handover Protocol Adaptation**
   - Containerized handover file processing
   - Cross-container agent communication
   - Container state transfer mechanisms

**Technical Specifications:**

**Enhanced Worktree Creation Flow:**
```typescript
// Pseudo-code for enhanced worktree creation
interface WorktreeOptions {
  branch: string;
  issue?: string;
  agent: AgentRole;
  useDocker?: boolean;
  securityProfile?: 'standard' | 'high' | 'maximum';
}

async function createWorktree(options: WorktreeOptions) {
  // Existing worktree creation
  await createGitWorktree(options.branch);
  await setupVSCodeWorkspace();
  
  // NEW: Optional Docker setup
  if (options.useDocker) {
    await setupDockerEnvironment({
      agent: options.agent,
      securityProfile: options.securityProfile,
      volumes: getAgentVolumes(options.agent),
      environment: getAgentEnvironment(options.agent)
    });
  }
  
  // Existing GitHub integration
  await createOrUpdateGitHubIssue(options.issue);
  await initializeAgentMemory(options.agent);
}
```

**Agent Configuration Schema:**
```json
{
  "agent": "developer",
  "dockerImage": "apm-developer:latest",
  "securityProfile": "standard",
  "volumes": {
    "agent_memory": "./apm/agents/developer:/apm/agent/memory",
    "project_files": ".:/workspace",
    "shared_temp": "./tmp/apm-shared:/shared"
  },
  "environment": {
    "AGENT_ROLE": "developer",
    "APM_AGENT_ID": "dev-001",
    "GITHUB_INTEGRATION": "true"
  },
  "allowedTools": ["bash", "npm", "git", "docker"],
  "setupCommands": [
    "npm install",
    "source /apm/agent/setup.sh"
  ],
  "resourceLimits": {
    "cpus": "2",
    "memory": "4g",
    "pids": 100
  }
}
```

### Phase 3: Advanced Features (Weeks 7-10)
**Objective**: Implement advanced multi-container coordination and security features

**Deliverables:**
1. **Multi-Container Orchestration**
   - Container-to-container communication
   - Shared state management
   - Resource coordination

2. **Advanced Security Features**
   - Network segmentation between agent containers
   - Fine-grained permission controls
   - Audit logging and monitoring

3. **Performance Optimization**
   - Container startup optimization
   - Memory usage optimization
   - Resource pooling

**Technical Specifications:**

**Inter-Container Communication:**
```typescript
interface InterAgentMessage {
  from: AgentRole;
  to: AgentRole;
  type: 'handover' | 'context-share' | 'notification';
  payload: any;
  timestamp: string;
}

// Shared message queue via mounted volume
class AgentCommunication {
  async sendMessage(message: InterAgentMessage) {
    await writeToSharedVolume(`/shared/messages/${message.to}`, message);
  }
  
  async receiveMessages(agent: AgentRole): Promise<InterAgentMessage[]> {
    return await readFromSharedVolume(`/shared/messages/${agent}`);
  }
}
```

**Network Security Configuration:**
```yaml
# docker-compose.yml for multi-container setup
version: '3.8'
services:
  apm-manager:
    image: apm-manager:latest
    networks:
      - apm-public
    ports:
      - "3000:3000"
    
  apm-developer:
    image: apm-developer:latest
    networks:
      - apm-internal
    volumes:
      - ./apm/agents/developer:/apm/memory
      - .:/workspace:ro
    
  apm-qa:
    image: apm-qa:latest
    networks:
      - apm-internal
    volumes:
      - ./apm/agents/qa:/apm/memory
      - .:/workspace:ro

networks:
  apm-public:
    driver: bridge
  apm-internal:
    driver: bridge
    internal: true
```

### Phase 4: Production Readiness (Weeks 11-12)
**Objective**: Finalize production deployment and documentation

**Deliverables:**
1. **Production Configuration**
   - Hardened security profiles
   - Monitoring and logging setup
   - Backup and recovery procedures

2. **Documentation and Training**
   - Integration guide updates
   - Agent-specific Docker documentation
   - Troubleshooting guides

3. **Migration Tools**
   - Non-Docker to Docker migration scripts
   - Configuration validation tools
   - Performance comparison tools

---

## File Structure Changes

### New Directory Structure
```
src/
├── config/
│   └── docker/                    # NEW: Docker configurations
│       ├── agents/
│       ├── security-profiles/
│       └── templates/
├── scripts/
│   └── docker/                    # NEW: Docker orchestration scripts
│       ├── apm-sandbox.sh
│       ├── container-management.sh
│       └── volume-sync.sh
├── prompts/
│   ├── docker/                    # NEW: Docker-specific prompts
│   │   ├── container-init.md
│   │   └── security-setup.md
│   └── git/worktrees/
│       └── create.md              # MODIFIED: Add Docker options
└── containers/                    # NEW: Container definitions
    ├── Dockerfile.base
    ├── Dockerfile.developer
    ├── Dockerfile.qa
    └── docker-compose.yml
```

### Modified Files
```
src/prompts/git/worktrees/create.md     # Add Docker integration
src/scripts/git/worktree-create.sh     # Container setup hooks
apm/agents/*/MEMORY.md                  # Container awareness
docs/workflow/worktree-handover.md     # Docker handover process
```

---

## Configuration Management

### Base Configuration Template
```json
{
  "name": "apm-${agent}",
  "dockerImage": "apm-${agent}:latest",
  "dockerfile": "src/containers/Dockerfile.${agent}",
  "detached": true,
  "containerPrefix": "apm-",
  
  "volumes": {
    "agent_memory": "./apm/agents/${agent}:/apm/memory",
    "project_files": ".:/workspace",
    "shared_communication": "./tmp/apm-shared:/shared"
  },
  
  "environment": {
    "AGENT_ROLE": "${agent}",
    "APM_PROJECT_ROOT": "/workspace",
    "APM_MEMORY_PATH": "/apm/memory",
    "APM_SHARED_PATH": "/shared"
  },
  
  "setupCommands": [
    "source /apm/setup/init-${agent}.sh",
    "npm install --no-audit --no-fund",
    "/apm/setup/restore-agent-context.sh"
  ],
  
  "security": {
    "allowedTools": ["git", "npm", "node", "bash"],
    "networkAccess": "limited",
    "resourceLimits": {
      "cpus": "2",
      "memory": "4g",
      "pids": 100
    }
  }
}
```

### Agent-Specific Configurations

**Developer Agent:**
```json
{
  "extends": "base-config.json",
  "security": {
    "allowedTools": ["git", "npm", "node", "bash", "docker", "curl"],
    "networkAccess": "full",
    "dangerousPermissions": true
  },
  "setupCommands": [
    "npm install --include=dev",
    "npm run build"
  ]
}
```

**QA Agent:**
```json
{
  "extends": "base-config.json",
  "security": {
    "allowedTools": ["git", "npm", "node", "bash", "playwright", "jest"],
    "networkAccess": "testing",
    "dangerousPermissions": false
  },
  "setupCommands": [
    "npm install",
    "npx playwright install"
  ]
}
```

---

## Integration Testing Strategy

### Phase 1 Testing
**Container Lifecycle Testing:**
- Container creation and destruction
- Volume mounting verification
- Configuration loading validation
- Resource limit enforcement

**Integration Point Testing:**
- APM CLI wrapper functionality
- Configuration template processing
- Error handling and logging

### Phase 2 Testing
**Agent Workflow Testing:**
- Containerized agent initialization
- Memory persistence across container restarts
- Handover process in containerized environment
- GitHub integration from containers

**Performance Testing:**
- Container startup time measurement
- Resource usage monitoring
- Workflow execution time comparison

### Phase 3 Testing
**Security Testing:**
- Container isolation verification
- Network segmentation validation
- Permission boundary testing
- Escape attempt simulation

**Multi-Container Testing:**
- Inter-container communication
- Resource sharing and conflicts
- Concurrent agent execution

---

## Risk Assessment & Mitigation

### High-Risk Areas

**1. Complexity Explosion**
- *Risk*: Integration adds significant complexity
- *Mitigation*: Phased implementation with extensive testing
- *Fallback*: Maintain non-Docker execution paths

**2. Performance Degradation**
- *Risk*: Container overhead impacts workflow speed
- *Mitigation*: Optimize container images and startup times
- *Fallback*: Performance-based configuration options

**3. Agent Coordination Breakdown**
- *Risk*: Containerization breaks multi-agent workflows
- *Mitigation*: Careful design of inter-container communication
- *Fallback*: Hybrid mode with some agents containerized

### Medium-Risk Areas

**4. Memory System Conflicts**
- *Risk*: Container isolation conflicts with agent memory
- *Mitigation*: Volume mounting strategy for memory persistence
- *Fallback*: Container-aware memory system modifications

**5. GitHub Integration Issues**
- *Risk*: Containers cannot access GitHub APIs properly
- *Mitigation*: Credential forwarding and network configuration
- *Fallback*: Manager agent on host for GitHub operations

### Low-Risk Areas

**6. Learning Curve**
- *Risk*: Users need to learn Docker concepts
- *Mitigation*: Comprehensive documentation and defaults
- *Fallback*: Optional Docker usage

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] APM wrapper successfully orchestrates claude-code-sandbox
- [ ] Configuration templates generate valid sandbox configs
- [ ] Container lifecycle management working correctly
- [ ] Performance overhead < 15% compared to non-Docker execution

### Phase 2 Success Criteria
- [ ] Containerized agents successfully initialize with memory persistence
- [ ] Handover protocols work between containerized agents
- [ ] GitHub workflows function correctly from containers
- [ ] Agent specialization preserved in containerized environment

### Phase 3 Success Criteria
- [ ] Multi-container agent coordination functional
- [ ] Security isolation verified through penetration testing
- [ ] Resource management prevents system overload
- [ ] Inter-agent communication reliable and secure

### Final Success Criteria
- [ ] Complete APM workflow executable in containerized environment
- [ ] Security enhanced without workflow degradation
- [ ] User experience maintained or improved
- [ ] Documentation complete and users successfully onboarded

---

## Timeline & Resource Allocation

### Phase 1 (Weeks 1-2)
**Effort**: 40-50 hours
- CLI wrapper development: 20 hours
- Configuration system: 15 hours
- Testing environment: 10 hours
- Documentation: 5 hours

### Phase 2 (Weeks 3-6)
**Effort**: 80-100 hours
- Worktree integration: 25 hours
- Agent memory system: 30 hours
- Handover protocol adaptation: 25 hours
- Testing and validation: 20 hours

### Phase 3 (Weeks 7-10)
**Effort**: 60-80 hours
- Multi-container orchestration: 30 hours
- Security enhancements: 20 hours
- Performance optimization: 15 hours
- Advanced testing: 15 hours

### Phase 4 (Weeks 11-12)
**Effort**: 30-40 hours
- Production hardening: 15 hours
- Documentation completion: 10 hours
- Migration tools: 10 hours
- Final validation: 5 hours

**Total Estimated Effort**: 200-270 hours over 12 weeks

---

## Implementation Readiness

### Prerequisites
- Docker Desktop or Podman installed
- Node.js ≥18.0.0 for sandbox dependency
- Existing APM framework functional
- Test environment for integration validation

### Dependencies
- `@textcortex/claude-code-sandbox` npm package
- Docker/Podman container runtime
- Additional npm packages for orchestration
- VS Code extensions for container development

### Skills Required
- Docker/container orchestration experience
- TypeScript/Node.js development
- Shell scripting for CLI wrappers
- APM framework architecture understanding

---

## Approval Decision Points

### Phase 1 Go/No-Go Decision
**Criteria**: 
- Successful basic integration demonstration
- Performance impact acceptable
- Configuration system working
- No major architectural conflicts identified

### Phase 2 Go/No-Go Decision
**Criteria**:
- Agent workflows function in containers
- Memory persistence working correctly
- Handover protocols adapted successfully
- User experience remains acceptable

### Phase 3 Go/No-Go Decision
**Criteria**:
- Multi-container coordination stable
- Security benefits realized
- Performance optimizations effective
- Production readiness achievable

---

**This integration plan balances ambitious security enhancements with pragmatic implementation constraints, providing a clear path forward while maintaining escape hatches if challenges emerge.**