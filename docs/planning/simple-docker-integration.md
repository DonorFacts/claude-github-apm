# Simple Docker Integration Plan
## APM Framework + Claude Code Sandbox

**Timeline**: 4-8 hours  
**Complexity**: Low - Minimal Changes  
**Approach**: Enhance existing worktree creation with optional Docker security

---

## Core Concept

Add Docker as an **optional security layer** to existing worktree creation. No architectural changes - just a `--docker` flag that wraps Claude Code execution in a sandbox.

```bash
# Current workflow
/agent-prompt-engineer-init

# Enhanced workflow  
/agent-prompt-engineer-init --docker
```

## Implementation

### 1. Install Sandbox Dependency (30 minutes)

```bash
npm install -g @textcortex/claude-code-sandbox
```

Add to project setup documentation.

### 2. Create APM Docker Config Template (1 hour)

**File**: `src/config/apm-docker.config.json`
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
    "APM_AGENT_ROLE": "${AGENT_ROLE}",
    "APM_WORKTREE": "${WORKTREE_PATH}"
  }
}
```

### 3. Enhance Worktree Creation Script (2-3 hours)

**Modify**: `src/scripts/git/worktree-create.sh`

Add Docker option:
```bash
# Add --docker flag handling
if [[ "$*" == *"--docker"* ]]; then
    setup_docker_environment
fi

setup_docker_environment() {
    # Copy APM config template
    cp src/config/apm-docker.config.json claude-sandbox.config.json
    
    # Replace variables
    sed -i "s/\${AGENT_ROLE}/$AGENT_ROLE/g" claude-sandbox.config.json
    sed -i "s|\${WORKTREE_PATH}|$PWD|g" claude-sandbox.config.json
    
    echo "Docker sandbox configured. Use 'claude-sandbox' to start."
}
```

### 4. Create Container Setup Script (1 hour)

**File**: `apm/setup/container-init.sh`
```bash
#!/bin/bash
# APM container initialization

# Restore agent memory context if available
if [ -f "/apm/agents/$APM_AGENT_ROLE/context/latest.md" ]; then
    echo "Restoring agent context for $APM_AGENT_ROLE"
    # Agent will read this during initialization
fi

# Set container-aware environment
export APM_CONTAINERIZED=true
export APM_MEMORY_PATH="/apm/agents/$APM_AGENT_ROLE"

echo "APM container environment ready for $APM_AGENT_ROLE"
```

### 5. Update Agent Initialization (1-2 hours)

**Modify**: `src/prompts/agents/init.md`

Add Docker detection:
```markdown
### Docker Environment Detection

If running in a containerized environment:
- Agent memory is mounted at `/apm/agents/<role-id>/`
- Project files are in `/workspace`
- Use containerized execution with `--dangerously-skip-permissions`
- Terminal title should indicate container mode: `[Role] 🐳`
```

### 6. Documentation and Testing (1 hour)

**Create**: `docs/docker-usage.md`
```markdown
# Docker Security Usage

## Quick Start
```bash
# Create worktree with Docker security
./src/scripts/git/worktree-create.sh feature/new-feature --docker

# Start containerized Claude
claude-sandbox
```

## Benefits
- Isolated execution environment
- Safe dangerous permissions
- Host system protection

## Limitations  
- Slower startup time
- Requires Docker installed
- Container learning curve
```

---

## User Workflow

### Current Workflow (Unchanged)
```bash
/agent-prompt-engineer-init
# Works exactly as before
```

### Enhanced Workflow (New Option)
```bash
/agent-prompt-engineer-init --docker
# Creates worktree + Docker config
# User runs: claude-sandbox
# Claude executes in secure container
```

## Technical Details

### File Changes
- `src/scripts/git/worktree-create.sh` - Add Docker option
- `src/config/apm-docker.config.json` - Sandbox configuration template  
- `apm/setup/container-init.sh` - Container initialization
- `src/prompts/agents/init.md` - Docker detection logic
- `docs/docker-usage.md` - User documentation

### Integration Points
- **Configuration**: Template-based config generation
- **Memory**: Mount `apm/` directory as volume
- **Environment**: Pass agent role and paths as env vars
- **Initialization**: Container-aware agent setup

### Backwards Compatibility
- No changes to existing workflows
- Docker is completely optional
- Non-Docker agents work unchanged
- Same agent coordination and memory systems

## Benefits Achieved

✅ **Security**: Dangerous permissions isolated in container  
✅ **Simplicity**: Single `--docker` flag enables security  
✅ **Compatibility**: Zero impact on existing workflows  
✅ **Flexibility**: Works with all existing agent types  
✅ **Performance**: Minimal overhead for non-Docker usage  

## Implementation Checklist

- [ ] Install claude-code-sandbox globally (30 min)
- [ ] Create APM Docker config template (1 hour)  
- [ ] Enhance worktree creation script (2-3 hours)
- [ ] Create container initialization script (1 hour)
- [ ] Update agent initialization prompts (1-2 hours)
- [ ] Write documentation and test (1 hour)

**Total**: 4-8 hours for complete implementation

---

**Result**: APM Framework gains Docker security with minimal complexity - just add `--docker` to any worktree creation for containerized execution.