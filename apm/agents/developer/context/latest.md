# Agent Context Snapshot

Generated: 2025-07-02T21:50:00Z
Agent Role: developer
Agent Instance: General Framework Developer

## Current State

### Role & Responsibilities

- **Primary Role**: General Framework Developer
- **Current Focus**: Implementing clipboard bridge for host-container image sharing
- **Key Responsibilities**: Research, design, and implement solutions for Claude Code container environments

### Active Work

#### Current Task

- **Task ID**: Clipboard Bridge Image Integration
- **Status**: Research and design phase completed, implementation partially done
- **Started**: 2025-07-02T21:00:00Z
- **Work Completed**: 
  - Designed and implemented HTTP clipboard service with macOS AppleScript support
  - Fixed environment auto-detection for container vs host workflows
  - Researched Claude Code's internal APIs and limitations
  - Identified 3 potential solutions for programmatic image input
- **Work Remaining**: 
  - Investigate snap-happy app for cross-platform screenshot solution
  - Prototype terminal injection approach using xdotool
  - Test and refine the complete workflow
- **Related Issues**: Container-host clipboard integration for multimodal AI workflows

#### Work in Progress

```typescript
// Enhanced clipboard service with proper macOS image handling
// Located in: src/tools/clipboard-bridge/service.ts
// Key improvement: AppleScript with temporary file approach (lines 360-417)

// Environment-aware client 
// Located in: src/tools/clipboard-bridge/client.ts
// Auto-detects container vs host environment (lines 50-78)

// Integration test framework
// Located in: src/tools/clipboard-bridge/integration.test.ts
// Comprehensive TDD test suite for full workflow
```

### Recent Context

#### Recent Git Commits

No commits made yet - work is in progress and uncommitted.

#### Decisions Made

1. **Decision**: Use HTTP service approach over file-based clipboard bridge
   - **Rationale**: Better real-time synchronization, WebSocket support, image handling capabilities
   - **Impact**: More robust architecture but requires network configuration
   - **Time**: 2025-07-02T21:15:00Z
   - **Approved By**: Jake (user)

2. **Decision**: Bind service to 0.0.0.0 instead of 127.0.0.1
   - **Rationale**: Allows Docker containers to access via host.docker.internal
   - **Impact**: Enables proper container → host communication
   - **Time**: 2025-07-02T21:30:00Z
   - **Approved By**: Jake (user)

3. **Decision**: Focus on terminal injection approach for Claude Code image input
   - **Rationale**: Maintains Claude Code's agent context while adding image capability
   - **Impact**: Most promising path forward among 3 identified options
   - **Time**: 2025-07-02T21:45:00Z
   - **Approved By**: Jake (user)

#### Problems Encountered

- **Issue**: Original AppleScript method for macOS clipboard image reading was fundamentally flawed
  - **Status**: Resolved
  - **Approach**: Rewrote to use temporary file approach instead of direct binary-to-string conversion
  - **GitHub Issue**: N/A

- **Issue**: Claude Code has no documented programmatic APIs for image input
  - **Status**: Identified workarounds
  - **Approach**: Research revealed 3 potential solutions: terminal injection, direct API, MCP server
  - **GitHub Issue**: Multiple related issues found in anthropics/claude-code repo

#### User Communications

Recent important exchanges:

- 2025-07-02T21:00:00Z: Jake requested investigation of clipboard bridge for container environments
- 2025-07-02T21:15:00Z: Clarified workflow should be container → host, not host-only
- 2025-07-02T21:30:00Z: Jake pointed out fundamental issue with programmatic image input to Claude Code
- 2025-07-02T21:45:00Z: Jake requested research into Claude Code's actual implementation approach
- 2025-07-02T21:50:00Z: Jake suggested investigating snap-happy app for next session

### Understanding & Insights

#### Project Patterns

- **TDD Methodology**: Jake insists on comprehensive TDD approach - write tests first, implement second
- **Environment Awareness**: Solutions must work across host and container environments seamlessly
- **Research-Driven Development**: Thorough investigation of existing solutions before implementing custom ones

#### Technical Context

- **Architecture**: Container-based development environment with host clipboard access needs
- **Constraints**: Claude Code CLI has limited programmatic APIs, especially for image input
- **Dependencies**: macOS AppleScript for clipboard, Docker for containerization, Claude Code for AI interaction
- **Core Problem**: Need to bridge gap between container environment and host clipboard, then inject into Claude Code programmatically

### Pending Items

#### Immediate Next Steps

1. Research snap-happy app (https://github.com/badlogic/lemmy/blob/main/apps/snap-happy/README.md) for cross-platform screenshot solutions
2. Prototype xdotool terminal injection approach for Claude Code image input
3. Test complete workflow: screenshot → clipboard → service → container → Claude Code
4. Implement compression/optimization for large images to manage context window limits

#### Waiting For

- Jake's feedback on preferred approach among the 3 identified solutions
- Decision on whether to pursue file-based alternative approach

#### Questions/Concerns

- How to handle context window limitations with large base64-encoded images
- Whether terminal injection will work reliably across different terminal environments
- Platform compatibility issues (xdotool only works on X11, not Wayland)

### Git-Based Memory Status

- **Last Commit**: 9304120 feat: add workspace read permission to settings
- **Uncommitted Changes**: 
  - src/tools/clipboard-bridge/service.ts (major AppleScript improvements)
  - src/tools/clipboard-bridge/client.ts (environment auto-detection)
  - src/tools/clipboard-bridge/integration.test.ts (new comprehensive test suite)
  - src/scripts/paste-clipboard-enhanced.ts (debug logging)
  - src/scripts/watch-all.sh (HTTP service integration)
  - package.json (new test:clipboard command)
- **Next Commit Plans**: Commit clipboard bridge implementation and research findings

### Environment State

- **Current Directory**: /Users/jakedetels/www/claude-github-apm/main
- **Active Branch**: main
- **Modified Files**: Multiple clipboard-bridge related files with significant enhancements

### Research Findings

#### Claude Code Image Input Analysis

**Current State**: Claude Code has no programmatic image input APIs
- ✅ Interactive Ctrl+V works (with platform issues)
- ❌ No CLI flags for image attachment
- ❌ No SDK methods for programmatic image input
- ❌ No MCP server examples for image handling

**Claude Code's Approach**: 
- Uses temporary files on macOS (race condition issues)
- No compression - "dumps everything into context window"
- 90% failure rate due to temp file accessibility problems
- Generally broken and primitive implementation

#### Identified Solutions

**Option 1: Terminal Injection (Most Promising)**
- Use xdotool to simulate Ctrl+V keystrokes
- Pros: Maintains Claude Code context and agent capabilities
- Cons: X11 only, some apps reject synthetic events, requires window focus

**Option 2: Direct Anthropic API**
- Bypass Claude Code entirely, call API directly with base64 images
- Pros: Full control, guaranteed to work, proper compression possible
- Cons: Lose Claude Code's agent capabilities and codebase awareness

**Option 3: Custom MCP Server**
- Create MCP server that receives images and calls Anthropic API
- Pros: Integrates with Claude Code ecosystem
- Cons: Complex, unclear if image input is supported in MCP protocol

### Handover Notes

**Critical Information**: 
- Clipboard bridge service is implemented and working for text
- Image capture from macOS clipboard is fixed with new AppleScript approach
- Container → host connectivity is working via host.docker.internal:41073
- Main blocker is programmatic image injection into Claude Code instance

**Watch Out For**: 
- AppleScript permissions on macOS (may require user approval)
- xdotool compatibility issues on different systems
- Context window limits with large base64 images

**Recommended Approach**: 
1. First investigate snap-happy app for inspiration/solutions
2. Prototype xdotool terminal injection with simple test case
3. Consider implementing smart image compression before injection

**Key Files to Review**:

```
DO NOT READ THESE FILES DURING INITIALIZATION
These files will only be read if/when the user chooses to resume this work:
- src/tools/clipboard-bridge/service.ts (lines 360-417: new AppleScript implementation)
- src/tools/clipboard-bridge/client.ts (lines 50-78: environment detection)
- src/tools/clipboard-bridge/integration.test.ts (comprehensive test suite)
- src/scripts/paste-clipboard-enhanced.ts (debug logging additions)
- src/scripts/watch-all.sh (HTTP service integration)
- src/tools/clipboard-bridge/test-container-connectivity.ts (connectivity testing)
```

**Next Research Priority**: https://github.com/badlogic/lemmy/blob/main/apps/snap-happy/README.md

## Recovery Instructions

To restore this context:

1. During initialization, read ONLY:
   - Your init files (generic + role-specific)
   - Your MEMORY.md
   - This context file
2. Present work options to user and wait for direction
3. If user chooses to resume:
   - Read the specific files listed above
   - Run `git status` to check for uncommitted changes
   - Review snap-happy app research as priority
4. Continue with terminal injection prototyping or alternative approaches as directed
