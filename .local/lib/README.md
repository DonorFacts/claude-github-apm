# APM Library Modules

This directory contains reusable bash modules for the APM framework.

## Architecture

### Core Philosophy
- **Single Responsibility**: Each module handles one specific concern
- **Reusability**: Modules can be sourced by multiple scripts
- **Testability**: Each module is independently testable
- **Maintainability**: Clean separation makes debugging easier

### Module Structure

```
.local/
├── bin/
│   └── claude              # Main orchestrator (32 lines vs 211 lines)
└── lib/
    ├── env-loader.sh       # Environment setup (existing)
    ├── path-resolver.sh    # Project root detection
    ├── git-config.sh       # Bot account configuration
    ├── watch-processes.sh  # Background process management
    └── container-manager.sh # Docker container lifecycle
```

## Modules

### `path-resolver.sh`
**Purpose**: Detect project root and calculate container working directory

**Functions**:
- `resolve_paths()` - Sets `PROJECT_ROOT` and `WORK_DIR` variables

**Logic**: 
1. Look for main/worktrees structure first
2. Fall back to single-repo structure
3. Calculate relative paths for container mounting

### `git-config.sh`
**Purpose**: Automatic bot account setup for directory-based git switching

**Functions**:
- `setup_host_git_config()` - Creates conditional git configuration

**Features**:
- Personal account for main directories
- Bot account for worktrees directories
- Automatic authentication with `GITHUB_BOT_TOKEN`
- Backup existing configuration

### `watch-processes.sh`
**Purpose**: Manage background APM watch processes

**Functions**:
- `start_watch_processes()` - Start/check pnpm watch processes

**Features**:
- PID tracking to prevent duplicates
- Cleanup of stale processes
- Log file management

### `container-manager.sh`
**Purpose**: Docker container lifecycle management

**Functions**:
- `start_container()` - Create/start APM workspace container
- `exec_in_container()` - Execute commands in running container

**Features**:
- Health checks and wait logic
- Volume mounting for git configs
- Environment variable passing
- Interactive/non-interactive mode detection

## Benefits of Modular Design

### Before (Monolithic)
- 211 lines in single file
- Mixed concerns (git, docker, paths, processes)
- Hard to test individual components
- Difficult to reuse logic elsewhere

### After (Modular)
- 32 lines main orchestrator
- Single responsibility modules
- Each module independently testable
- Logic reusable across different scripts

## Usage

### Sourcing Modules
```bash
# Load shared modules
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/../lib"

source "$LIB_DIR/git-config.sh"
source "$LIB_DIR/container-manager.sh"

# Use module functions
setup_host_git_config
start_container
```

### Testing Individual Modules
```bash
# Test git configuration
source .local/lib/git-config.sh
setup_host_git_config

# Test path resolution
source .local/lib/path-resolver.sh
resolve_paths
echo "Project root: $PROJECT_ROOT"
echo "Work dir: $WORK_DIR"
```

## Future Extensions

This modular architecture makes it easy to:

1. **Add new container types** - New modules in `container-manager.sh`
2. **Support different git workflows** - Extend `git-config.sh`
3. **Add monitoring/logging** - New dedicated modules
4. **Create CLI tools** - Reuse modules in new bin scripts
5. **Unit testing** - Test each module in isolation

## Migration Notes

The refactor is **100% backward compatible**:
- Same `pnpm claude` command
- Same functionality and behavior  
- Same environment variables
- Just cleaner, more maintainable code