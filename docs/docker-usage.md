# Docker Security Usage for APM Framework

**Security Enhancement**: Run Claude Code agents in isolated Docker containers with dangerous permissions safely contained.

## Quick Start

### Prerequisites
- Docker Desktop or Podman installed
- claude-code-sandbox: `pnpm add -g @textcortex/claude-code-sandbox`

### Create Secure Worktree
```bash
# Standard worktree creation
./src/scripts/git/worktree-create.sh feature-123-auth developer "Implement authentication"

# Enhanced with Docker security
./src/scripts/git/worktree-create.sh feature-123-auth developer "Implement authentication" --docker
```

### Start Containerized Development
```bash
# In the worktree directory
claude-sandbox
```

This opens a web terminal at `http://localhost:3456` with Claude Code running in an isolated container.

## Benefits

### Security Isolation
- **Host Protection**: Claude cannot access your personal files, SSH keys, or system settings
- **Dangerous Permissions**: `--dangerously-skip-permissions` runs safely in container
- **Network Isolation**: Controlled external access (optional)
- **Resource Limits**: Prevent system resource exhaustion

### APM Integration
- **Agent Memory Persists**: Memory system works identically in containers
- **Seamless Handovers**: Context transfers between host and container environments  
- **GitHub Integration**: Full workflow automation preserved
- **Multi-Agent Coordination**: Container and host agents can collaborate

## How It Works

### Architecture
```
Host System (APM Framework)
├── Worktree management and GitHub integration
├── Agent coordination and memory persistence
└── Docker Container (Secure execution)
    ├── Claude Code with dangerous permissions
    ├── Isolated file system
    ├── Mounted APM memory (/apm)
    └── Mounted project files (/workspace)
```

### File Structure
```
worktree/
├── claude-sandbox.config.json    # Generated Docker config
├── apm/                          # Memory system (mounted)
│   ├── agents/                   # Agent memory persists
│   └── setup/
│       └── container-init.sh     # Container initialization
└── project files                 # Mounted read-write
```

## Configuration

### APM Docker Config Template
The framework automatically generates `claude-sandbox.config.json`:

```json
{
  "autoPush": false,
  "autoCreatePR": false,
  "setupCommands": [
    "npm install",
    "source ./apm/setup/container-init.sh"
  ],
  "volumes": {
    "apm_memory": "./apm:/apm"
  },
  "environment": {
    "APM_AGENT_ROLE": "developer",
    "APM_WORKTREE": "/path/to/worktree"
  }
}
```

### Environment Variables
Automatically set in containers:
- `APM_CONTAINERIZED=true`
- `APM_AGENT_ROLE` - Agent role (developer, qa, etc.)
- `APM_MEMORY_PATH` - Path to agent memory
- `APM_PROJECT_ROOT` - Project workspace path

## Agent Behavior

### Container Detection
Agents automatically detect containerized environments:
- Terminal titles show 🐳 container indicator
- Memory paths adapt to container mount points
- Initialization confirms container vs. host environment

### Memory System
Identical behavior in containers and host:
- `MEMORY.md` persists across container restarts
- Context saves work seamlessly
- Handover protocols function identically

## Workflows

### Development Workflow
1. **Create worktree with Docker**: `./src/scripts/git/worktree-create.sh feature-branch developer "Description" --docker`
2. **Start container**: `claude-sandbox` in worktree directory
3. **Initialize agent**: Agent detects container and adapts automatically
4. **Develop securely**: Full dangerous permissions within container isolation
5. **Commit and push**: Git operations work normally (mounted volumes)

### Agent Handover
Container-aware handovers work seamlessly:
- Memory transfers between host and container agents
- Context files preserved across environments
- GitHub integration functions from both environments

## Limitations

### Performance
- **Startup time**: Additional 10-30 seconds for container initialization
- **Resource overhead**: ~100-200MB RAM per container
- **File I/O**: Slight performance impact from volume mounting

### Features
- **VS Code integration**: Limited to web terminal interface
- **Host file access**: Only mounted directories accessible
- **Network access**: Configurable but isolated by default

## Troubleshooting

### Container Won't Start
```bash
# Check Docker is running
docker ps

# Verify claude-sandbox installation
claude-sandbox --version

# Check configuration
cat claude-sandbox.config.json
```

### Memory Not Persisting
```bash
# Verify volume mounting
docker inspect $(docker ps -q) | grep -A 5 "Mounts"

# Check APM memory path
ls -la apm/agents/
```

### Performance Issues
```bash
# Monitor container resources
docker stats

# Check container logs
claude-sandbox logs
```

## Advanced Usage

### Custom Security Profiles
Modify `src/config/apm-docker.config.json` for different security levels:

```json
{
  "security": {
    "networkAccess": "none",           // No external network
    "resourceLimits": {
      "cpus": "1",
      "memory": "2g"
    }
  }
}
```

### Multi-Container Coordination
Different agents can run in separate containers:
- Manager agent (host) - GitHub integration
- Developer agent (container) - Secure code execution  
- QA agent (container) - Testing isolation

## Migration

### From Non-Docker to Docker
No migration needed - add `--docker` flag to any new worktree:
```bash
# Existing workflow (unchanged)
./src/scripts/git/worktree-create.sh feature-branch

# Enhanced with security
./src/scripts/git/worktree-create.sh feature-branch --docker
```

### Disable Docker
Simply omit `--docker` flag - all existing workflows continue unchanged.

## Security Notes

### What Docker Protects
- Host file system isolation
- SSH key and credential protection
- System configuration isolation
- Resource consumption limits

### What Docker Doesn't Protect
- Network-based attacks (configurable)
- Container escape vulnerabilities (rare)
- Shared kernel exploits (theoretical)

### Best Practices
- Keep Docker updated for security patches
- Review generated configurations before use
- Monitor container resource usage
- Use specific security profiles for sensitive work

---

**Result**: APM Framework gains enterprise-grade security isolation while maintaining all existing functionality and workflows.