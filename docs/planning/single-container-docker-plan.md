# Single Container Docker Architecture Plan
## Unified Workspace for Multi-Agent Collaboration

**Created**: 2025-06-29  
**Status**: Draft  
**Priority**: High - Architecture Revision  
**Estimated Timeline**: 2-3 days

---

## Executive Summary

Pivot from multi-container to single-container architecture based on key insights:
- All agents use `--dangerously-skip-permissions` (same security level)
- Project root mounting provides natural collaboration paths
- Automation requirements favor shared container approach
- Simplified architecture reduces complexity while maintaining security

---

## Architecture Overview

### Current State (Multi-Container)
```
Each worktree → Separate container → Isolated Claude instance
Problem: Complex, redundant, hinders collaboration
```

### Target State (Single Container)
```
Project root → One shared container → Multiple Claude sessions
Benefits: Simple, efficient, natural collaboration
```

### Container Lifecycle
```
First agent:    Creates & starts container at project root
Later agents:   Detect & reuse existing container
All agents:     Share filesystem, memory, and resources
Shutdown:       Container persists until explicitly stopped
```

---

## Implementation Plan

### Phase 1: Core Scripts (Day 1)

#### 1.1 Container Management Script
**File**: `src/scripts/docker/apm-container.ts`

```typescript
#!/usr/bin/env tsx

interface ContainerConfig {
  name: string;
  image: string;
  projectRoot: string;
  status: 'running' | 'stopped' | 'not-found' | 'unhealthy';
}

class ApmContainer {
  private readonly CONTAINER_NAME = 'apm-workspace';
  private readonly IMAGE_NAME = 'apm-claude-container:latest';
  private readonly HEALTH_CHECK_INTERVAL = 30; // seconds
  private readonly RESTART_DELAY = 5; // seconds
  
  async ensure(): Promise<void> {
    const status = await this.getStatus();
    
    if (status === 'not-found') {
      await this.create();
    } else if (status === 'stopped' || status === 'unhealthy') {
      await this.restart();
    }
    
    // Verify container is healthy
    await this.waitForHealthy();
    await this.setupEnvironment();
  }
  
  async create(): Promise<void> {
    const projectRoot = this.findProjectRoot();
    
    // Create with health check configuration
    const args = [
      'run', '-d',
      '--name', this.CONTAINER_NAME,
      '--restart', 'unless-stopped',  // Auto-restart policy
      '-v', `${projectRoot}:/workspace`,
      '-v', `${process.env.HOME}/.claude:/root/.claude`,  // Simplified: map to root user
      '-v', `${process.env.HOME}/.zshrc:/root/.zshrc:ro`,  // Read-only host shell config
      '--health-cmd', 'pgrep -x bash || exit 1',
      '--health-interval', `${this.HEALTH_CHECK_INTERVAL}s`,
      '--health-timeout', '5s',
      '--health-retries', '3',
      '--health-start-period', '10s',
      this.IMAGE_NAME,
      'tail', '-f', '/dev/null'  // Keep container running
    ];
    
    await this.docker(args);
  }
  
  async restart(): Promise<void> {
    console.log('🔄 Restarting unhealthy container...');
    await this.docker(['stop', this.CONTAINER_NAME]);
    await this.sleep(this.RESTART_DELAY);
    await this.docker(['start', this.CONTAINER_NAME]);
  }
  
  async waitForHealthy(): Promise<void> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const health = await this.getHealth();
      if (health === 'healthy') {
        return;
      }
      console.log(`⏳ Waiting for container to be healthy... (${i + 1}/${maxAttempts})`);
      await this.sleep(2);
    }
    throw new Error('Container failed to become healthy');
  }
  
  async getHealth(): Promise<string> {
    try {
      const output = await this.docker([
        'inspect', 
        '--format', 
        '{{.State.Health.Status}}',
        this.CONTAINER_NAME
      ]);
      return output.trim();
    } catch {
      return 'unknown';
    }
  }
  
  async exec(command: string[]): Promise<void> {
    // Ensure container is healthy before exec
    await this.ensure();
    
    const args = [
      'exec', '-it',
      '-w', this.getWorkingDirectory(),
      '-e', `APM_AGENT_ROLE=${process.env.APM_AGENT_ROLE || 'developer'}`,
      this.CONTAINER_NAME,
      ...command
    ];
    
    await this.dockerExec(args);
  }
  
  private getWorkingDirectory(): string {
    const projectRoot = this.findProjectRoot();
    const relativePath = path.relative(projectRoot, process.cwd());
    return `/workspace/${relativePath}`;
  }
}
```

#### 1.2 Claude Wrapper Enhancement
**File**: `.local/bin/claude` (updated)

```bash
#!/bin/bash
# Single Container Claude Wrapper
# Ensures container exists then executes Claude inside it

set -e

# Use TypeScript container manager
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
export APM_PROJECT_ROOT="$PROJECT_ROOT"

# Ensure container is running
"$PROJECT_ROOT/src/scripts/docker/apm-container.ts" ensure

# Execute Claude in container
exec "$PROJECT_ROOT/src/scripts/docker/apm-container.ts" exec \
  claude --dangerously-skip-permissions "$@"
```

#### 1.3 Package.json Scripts
**File**: `package.json` (additions)

```json
{
  "scripts": {
    "container:start": "tsx src/scripts/docker/apm-container.ts start",
    "container:stop": "tsx src/scripts/docker/apm-container.ts stop",
    "container:status": "tsx src/scripts/docker/apm-container.ts status",
    "container:logs": "docker logs -f apm-workspace",
    "container:shell": "tsx src/scripts/docker/apm-container.ts shell",
    "claude": "tsx src/scripts/docker/apm-container.ts exec claude --dangerously-skip-permissions"
  }
}
```

### Phase 2: Environment Setup (Day 1-2)

#### 2.1 Automatic Environment Loading
**Approach**: Pre-configure container with paths, no direnv needed

**Dockerfile additions**:
```dockerfile
# Set up persistent PATH modifications
RUN echo 'export PATH="/workspace/.local/bin:$PATH"' >> /etc/profile.d/apm.sh \
    && echo 'export PATH="/workspace/worktrees/*/.local/bin:$PATH"' >> /etc/profile.d/apm.sh \
    && echo 'source /etc/profile.d/apm.sh' >> /home/claude/.bashrc

# Pre-approve workspace directory for direnv (fallback)
RUN mkdir -p /home/claude/.config/direnv \
    && echo '/workspace' > /home/claude/.config/direnv/allowed
```

#### 2.2 Container Initialization Script
**File**: `src/docker/claude-container/init-workspace.sh`

```bash
#!/bin/bash
# Container workspace initialization
# Runs once when container starts

# Ensure APM structure exists
mkdir -p /workspace/apm/{agents,messages,coordination}

# Set up agent registry
if [ ! -f /workspace/apm/coordination/agents.json ]; then
  echo '{"agents":{}}' > /workspace/apm/coordination/agents.json
fi

# Initialize message queue
touch /workspace/apm/messages/queue.jsonl

# Start background daemons if needed
if [ -f /workspace/.local/daemons/message-router.sh ]; then
  nohup /workspace/.local/daemons/message-router.sh &
fi

echo "✅ APM workspace initialized"
```

### Phase 3: Multi-Agent Support (Day 2)

#### 3.1 Agent Session Management
**File**: `src/scripts/docker/agent-session.ts`

```typescript
interface AgentSession {
  id: string;
  role: AgentRole;
  worktree: string;
  startTime: Date;
  terminal: string;
}

class AgentSessionManager {
  async register(role: AgentRole): Promise<string> {
    const session: AgentSession = {
      id: crypto.randomUUID(),
      role,
      worktree: path.basename(process.cwd()),
      startTime: new Date(),
      terminal: process.env.TERM_SESSION_ID || 'unknown'
    };
    
    // Register in shared coordination file
    await this.updateRegistry(session);
    
    return session.id;
  }
  
  async listActive(): Promise<AgentSession[]> {
    // Read from /workspace/apm/coordination/sessions.json
  }
}
```

#### 3.2 Simplified Agent Startup
**Usage from any worktree**:

```bash
# No direnv needed - PATH is pre-configured in container
cd ~/www/claude-github-apm/worktrees/feature-123

# First agent creates container automatically
claude  # Container starts, mounts project root, runs Claude

# Second terminal, different worktree
cd ~/www/claude-github-apm/worktrees/feature-456
claude  # Reuses existing container, new Claude session

# Check active agents
pnpm container:status
# Shows: 2 active sessions (developer, qa) in shared container
```

### Phase 4: Worktree Integration (Day 2-3)

#### 4.1 Enhanced Worktree Creation
**Update**: `src/scripts/git/worktree-create.sh`

```bash
# Remove per-worktree Docker setup
# Instead, just ensure project-level container readiness

# After creating worktree
cat > "$worktree_path/.envrc" << 'EOF'
# APM Worktree Environment
# Note: Container PATH already includes .local/bin
export APM_WORKTREE_NAME="$(basename "$PWD")"
export APM_AGENT_ROLE="${APM_AGENT_ROLE:-developer}"
EOF

# Create simple wrapper that uses project-level container
mkdir -p "$worktree_path/.local/bin"
ln -sf "$PROJECT_ROOT/.local/bin/claude" "$worktree_path/.local/bin/claude"
```

### Phase 5: Container Health & Reliability (Day 3)

#### 5.1 Health Check Implementation
**Key Features**:
- Docker's built-in health check mechanism
- Auto-restart policy (`--restart unless-stopped`)
- Container health monitoring before execution
- Graceful recovery from crashes

**Health Check Strategy**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pgrep -x bash || exit 1
```

#### 5.2 Container Monitoring Script
**File**: `src/scripts/docker/monitor-health.ts`

```typescript
#!/usr/bin/env tsx

// Optional background monitor for additional reliability
class ContainerMonitor {
  private readonly CHECK_INTERVAL = 60000; // 1 minute
  
  async start(): Promise<void> {
    setInterval(async () => {
      const health = await this.checkHealth();
      if (health === 'unhealthy') {
        console.log('⚠️  Container unhealthy, triggering restart...');
        await this.restartContainer();
      }
    }, this.CHECK_INTERVAL);
  }
  
  private async checkHealth(): Promise<string> {
    // Check container health status
    // Log any issues to APM logs
  }
}
```

#### 5.3 Persistence & Recovery
**State Preservation**:
- Message queues persist on host filesystem
- Agent memory in `/workspace/apm/` survives restarts
- Session registry tracks active agents
- Automatic recovery after system reboots

---

## VS Code Extension Compatibility

### The Problem
The Claude Code VS Code extension expects to connect to a local Claude process, but when Claude runs in a container, the extension cannot establish connection. This breaks IDE integration features.

### Implementation Strategy

#### Phase 1: Dev Container Approach (Priority)
Since we're now mounting the entire project root, Dev Containers should work properly:

**Benefits of new mounting strategy:**
- No more `.git` file path issues (entire project mounted)
- All worktrees accessible from single container
- Natural path resolution for git operations
- VS Code and Claude in same environment

**Implementation:**
1. Create `devcontainer.json` at project root
2. Configure to mount entire project at `/workspace`
3. Use environment variable to select active worktree
4. Install Claude Code extension inside container
5. Full IDE integration preserved

**devcontainer.json example:**
```json
{
  "name": "APM Claude Workspace",
  "dockerFile": "src/docker/claude-container/Dockerfile",
  "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind",
  "workspaceFolder": "/workspace",
  "remoteUser": "root",
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash"
      }
    }
  },
  "postStartCommand": "echo 'Dev Container ready. Use: cd worktrees/${WORKTREE_NAME}'"
}
```

**Workflow:**
1. Set `export WORKTREE_NAME=feature-123` in terminal
2. Open VS Code: `code ~/www/claude-github-apm`
3. Choose "Reopen in Container"
4. VS Code runs inside container with full Claude integration
5. Terminal: `cd worktrees/$WORKTREE_NAME` to work in specific worktree

#### Phase 2: Fallback Options (If Dev Container fails)

**Option A: Terminal-Only Workflow**
- Use `pnpm claude` in terminal for all interactions
- Accept loss of IDE integration for security benefits
- Simplest implementation, guaranteed to work

**Option B: Port Forwarding Investigation**
- Research Claude's internal communication protocol
- Expose necessary ports from container
- Configure extension to connect through forwarded ports

**Option C: MCP Server Bridge**
- More complex but might provide full integration
- Requires additional configuration and testing

### Our Revised Recommendation
1. **Try Dev Container approach first** - High chance of success with new mounting strategy
2. **Fall back to terminal-only** if Dev Container has issues
3. **Investigate advanced options** only if critical for workflow

---

## Migration Strategy

### From Multi-Container to Single Container

1. **Stop existing containers**
   ```bash
   docker ps -a | grep claude- | awk '{print $1}' | xargs docker stop
   ```

2. **Update wrapper scripts**
   - Replace worktree-specific wrappers with project-level wrapper
   - Remove complex path detection logic

3. **Test with multiple agents**
   ```bash
   # Terminal 1
   cd worktrees/feature-1 && claude
   
   # Terminal 2  
   cd worktrees/feature-2 && claude
   
   # Verify both use same container
   docker ps  # Should show only 'apm-workspace'
   ```

---

## Benefits Achieved

### Simplicity
- One container to manage
- No per-worktree Docker configuration
- Natural paths (`/workspace/worktrees/feature-123`)

### Automation
- Container created automatically on first use
- No manual direnv approval needed
- PATH pre-configured in container

### Collaboration
- Direct file access between agents
- Shared memory and message queues
- Instant communication

### Performance
- Single image build
- Shared libraries and cache
- Reduced resource overhead

---

## Key Design Decisions

### Why TypeScript for Scripts?
- Consistency with codebase
- Better error handling
- Type safety for Docker API
- You prefer TS over bash

### Why Pre-configured PATH?
- Eliminates direnv requirement
- Works immediately in any terminal
- Simplifies agent startup

### Why Persistent Container?
- Faster agent startup (no rebuild)
- Preserves daemon processes
- Maintains shared state

### Simplified Mount Strategy
With project root mounted at `/workspace`, we achieve:
- **Path Consistency**: Container paths match project structure
- **Simple Mounts**: Just three mounts needed (project, .claude, .zshrc)
- **No Path Translation**: `/workspace/worktrees/feature-123` works naturally
- **Direct Access**: All project files accessible without complex mapping

**Mount Mapping Clarification:**
```bash
# Host Path                               → Container Path
~/www/claude-github-apm                   → /workspace
~/www/claude-github-apm/main              → /workspace/main  
~/www/claude-github-apm/worktrees         → /workspace/worktrees
~/.claude                                 → /root/.claude
~/.zshrc                                  → /root/.zshrc
```

---

## Implementation Checklist

### Phase 1: Dev Container Approach
- [ ] Create `.devcontainer/devcontainer.json` at project root
- [ ] Update Dockerfile for Dev Container compatibility
- [ ] Test VS Code "Reopen in Container" with full project mount
- [ ] Verify Claude Code extension works inside container
- [ ] Test git operations across worktrees
- [ ] Document Dev Container workflow

### Phase 2: Fallback Implementation (if needed)
- [ ] Create `apm-container.ts` manager script with health checks
- [ ] Update Dockerfile with PATH setup and HEALTHCHECK directive
- [ ] Modify `.local/bin/claude` wrapper
- [ ] Add npm scripts to package.json
- [ ] Update worktree creation script
- [ ] Implement container health monitoring

### Phase 3: Testing & Documentation
- [ ] Test multi-agent scenarios
- [ ] Test container recovery after crashes
- [ ] Update documentation
- [ ] Create migration guide

---

## Success Criteria

1. **Single Command**: `claude` works from any worktree
2. **Automatic Container**: Created on first use, reused by all
3. **No Manual Setup**: No direnv, no Docker commands
4. **Multi-Agent**: Multiple terminals, same container
5. **Natural Paths**: `/workspace` = project root

---

**Result**: Simpler, more efficient architecture that better matches your mental model and requirements.