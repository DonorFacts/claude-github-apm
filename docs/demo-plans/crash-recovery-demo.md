# APM Crash Recovery Demo Plan

**Objective**: Demonstrate the APM CLI's ability to track, detect, and list crashed agent sessions.

## Demo Overview

This demo shows how the APM system can:
1. Track active agent sessions across multiple VS Code windows
2. Detect when sessions crash (no heartbeat)  
3. List and categorize active vs crashed sessions
4. Provide detailed status information for recovery

## Demo Environment Setup

### Current State (Already Complete ✅)
- APM CLI built and working (`./src/scripts/apm/apm`)
- Session registry system operational
- External storage structure created (`../apm/`)
- Test data with 2 sample sessions

### Session Inventory
We have simulated 2 agent sessions:

1. **ui-dev-002-20250701** (Active)
   - Role: Developer specializing in UI components
   - Working on: feature-dashboard worktree
   - Status: Active (recent heartbeat)

2. **auth-dev-001-20250701** (Crashed)
   - Role: Developer specializing in authentication
   - Working on: feature-auth-system worktree  
   - Status: Crashed (stale heartbeat >2 hours ago)

## Demo Steps

### Step 1: Basic Status Check 
**What**: Show the basic CLI functionality
**Who**: User (Jake) in terminal

```bash
# Navigate to project root
cd /workspace/worktrees/feature-multi-agent-memory-architecture

# Show APM help
./src/scripts/apm/apm --help

# Expected output: CLI usage information with all commands
```

### Step 2: View All Sessions
**What**: See the mixed active/crashed session state
**Who**: User (Jake)

```bash
# List all sessions (default shows active only)
./src/scripts/apm/apm list

# Expected output:
# ✓ ui-dev-002-20250701
#    Role: developer (ui-components)
#    Worktree: feature-dashboard
#    Last seen: just now
# 
# Active sessions: 1
```

### Step 3: View Crashed Sessions
**What**: See which agents need recovery
**Who**: User (Jake)

```bash
# List only crashed sessions
./src/scripts/apm/apm list --crashed

# Expected output:
# ✗ auth-dev-001-20250701
#    Role: developer (authentication)
#    Worktree: feature-auth-system
#    Last seen: 2h ago
#
# Crashed sessions: 1
```

### Step 4: Comprehensive View
**What**: See the complete picture
**Who**: User (Jake)

```bash
# List all sessions together
./src/scripts/apm/apm list --all

# Expected output: Both sessions with status indicators
```

### Step 5: Simulate New Session Registration (Demo Data)
**What**: Show how new sessions would be tracked
**Who**: Claude (via demo script)

I'll create a demo script that adds a new session to show the registration process:

```bash
# Add a new "crashed" session to simulate discovery
./docs/demo-plans/add-demo-session.sh

# Then list again to see the new session
./src/scripts/apm/apm list --all
```

### Step 6: Examine Session Registry
**What**: Look under the hood at the data structure
**Who**: User (Jake)

```bash
# View the raw session registry
cat ../apm/sessions/registry.json

# Show the external storage structure
ls -la ../apm/sessions/
ls -la ../apm/conversations/
```

## Expected Demo Outcomes

### ✅ Success Criteria
1. CLI shows help and responds to commands
2. Active sessions display with green ✓ and "just now" timing
3. Crashed sessions display with red ✗ and time since last heartbeat
4. Session data includes role, specialization, and worktree context
5. External storage structure is organized and accessible

### 📊 Demo Metrics
- **Session Detection**: 2/2 sessions properly classified
- **Status Accuracy**: Active vs crashed correctly identified
- **Context Preservation**: Role and worktree info maintained
- **CLI Usability**: Clear, actionable output

## What This Demonstrates

### 🎯 Problem Solved
"My MacBook restarted overnight and I lost all my agent conversations"

### ✅ Solution Working  
- **Session Tracking**: All agent instances recorded in registry
- **Crash Detection**: Stale heartbeats automatically detected
- **Status Visibility**: Clear view of what needs recovery
- **Context Preservation**: Session metadata preserved for restoration

## Next Demo: Recovery Process

After this demo, the next phase will show:
1. **Recovery Commands**: `apm recover <id>` and `apm recover all`
2. **VS Code Integration**: Restoring terminals in correct windows
3. **Context Restoration**: Loading conversation history

## Demo Script Files

I'll create supporting scripts for this demo:
- `add-demo-session.sh` - Adds sample sessions
- `simulate-crash.sh` - Marks session as crashed
- `cleanup-demo.sh` - Resets demo state