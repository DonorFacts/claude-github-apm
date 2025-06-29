# Docker Container Security for APM Framework

**Enterprise Security**: Run Claude Code agents in a shared Docker container with `--dangerously-skip-permissions` safely contained, enabling autonomous multi-agent collaboration while maintaining enterprise-grade security boundaries.

**Architecture**: Single persistent container serving all agents and worktrees with automatic lifecycle management.

## Quick Start

### Prerequisites
- Docker Desktop (macOS/Windows) or Docker CE (Linux)
- VS Code (for terminal interface)

### Create Secure Worktree
```bash
# Standard worktree creation with container security (default)
./src/scripts/git/worktree-create.sh feature-123-auth developer "Implement authentication"
```

### Start Containerized Development
1. VS Code opens worktree automatically
2. Run `pnpm claude` in VS Code terminal
3. Container auto-creates on first use (takes ~30 seconds)
4. Subsequent runs connect instantly to existing container
5. Same terminal UX with enhanced security underneath

## Security Architecture

### Three-Tier Security Model

**Tier 1: Container Isolation**
- Host filesystem separation (only project files accessible)
- Process isolation from host system
- Resource consumption limits (CPU, memory, processes)
- Credential and SSH key protection

**Tier 2: Network Security**
- Configurable network policies (none/isolated/standard)
- Container network isolation from host
- Controlled internet access for development needs

**Tier 3: Multi-Agent Collaboration**
- Single container shared by all agents and worktrees
- Cross-worktree file access for team coordination
- Shared APM memory system across all agents
- Main branch visibility for architectural decisions
- Zero overhead for inter-agent communication

### Benefits

#### Enterprise Security
- **`--dangerously-skip-permissions` Safely**: Anthropic's dangerous flag contained within security boundaries
- **Zero Trust Architecture**: Each agent runs in isolated container with minimal required access
- **Audit Trail**: All container operations logged and traceable
- **Configurable Security Levels**: From maximum isolation to standard compatibility

#### Multi-Agent Collaboration
- **Single Container**: All agents share one persistent container
- **Cross-Team Access**: Agents can review and coordinate across different worktrees
- **Shared Memory**: APM agent memory system enables handoffs and knowledge transfer
- **Architectural Visibility**: All agents can see main branch for architectural context
- **Concurrent Development**: Multiple agents working safely in parallel with zero container overhead

#### Developer Experience
- **Same VS Code Terminal**: Familiar interface, same keyboard shortcuts
- **Transparent Execution**: Container runs invisibly behind `pnpm claude` command
- **Auto-start**: Container creates itself on first use
- **Seamless Integration**: No workflow changes required
- **Agent Memory Persists**: Memory system works identically in containers
- **Dynamic User**: Runs as your host user, not root

## How It Works

### Architecture
```
VS Code (Host)                    Docker Container (Shared)
├── Terminal UI                   ├── Claude Code instance(s)
├── File explorer                 ├── Project root (mounted at /workspace)
├── Git integration               ├── All worktrees accessible
└── 'pnpm claude' command         ├── APM memory (shared)
                                  └── Persistent container (apm-workspace)
```

### File Structure
```
claude-github-apm/                # Project root
├── src/
│   ├── scripts/
│   │   └── docker/
│   │       └── apm-container.ts  # Container management
│   └── docker/
│       └── claude-container/
│           └── Dockerfile        # Container image definition
├── .local/
│   └── bin/
│       └── claude                # Project-level wrapper
├── apm/                          # Memory system (shared)
│   └── agents/                   # Agent memory persists
└── worktrees/                    # All worktrees share container
    └── feature-x/
        └── .local/bin/claude     # Symlink to project wrapper
```

## Security Configuration

### Security Levels

Configure security level via environment variable:

```bash
# Maximum Security - No network access
export APM_SECURITY_LEVEL=maximum

# Restricted Security - Firewall enabled (default for production)
export APM_SECURITY_LEVEL=restricted  

# Standard Security - Host network for development
export APM_SECURITY_LEVEL=standard
```

#### Maximum Security (`maximum`)
- **Network**: Completely isolated (no internet access)
- **Resources**: 2GB RAM, 1 CPU, 100 processes max
- **Filesystem**: Read-only root, temporary mounts only
- **Use Case**: Highly sensitive environments, offline development

```bash
# Container configuration for maximum security
--network none
--memory=2g --cpus=1.0 --pids-limit=100
--read-only --tmpfs /tmp:rw,size=500m
```

#### Restricted Security (`restricted`) 
- **Network**: Firewall with domain whitelist
- **Resources**: 4GB RAM, 2 CPUs, 200 processes max
- **Filesystem**: Writable workspace, temporary mounts
- **Use Case**: Production environments, CI/CD

```bash
# Container configuration for restricted security
--network bridge  # Isolated network bridge
--memory=4g --cpus=2.0 --pids-limit=200
--tmpfs /tmp:rw,size=1g
```

#### Standard Security (`standard`)
- **Network**: Host network (full compatibility)
- **Resources**: 8GB RAM, 4 CPUs, unlimited processes
- **Filesystem**: Full workspace access
- **Use Case**: Development, debugging, maximum compatibility

```bash
# Container configuration for standard security
--network host
--memory=8g --cpus=4.0
```

### Network Configuration

The `restricted` security level provides isolated networking while maintaining internet access for development needs including:
- Claude API access
- Git operations and GitHub integration  
- NPM package installations
- Documentation and research

### Container Mounts

The single container mounts the entire project root:

```bash
# Project root mounted at /workspace
-v "${PROJECT_ROOT}:/workspace"

# User's Claude configuration
-v "${HOME}/.claude:/home/user/.claude"

# User's shell configuration (read-only)
-v "${HOME}/.zshrc:/home/user/.zshrc:ro"
```

This provides access to:
- All worktrees at `/workspace/worktrees/`
- Main branch at `/workspace/main/`
- Shared APM memory at `/workspace/apm/`
- Natural path structure matching host filesystem

### Container Lifecycle

The framework uses TypeScript for container management:

```typescript
// src/scripts/docker/apm-container.ts handles:
- Container creation with health checks
- Automatic start/restart on failures  
- Dynamic user mapping (runs as host user)
- Working directory preservation
- Environment variable passing
```

Container details:
- **Name**: `apm-workspace`
- **Image**: `apm-claude-container:latest`
- **Policy**: `--restart unless-stopped`
- **Health**: Monitors every 30 seconds
- **User**: Runs as your host UID/GID (not root)

### Environment Variables

Automatically set in containers for agent coordination:

- `APM_CONTAINERIZED=true` - Container detection flag
- `APM_PROJECT_ROOT=/workspace` - Current worktree path
- `APM_MAIN_BRANCH_PATH=/workspace-main` - Main branch access path
- `APM_WORKTREES_PATH=/workspace-worktrees` - All worktrees access path
- `APM_SECURITY_LEVEL` - Current security configuration
- `APM_SKIP_RESTRICTIONS` - Bypass additional security restrictions

## UX Flow

### Development Workflow
1. **Create worktree**: `./src/scripts/git/worktree-create.sh feature-branch developer "Description"`
2. **VS Code opens**: Automatically opens worktree in new window
3. **Start Claude**: Run `pnpm claude` (container auto-creates on first use)
4. **Develop securely**: Same terminal UX with container security underneath
5. **Switch worktrees**: Other terminals can use same container concurrently

### Mental Model
- **One container** = Entire project (all worktrees share it)
- **Multiple terminals** = Multiple Claude sessions in same container
- **No visible containers** - everything appears native
- **Persistent state** - container keeps running between sessions

## Agent Behavior

### Container Detection
Agents automatically detect containerized environments:
- Terminal titles show 🐳 container indicator when APM_DEBUG=true
- Memory paths adapt to container mount points (`/workspace/apm/agents/`)
- Initialization confirms container vs. host environment

### Memory System
Identical behavior in containers and host:
- `MEMORY.md` persists across container restarts
- Context saves work seamlessly
- Handover protocols function identically

## Performance

### First-Time Setup
- **Initial build**: 1-2 minutes for container image build (automatic)
- **Subsequent starts**: 2-5 seconds for container startup
- **Resource overhead**: ~50-100MB RAM per container instance

### Ongoing Performance
- **File I/O**: Minimal performance impact from volume mounting
- **Terminal responsiveness**: Identical to native VS Code terminal
- **Claude Code performance**: No noticeable difference

## Troubleshooting

### Container Won't Build
```bash
# Check Docker is running
docker ps

# Manually build container if needed
docker build -t apm-claude-container:latest src/docker/claude-container/

# Test container directly
docker run --rm apm-claude-container:latest claude --version
```

### Memory Not Persisting
```bash
# Verify volume mounting in container
APM_DEBUG=true claude  # Shows mount information

# Check if apm directory exists
ls -la apm/agents/

# Verify wrapper script
which claude  # Should show .local/bin/claude
```

### Performance Issues
```bash
# Monitor container resources
docker stats

# Check if container is reused properly
docker ps  # Should show running claude container

# Clear container cache if needed
docker system prune
```

## Migration

### Enabling Container Security
Containers are automatically configured:
```bash
# This creates containerized worktrees by default
./src/scripts/git/worktree-create.sh feature-branch

# If Docker is not available, falls back to direct execution
```

### Containerize Existing Worktree
To add container support to an existing worktree:

```bash
# From main project directory - script handles existing worktrees
./src/scripts/git/worktree-create.sh existing-branch-name developer "Description"
```

This will:
1. Detect the existing worktree
2. Add `.local/bin/claude` wrapper with container execution
3. Configure `.envrc` to use the containerized claude command

### From Legacy Docker to Transparent Containers
Existing worktrees with old Docker configurations can be updated:
1. Delete any old container configuration files
2. Re-run the worktree script to generate transparent wrapper
3. The `claude` command will automatically use containers

## Security Notes

### What Docker Containers Protect
- Host file system isolation (only project files accessible)
- SSH key and credential protection
- System configuration isolation
- Resource consumption limits
- Network access controls

### What Docker Containers Don't Protect
- Network-based attacks (can be configured with additional Docker security)
- Container escape vulnerabilities (rare with standard Docker)
- Shared kernel exploits (theoretical)

### Best Practices
- Keep Docker updated for security patches
- Monitor container resource usage with `docker stats`
- Use minimal container images for reduced attack surface
- Regularly rebuild containers to get security updates

## Comparison: Multi-Container vs. Single-Container

### Previous Design (Multi-Container)
```
- One container per worktree
- Complex path mapping
- Higher resource usage
- Container management overhead
- Difficult inter-agent communication
```

### Current Implementation (Single-Container)
```
- One container for entire project
- Simple /workspace mount
- Minimal resource usage
- Auto-start on first use
- Direct inter-agent file access
```

**Result**: Simpler architecture with better performance and easier multi-agent collaboration.

---

**Key Insight**: The best security is invisible security. Users get protection without changing their workflow.