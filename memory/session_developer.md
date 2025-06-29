# Developer Session Memory
Last Updated: 2025-06-29

## Docker Architecture Knowledge

### Current State
- **Multi-container architecture** implemented (one container per worktree)
- Docker wrapper script at `src/docker/claude-container/claude-wrapper.sh`
- Automatic containerization via worktree creation script
- Security levels: maximum, restricted, standard (via APM_SECURITY_LEVEL)
- VS Code extension incompatible with containers (accepted limitation)

### Key Implementation Details
1. **Volume Mounting Strategy**: Preserves host paths for git compatibility
   - Mounts at same paths as host (e.g., `/Users/jake/project` → `/Users/jake/project`)
   - Enables git worktree commands to work correctly
   - Parent directory mounted for worktree access

2. **Security Features**:
   - Network isolation through container boundaries
   - Resource limits based on security level
   - Read-only filesystem options for maximum security
   - Container runs with --dangerously-skip-permissions safely isolated

3. **Multi-Agent Collaboration**:
   - APM memory system mounted at `/workspace/apm`
   - Main branch accessible for architectural reference
   - Claude config mounted from host

### Planned But Not Implemented
1. **Single-Container Architecture**: Detailed TypeScript plan exists but not built
   - Would use one shared container for all worktrees
   - `src/scripts/docker/apm-container.ts` designed but not created
   - Health monitoring and auto-restart features planned

2. **Speech Notifications**: Design for container→host notifications exists
   - Would use volume mount + fswatch daemon
   - Not yet implemented

### Docker Files Structure
```
src/docker/claude-container/
├── Dockerfile           # Container image definition
├── claude-wrapper.sh    # Transparent execution wrapper
└── [network isolation via Docker]
```

### Usage Pattern
```bash
# Create worktree with Docker
./src/scripts/git/worktree-create.sh feature-123 developer "Task"

# In new VS Code window
claude  # Runs in container automatically
```

## Test Coverage Achievements
- Docker wrapper script handles fallback gracefully
- Security levels tested and documented
- Multi-agent volume mounting verified

## Performance Insights
- Container image build: 1-2 minutes first time
- Container startup: 2-5 seconds
- Minimal overhead for file operations
- Resource limits prevent runaway processes