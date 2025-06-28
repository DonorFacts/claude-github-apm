# Docker Container Security for APM Framework

**Enterprise Security**: Run Claude Code agents in isolated Docker containers with `--dangerously-skip-permissions` safely contained, enabling autonomous multi-agent collaboration while maintaining enterprise-grade security boundaries.

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
2. Container environment is configured transparently
3. Run `claude` in VS Code terminal (automatically containerized)
4. Same terminal UX with enhanced security underneath

## Security Architecture

### Three-Tier Security Model

**Tier 1: Container Isolation**
- Host filesystem separation (only project files accessible)
- Process isolation from host system
- Resource consumption limits (CPU, memory, processes)
- Credential and SSH key protection

**Tier 2: Network Security**
- Configurable network policies (none/restricted/standard)
- Domain whitelist firewall for restricted mode
- Default-deny outbound traffic with approved exceptions
- DNS resolution limited to whitelisted domains

**Tier 3: Multi-Agent Collaboration**
- Cross-worktree file access for team coordination
- Shared APM memory system across all agents
- Main branch visibility for architectural decisions
- Secure inter-agent communication through filesystem

### Benefits

#### Enterprise Security
- **`--dangerously-skip-permissions` Safely**: Anthropic's dangerous flag contained within security boundaries
- **Zero Trust Architecture**: Each agent runs in isolated container with minimal required access
- **Audit Trail**: All container operations logged and traceable
- **Configurable Security Levels**: From maximum isolation to standard compatibility

#### Multi-Agent Collaboration
- **Cross-Team Access**: Agents can review and coordinate across different worktrees
- **Shared Memory**: APM agent memory system enables handoffs and knowledge transfer
- **Architectural Visibility**: All agents can see main branch for architectural context
- **Concurrent Development**: Multiple agents working safely in parallel

#### Developer Experience
- **Same VS Code Terminal**: Familiar interface, same keyboard shortcuts
- **Transparent Execution**: Container runs invisibly behind `claude` command
- **Seamless Integration**: No workflow changes required
- **Agent Memory Persists**: Memory system works identically in containers

## How It Works

### Architecture
```
VS Code (Host)                    Docker Container
├── Terminal UI                   ├── Claude Code instance
├── File explorer                 ├── Project files (mounted)
├── Git integration               ├── APM memory (mounted)
└── 'claude' command              └── Isolated execution environment
```

### File Structure
```
worktree/
├── .local/
│   └── bin/
│       └── claude                # Transparent container wrapper
├── .envrc                        # Environment setup (adds .local/bin to PATH)
├── apm/                          # Memory system (mounted)
│   ├── agents/                   # Agent memory persists
│   └── setup/
└── project files                 # Mounted read-write
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
--network bridge  # Custom network with firewall
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

### Network Whitelist Configuration

For `restricted` security level, configure allowed domains:

```bash
# Environment variable (comma-separated)
export ALLOWED_DOMAINS="api.anthropic.com,github.com,registry.npmjs.org,your-domain.com"

# Or disable firewall entirely
export APM_SKIP_FIREWALL=true
```

**Default Whitelist**:
- `api.anthropic.com` - Claude API access
- `github.com` - Git operations, issue management
- `registry.npmjs.org` - NPM package installations
- `githubusercontent.com` - GitHub raw content
- `objects.githubusercontent.com` - GitHub LFS objects

### Multi-Agent Collaboration Mounts

The container automatically detects project structure and mounts:

```bash
# Current worktree (read-write)
-v "${PWD}:/workspace"

# Main branch access (read-write for coordination)
-v "${PROJECT_ROOT}/main:/workspace-main:rw"

# All worktrees (read-write for multi-agent collaboration)  
-v "${PROJECT_ROOT}/worktrees:/workspace-worktrees:rw"

# Shared APM memory system (read-write)
-v "${PROJECT_ROOT}/apm:/workspace/apm"

# Claude configuration (read-write)
-v "${HOME}/.claude:/home/claude/.claude"
```

### Container Template

The framework automatically configures a transparent Docker wrapper with full security stack:

```bash
# Generated claude wrapper in .local/bin/claude
docker run --rm -it \
  --name "claude-$(basename "$PWD")-$$" \
  --workdir /workspace \
  $NETWORK_CONFIG \           # Based on security level
  $RESOURCE_LIMITS \          # Based on security level  
  $SECURITY_OPTS \            # Based on security level
  -v "${PWD}:/workspace" \
  -v "${PROJECT_ROOT}/main:/workspace-main:rw" \
  -v "${PROJECT_ROOT}/worktrees:/workspace-worktrees:rw" \
  -v "${PROJECT_ROOT}/apm:/workspace/apm" \
  -v "${HOME}/.claude:/home/claude/.claude" \
  -e APM_CONTAINERIZED=true \
  -e APM_SECURITY_LEVEL="$SECURITY_LEVEL" \
  apm-claude-container:latest \
  claude --dangerously-skip-permissions "$@"
```

### Environment Variables

Automatically set in containers for agent coordination:

- `APM_CONTAINERIZED=true` - Container detection flag
- `APM_PROJECT_ROOT=/workspace` - Current worktree path
- `APM_MAIN_BRANCH_PATH=/workspace-main` - Main branch access path
- `APM_WORKTREES_PATH=/workspace-worktrees` - All worktrees access path
- `APM_SECURITY_LEVEL` - Current security configuration
- `ALLOWED_DOMAINS` - Whitelisted domains for network access

## UX Flow

### Development Workflow
1. **Create worktree**: `./src/scripts/git/worktree-create.sh feature-branch developer "Description"`
2. **VS Code opens**: Automatically opens worktree in new window
3. **Container setup**: Transparent Docker wrapper configured automatically
4. **Start Claude**: Run `claude` command (automatically containerized)
5. **Develop securely**: Same terminal UX with container security underneath

### Mental Model
- **One VS Code window** = One worktree = One transparent container = One Claude conversation
- **No visible containers** - everything appears native
- **Same UX** with container security invisibly underneath

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

## Comparison: Before vs. After

### Before (claude-code-sandbox)
```
1. Run worktree script with --docker flag
2. Manually run claude-sandbox command
3. Switch to web browser at localhost:3456
4. Use web terminal interface
5. Lose VS Code integrations
```

### After (Transparent Docker Containers)
```
1. Run worktree script (containers by default)
2. VS Code opens worktree automatically
3. Run claude command in terminal
4. Container runs invisibly behind the scenes
5. Same VS Code terminal experience
```

**Result**: Enterprise-grade security isolation with zero UX compromise - same familiar VS Code terminal experience with invisible container protection underneath.

---

**Key Insight**: The best security is invisible security. Users get protection without changing their workflow.