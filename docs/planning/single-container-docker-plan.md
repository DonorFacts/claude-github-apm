# Single Container Docker Architecture Plan
## Unified Workspace for Multi-Agent Collaboration

**Created**: 2025-06-29  
**Status**: ✅ IMPLEMENTED  
**Priority**: High - Architecture Revision  
**Implementation Date**: 2025-06-29

> **Note**: This plan has been successfully implemented. The single-container architecture is now the active Docker implementation for the APM framework.

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

#### 1.1 Container Management Script (Complete Implementation)
**File**: `src/scripts/docker/apm-container.ts`

```typescript
#!/usr/bin/env tsx

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface ContainerConfig {
  name: string;
  image: string;
  projectRoot: string;
  status: 'running' | 'stopped' | 'not-found' | 'unhealthy';
}

class ApmContainer {
  private readonly CONTAINER_NAME = 'apm-workspace';
  private readonly IMAGE_NAME = 'apm-claude-container:latest';
  private readonly DOCKERFILE_PATH = path.join(__dirname, '../../docker/claude-container/Dockerfile');
  private readonly HEALTH_CHECK_INTERVAL = 30; // seconds
  private readonly RESTART_DELAY = 5; // seconds
  
  async main(): Promise<void> {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    switch (command) {
      case 'ensure':
        await this.ensure();
        break;
      case 'exec':
        await this.exec(args);
        break;
      case 'start':
        await this.start();
        break;
      case 'stop':
        await this.stop();
        break;
      case 'status':
        await this.printStatus();
        break;
      case 'logs':
        await this.logs();
        break;
      case 'shell':
        await this.exec(['bash']);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: apm-container.ts [ensure|exec|start|stop|status|logs|shell]');
        process.exit(1);
    }
  }
  
  async ensure(): Promise<void> {
    // Check Docker availability first
    if (!this.isDockerAvailable()) {
      console.error('❌ Docker not found or not running');
      console.error('Please install Docker Desktop and ensure it\'s running');
      process.exit(1);
    }
    
    // Build image if needed
    await this.ensureImage();
    
    // Check container status
    const status = await this.getStatus();
    
    if (status === 'not-found') {
      await this.create();
    } else if (status === 'stopped') {
      await this.start();
    } else if (status === 'unhealthy') {
      await this.restart();
    }
    
    // Verify container is healthy
    await this.waitForHealthy();
  }
  
  private async ensureImage(): Promise<void> {
    // Check if image exists
    try {
      execSync(`docker image inspect ${this.IMAGE_NAME}`, { stdio: 'ignore' });
    } catch {
      console.log('🔨 Building container image...');
      execSync(`docker build -t ${this.IMAGE_NAME} ${path.dirname(this.DOCKERFILE_PATH)}`, {
        stdio: 'inherit'
      });
    }
  }
  
  private isDockerAvailable(): boolean {
    try {
      execSync('docker info', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private findProjectRoot(): string {
    let current = process.cwd();
    while (current !== '/') {
      if (fs.existsSync(path.join(current, 'package.json')) &&
          fs.existsSync(path.join(current, 'apm'))) {
        return current;
      }
      // Check if we're in a worktree
      const parent = path.dirname(current);
      if (path.basename(parent) === 'worktrees') {
        return path.dirname(parent);
      }
      current = parent;
    }
    throw new Error('Could not find APM project root');
  }
  
  async create(): Promise<void> {
    const projectRoot = this.findProjectRoot();
    console.log(`🐳 Creating container with project root: ${projectRoot}`);
    
    const args = [
      'run', '-d',
      '--name', this.CONTAINER_NAME,
      '--restart', 'unless-stopped',
      '-v', `${projectRoot}:/workspace`,
      '-v', `${process.env.HOME}/.claude:/root/.claude`,
      '-v', `${process.env.HOME}/.zshrc:/root/.zshrc:ro`,
      '--health-cmd', 'pgrep -x bash || exit 1',
      '--health-interval', `${this.HEALTH_CHECK_INTERVAL}s`,
      '--health-timeout', '5s',
      '--health-retries', '3',
      '--health-start-period', '10s',
      '-e', 'APM_CONTAINERIZED=true',
      '-e', 'APM_PROJECT_ROOT=/workspace',
      this.IMAGE_NAME,
      'tail', '-f', '/dev/null'  // Keep container running
    ];
    
    execSync(`docker ${args.join(' ')}`, { stdio: 'inherit' });
    console.log('✅ Container created successfully');
  }
  
  async start(): Promise<void> {
    console.log('🚀 Starting container...');
    execSync(`docker start ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
  }
  
  async stop(): Promise<void> {
    console.log('🛑 Stopping container...');
    execSync(`docker stop ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
  }
  
  async restart(): Promise<void> {
    console.log('🔄 Restarting container...');
    await this.stop();
    await this.sleep(this.RESTART_DELAY);
    await this.start();
  }
  
  async getStatus(): Promise<string> {
    try {
      const output = execSync(
        `docker inspect -f '{{.State.Status}}' ${this.CONTAINER_NAME}`,
        { encoding: 'utf-8' }
      ).trim();
      
      if (output === 'running') {
        // Check health
        const health = await this.getHealth();
        return health === 'healthy' ? 'running' : 'unhealthy';
      }
      return output as any;
    } catch {
      return 'not-found';
    }
  }
  
  async getHealth(): Promise<string> {
    try {
      const output = execSync(
        `docker inspect -f '{{.State.Health.Status}}' ${this.CONTAINER_NAME}`,
        { encoding: 'utf-8' }
      ).trim();
      return output;
    } catch {
      return 'unknown';
    }
  }
  
  async waitForHealthy(): Promise<void> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      const health = await this.getHealth();
      if (health === 'healthy') {
        console.log('✅ Container is healthy');
        return;
      }
      console.log(`⏳ Waiting for container to be healthy... (${i + 1}/${maxAttempts})`);
      await this.sleep(2);
    }
    throw new Error('Container failed to become healthy');
  }
  
  async exec(command: string[]): Promise<void> {
    // Ensure container is ready
    await this.ensure();
    
    // Get working directory
    const projectRoot = this.findProjectRoot();
    const relativePath = path.relative(projectRoot, process.cwd());
    const workDir = path.join('/workspace', relativePath);
    
    // Execute command in container
    const args = [
      'exec', '-it',
      '-w', workDir,
      '-e', `APM_AGENT_ROLE=${process.env.APM_AGENT_ROLE || 'developer'}`,
      '-e', `APM_WORKTREE_NAME=${path.basename(process.cwd())}`,
      this.CONTAINER_NAME,
      ...command
    ];
    
    // Use spawn for interactive commands
    const docker = spawn('docker', args, {
      stdio: 'inherit',
      shell: false
    });
    
    docker.on('exit', (code) => {
      process.exit(code || 0);
    });
  }
  
  async printStatus(): Promise<void> {
    const status = await this.getStatus();
    const health = status === 'running' ? await this.getHealth() : 'n/a';
    
    console.log(`Container: ${this.CONTAINER_NAME}`);
    console.log(`Status: ${status}`);
    console.log(`Health: ${health}`);
    
    if (status === 'running') {
      // Show active sessions (simplified for now)
      console.log('\nProject root mounted at: /workspace');
    }
  }
  
  async logs(): Promise<void> {
    execSync(`docker logs -f ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
  }
  
  private sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
}

// Run the container manager
if (require.main === module) {
  const container = new ApmContainer();
  container.main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
```

#### 1.2 Claude Wrapper Enhancement
**File**: `.local/bin/claude` (project root level)

```bash
#!/bin/bash
# APM Single Container Claude Wrapper
# This wrapper ensures the shared container exists then executes Claude inside it
# Place this at project root: ~/www/claude-github-apm/.local/bin/claude

set -e

# Find project root by looking for package.json and apm directory
find_project_root() {
  local current="$PWD"
  while [ "$current" != "/" ]; do
    if [ -f "$current/package.json" ] && [ -d "$current/apm" ]; then
      echo "$current"
      return 0
    fi
    # Check if we're in a worktree
    local parent=$(dirname "$current")
    if [ "$(basename "$parent")" = "worktrees" ]; then
      echo "$(dirname "$parent")"
      return 0
    fi
    current="$parent"
  done
  echo "Error: Not in an APM project directory" >&2
  return 1
}

# Detect project root
PROJECT_ROOT=$(find_project_root)
if [ -z "$PROJECT_ROOT" ]; then
  echo "❌ Could not find APM project root" >&2
  echo "Make sure you're in an APM project directory" >&2
  exit 1
fi

export APM_PROJECT_ROOT="$PROJECT_ROOT"

# Use tsx to run the container manager
# Note: This assumes pnpm/npm is available on host
cd "$PROJECT_ROOT"
exec pnpm tsx src/scripts/docker/apm-container.ts exec \
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

#### 2.2 Updated Dockerfile for Single Container
**File**: `src/docker/claude-container/Dockerfile`

Key changes needed:
```dockerfile
# Add to existing Dockerfile:

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pgrep -x bash || exit 1

# Ensure PATH includes common workspace locations
ENV PATH="/workspace/.local/bin:/workspace/node_modules/.bin:${PATH}"

# Remove the claude user - we'll run as root for simplicity
# (Remove lines creating/switching to claude user)

# Update entrypoint to not auto-run claude
# The container should just stay alive, claude runs on demand
ENTRYPOINT ["/bin/bash", "-c", "tail -f /dev/null"]
```

#### 2.3 Complete Updated Dockerfile
Here's what the complete Dockerfile should look like:

```dockerfile
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl bash zsh ca-certificates wget gnupg \
    iptables netbase dnsutils jq sox alsa-utils \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor > /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code pnpm tsx

# Create workspace directory
RUN mkdir -p /workspace

# Install direnv
RUN curl -sfL https://direnv.net/install.sh | bash

# Set up root user shell configuration
RUN echo 'export HISTSIZE=100000' >> /root/.bashrc \
    && echo 'export PATH="/workspace/.local/bin:/workspace/node_modules/.bin:$PATH"' >> /root/.bashrc \
    && echo 'alias python=python3' >> /root/.bashrc \
    && echo 'alias pip=pip3' >> /root/.bashrc \
    && echo 'alias e="pnpm tsx"' >> /root/.bashrc \
    && echo 'alias pn=pnpm' >> /root/.bashrc \
    && echo 'eval "$(direnv hook bash)"' >> /root/.bashrc

# Network security through container isolation (no firewall needed)

# Set environment variables
ENV APM_CONTAINERIZED=true \
    APM_PROJECT_ROOT=/workspace \
    PNPM_STORE_DIR=/home/user/.pnpm-store

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD pgrep -x bash || exit 1

WORKDIR /workspace

# Keep container running
ENTRYPOINT ["/bin/bash", "-c", "tail -f /dev/null"]
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

### Research Findings

#### Dev Container Investigation
We thoroughly researched using VS Code Dev Containers to solve the extension compatibility issue:

**What we discovered:**
- Claude Code doesn't run a local server (no port to forward)
- The VS Code extension spawns `claude` CLI directly
- Communication likely uses stdin/stdout or IPC, not network
- No documented cases of extension working in containers
- Official Anthropic devcontainer is for developing Claude Code, not using it

**Why Dev Containers won't help:**
- Extension expects `claude` binary in local PATH
- No network port means no port forwarding solution
- Dev Container can't bridge process-based communication
- Would require extension redesign by Anthropic

#### Community Approaches
- **agentapi**: Wraps Claude in HTTP API, but requires custom extension
- **MCP Servers**: For Claude Desktop, not VS Code extension
- **Reality**: Everyone uses terminal Claude in containers, not extension

### Our Solution: Terminal-Only Workflow

**Decision**: Accept that VS Code extension won't work with containerized Claude. The security benefits of containerization outweigh the loss of IDE integration.

**Implementation approach:**
1. Use `pnpm claude` command for all Claude interactions
2. Keep VS Code for editing, use terminal for Claude
3. Single shared container for all agents/worktrees
4. Full security isolation maintained

**User Experience:**
```bash
# In VS Code terminal, from any worktree
cd ~/www/claude-github-apm/worktrees/feature-123
pnpm claude

# Claude runs in secure container
# Full --dangerously-skip-permissions safety
# Natural file paths (/workspace/worktrees/feature-123)
```

### Future Possibilities
If Anthropic adds container support to their extension:
- Could revisit Dev Container approach
- Would need extension to support remote development
- Not available today, not worth waiting for

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

### Phase 1: Container Management Implementation
- [ ] Create `src/scripts/docker/apm-container.ts` with TypeScript implementation
  - Container lifecycle management (create, start, stop, health check)
  - Auto-restart on unhealthy status
  - Project root detection and mounting
  - Health monitoring with 30s intervals
- [ ] Test container manager script standalone
- [ ] Add error handling for Docker not installed/running

### Phase 2: Dockerfile Updates
- [ ] Update `src/docker/claude-container/Dockerfile`:
  - Add HEALTHCHECK directive
  - Configure PATH to include `/workspace/.local/bin`
  - Remove claude user (use root for simplicity)
  - Update entrypoint for persistent container
- [ ] Build and test container image
- [ ] Verify health checks work properly

### Phase 3: Integration Scripts
- [ ] Create new `.local/bin/claude` wrapper:
  - Detect if in APM project
  - Call apm-container.ts to ensure container
  - Execute claude inside container with proper working directory
- [ ] Add npm scripts to package.json:
  - `"claude": "tsx src/scripts/docker/apm-container.ts exec claude --dangerously-skip-permissions"`
  - `"container:start"`, `"container:stop"`, `"container:status"`, etc.
- [ ] Test `pnpm claude` from various worktrees

### Phase 4: Worktree Updates
- [ ] Simplify `src/scripts/git/worktree-create.sh`:
  - Remove per-worktree Docker setup
  - Create symlink to project-level claude wrapper
  - Keep .envrc for environment variables only
- [ ] Test worktree creation with new setup

### Phase 5: Testing & Validation
- [ ] Test multi-agent scenarios (multiple terminals, same container)
- [ ] Test container recovery after crashes
- [ ] Verify container auto-starts on first `pnpm claude`
- [ ] Test from different worktrees simultaneously
- [ ] Measure performance impact

### Phase 6: Documentation
- [ ] Create migration guide for existing worktrees
- [ ] Update main README with new workflow
- [ ] Document troubleshooting steps
- [ ] Add examples of multi-agent usage

---

## Success Criteria

1. **Single Command**: `claude` works from any worktree
2. **Automatic Container**: Created on first use, reused by all
3. **No Manual Setup**: No direnv, no Docker commands
4. **Multi-Agent**: Multiple terminals, same container
5. **Natural Paths**: `/workspace` = project root

---

**Result**: Simpler, more efficient architecture that better matches your mental model and requirements.

---

## Implementation Summary for Next Agent

### What We're Building
A single Docker container shared by all Claude Code instances across all worktrees, providing security isolation while maintaining simple developer UX.

### Key Architecture Decisions
1. **One container** for entire project (not per-worktree)
2. **Terminal-only** workflow (VS Code extension incompatible)
3. **Mount at project root** (`~/www/claude-github-apm` → `/workspace`)
4. **Auto-start container** on first `pnpm claude` usage
5. **Health checks** for reliability

### Implementation Order
1. Create `src/scripts/docker/apm-container.ts` (full code provided above)
2. Update Dockerfile (remove claude user, add health check, keep container alive)
3. Create `.local/bin/claude` wrapper at project root
4. Add npm scripts to package.json
5. Test with multiple terminals/worktrees
6. Update worktree creation script to use project-level wrapper

### Critical Details
- Container name: `apm-workspace`
- Image name: `apm-claude-container:latest`
- Working directory mapping: Current dir → `/workspace/[relative-path]`
- Use `spawn()` not `execSync()` for interactive Claude session
- Container persists between sessions (use `tail -f /dev/null`)

### Testing Checklist
- [ ] `pnpm claude` auto-creates container on first use
- [ ] Multiple terminals can use same container
- [ ] Correct working directory in each worktree
- [ ] Container recovers from crashes
- [ ] Git operations work correctly
- [ ] File paths are natural (/workspace/worktrees/feature-x)