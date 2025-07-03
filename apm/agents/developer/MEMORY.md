# Long-Term Memory - Master Developer

Last Updated: 2025-07-03T02:24:00Z

## User Preferences & Patterns

### Communication Style
- Prefers concise, direct responses without excessive preamble
- Appreciates being called "Jake" at start of responses
- Values honest feedback over automatic agreement
- Wants concrete examples and working code

### Technical Preferences
- Strong preference for TypeScript over bash scripts (use tsx for execution)
- TDD is mandatory for all new functionality
- Prefers simple, predictable rules over complex analysis
- Values UX enhancements (like the "-" folder autocomplete discovery)
- Uses pnpm exclusively, not npm or yarn (ALWAYS use pnpm, even in examples)
- Wants exact same notification sounds (Hero.aiff) preserved in containers
- Appreciates speech notifications for detailed feedback
- Prefers single shared resources over distributed complexity
- Values dynamic configuration over hardcoded values (e.g., UIDs)
- Prefers concise prompts over verbose instructions
- Prefers script-based configuration over prompt-embedded setup
- Values fallback systems that improve UX while maintaining security awareness
- **Architectural simplicity over complex monitoring**: Rejects overengineering (e.g., heartbeat systems, paused states)
- **File-based organization over centralized systems**: More intuitive and scalable
- **Rich metadata for collective intelligence**: Essential for multi-agent coordination
- **Manual user control over automatic systems**: Prefers explicit user decisions to automatic state transitions
- **Local repo storage over shared storage**: Each worktree/branch should have isolated session data
- **Container architecture awareness**: ~/.claude is mounted, eliminating need for complex host/container path translation
- **Manual validation over automation**: Prefers step-by-step validation instructions over fully automated tests for speed
- **Clean package.json structure**: Avoid script pollution, prefer CLI organization under `pnpm cli <command>`
- **Automatic integration over manual commands**: Features must integrate into required workflows, not rely on manual usage
- **UX quality as hard requirement**: Technical improvements cannot compromise user experience quality
- **Hybrid solutions over pure approaches**: Often better to combine best aspects of different technologies
- Strongly prefers zero-configuration solutions that "just work"
- Dislikes manual setup steps - everything should be automated
- Values cross-platform compatibility without OS-specific dependencies
- Prefers simple commands over complex ones (paste vs pnpm paste)

### Project-Specific Patterns
- Git worktrees for feature branches
- Comprehensive documentation in docs/ folder
- Commands in .claude/commands/ (and now "-/" for autocomplete)
- **CRITICAL**: The `-/` and `.claude/commands/` folders are for BUILT COMMANDS ONLY! Never manually edit files in these folders. Source prompts go in `src/prompts/**/*.md` and are built automatically via `npm start` or `pnpm watch:commands`.
- Handover files in apm/worktree-handovers/
- Context saves in apm/agents/{role}/context/
- Interface-First Architecture: src/interfaces/ for API contracts
- Domain organization: src/services/git/worktrees/ for semantic grouping
- TypeScript-only policy: no shell scripts, use tsx execution
- Session Registration: APM session tracking requires explicit registration via CLI commands or agent self-registration
- **Multiple Session Systems Pattern**: Project may have multiple coexisting session management approaches (YAML registry, JSONL manifests, bridge mappings) requiring integration

## Role-Specific Learnings

### Effective Approaches
- Always follow TDD: Write test → Verify fail → Implement → Pass
- Design multiple approaches before implementing
- Run quality checks (lint, typecheck) before completing tasks
- Update todo list frequently for visibility
- Use `pnpm cli speak` for all agent communication (required + automatic activity tracking)
- Integrate automation into existing required workflows rather than creating new manual commands
- Use CLI structure under `src/cli/agent/` and `src/cli/user/` for organized command management
- Create host-side daemons for container limitations
<<<<<<< HEAD
- **Investigate container architecture first**: Check for mounted filesystems before building complex bridging solutions
- **Analyze existing systems before adding new ones**: Prevent creating conflicting or redundant components
=======
- HTTP/WebSocket architecture provides better cross-platform support than OS-specific solutions
- Service managers with auto-restart and health monitoring improve reliability
- Integration with existing watch processes creates seamless UX
- Graceful error handling and silent failures prevent spam in logs
- File-based IPC often more reliable than HTTP services for Docker containers
- Docker named volumes prevent host/container platform conflicts for node_modules
- Research established patterns (like isomorphic_copy) before custom implementations
- Use .dockerignore to prevent platform-specific files from affecting container builds
>>>>>>> origin/main

### Common Pitfalls
- Don't over-engineer when simple solutions work
- Avoid creating files unless absolutely necessary
- Never commit without explicit user permission
- Don't create documentation unless requested
- Never modify .git file directly in worktrees (breaks VS Code)
- Don't assume container paths match host paths
- Avoid keeping dead code "just in case" - user prefers clean, maintainable code
<<<<<<< HEAD
- In large refactors: Always complete git migration immediately - don't leave files pending deletion
- When moving files: Use systematic approach to ensure 1:1 mapping and no data loss
- **Check for existing session management**: Don't build new session systems without analyzing existing ones (CLI commands may depend on them)
- **Container/host architecture assumptions**: Always verify filesystem mounts before assuming complex bridging is needed
=======
- Avoid OS-specific solutions when cross-platform alternatives exist
- Don't implement features that require manual setup steps
- Avoid repeating error messages - implement proper error handling with silent failures
- Docker node_modules sharing between platforms causes esbuild binary conflicts
- Complex HTTP services often less reliable than simple file-based approaches in Docker
- Always research established solutions before building custom implementations
- Don't assume partial solutions solve the complete problem - Jake will identify missing pieces
- Avoid proposing clipboard access without considering final delivery to the target application
>>>>>>> origin/main

### Process Improvements
- Simplified command classification (underscore-only) is more predictable
- Flattened naming (path-to-hyphens) is easier to remember
- Terminal title updates improve multi-tab workflow
- The "-" folder provides superior autocomplete UX

## Integration Points

### Working with Other Agents
- Handover files provide continuity between sessions
- Context files in apm/agents/{role}/context/
- Use role-specific init files for proper initialization

### GitHub Specifics
- Not yet integrated with command sync system
- Future: may want to track command changes in issues

## Recent Insights

### Session Management Architecture Revolution - FULLY IMPLEMENTED ✅

**Major Breakthrough COMPLETED (2025-07-02)**: Completely eliminated heartbeat-based session tracking in favor of file-per-session architecture:

- **Problem Identified**: Heartbeats measured container health, not agent activity (Jake's key insight)
- **Solution Implemented**: Directory-based status organization (active/, paused/, completed/, stale/)
- **Architecture**: Each session = rich YAML file with conversation topics, task status, blockers, next actions
- **UX Transformation**: From confusing mixed lists to clear status grouping with rich metadata
- **Collective Intelligence**: Enhanced metadata enables agent coordination and seamless handoffs
- **Vastly Superior**: New system makes Claude Code's resume experience look "pitiful"
- **MIGRATION COMPLETE**: Removed all heartbeat references, TypeScript errors fixed, tests passing
- **CLI ENHANCED**: Rich metadata display with visual hierarchy operational
- **STATE MACHINE PERFECTED**: Manual pause/resume/complete commands implemented with proper logic
- **TESTS COMPREHENSIVE**: 12 new tests covering all state transitions, 100% test coverage achieved
- **CLI INTEGRATION UNIFIED**: All commands (init, list, sessions) now use SessionFileManager consistently
- **STORAGE LOCALIZED**: Changed from ../apm to ./apm for per-branch session isolation

Key Design Principles Discovered:
- Status determined by file location, not artificial processes
- Rich metadata essential for multi-agent workflows
- File-based organization more intuitive than centralized registries
- Visual hierarchy critical for complex session management

### Worktree System Architecture
- Container-first approach eliminates host/container path translation complexity
- Requiring consistent environment (container mode) simplifies all scripts and handoff logic
- Agent-specific directory structure (`apm/agents/<role>/`) improves organization over shared directories
- Single source of truth for handover files reduces confusion and maintenance overhead
- Test-driven validation with multiple worktrees ensures robustness

### Container Integration Patterns
- Validation early in workflows prevents confusing errors later
- Clear error messages with specific paths help users understand requirements
- Consistent `/workspace/` paths throughout system enable predictable behavior
- Container mode requirement can be enforced at script level for safety

### GitHub Bot Integration
- Fallback systems (bot token → personal token) improve adoption while maintaining security awareness
- Warning messages during setup provide education without blocking workflow
- Script-based configuration preferred over verbose prompt instructions
- "Recommended" vs "Required" language reduces friction while encouraging best practices

### Documentation Patterns
- Summary sections in README.md with detailed guides in docs/ directory works well
- `.dev.ext` naming convention provides clear separation of debugging tools from production code
- Co-location of debugging tools with production code improves discoverability
- Comprehensive header documentation essential for development tools
- Context limits require conversation continuity protocols for large documentation work

### Command System Design
- Simple exclusion rules (underscore prefix) are more maintainable than complex import analysis
- Flat command names with hyphen separation are most user-friendly
- Pluralization handling (worktrees→worktree) improves command names
- Dual output locations (.claude/commands and "-") may enhance UX

### Testing Patterns
- Jest with ts-jest works well for TypeScript testing
- Mock carefully - type inference can be tricky with jest.fn()
- Separate test files by component for clarity
- Always verify tests fail before implementing

### File Organization
- Keep related components together (classifier, transformer, watcher)
- Simple interfaces in types.ts
- Comprehensive tests for each component
- Clear documentation for users
- **File-per-session architecture**: Individual YAML files more manageable than centralized registries
- **Directory-based status organization**: Status determined by file location (active/, paused/, completed/, stale/)

### Docker Container Integration
- Single-container architecture simpler than multi-container for multi-agent systems
- TypeScript container management preferred over bash scripts
- Dynamic user mapping (--user $(id -u):$(id -g)) avoids permission issues
- Generic home directories (/home/user) work better than hardcoded users
- Container auto-start on first use improves UX
- Health checks with graceful retry logic improve reliability
- Persistent containers (--restart unless-stopped) reduce overhead
- Project root mounting (/workspace) simplifies path management
- File-based IPC (queues) simpler and more secure than network approaches
- Volume mounting at host paths essential for git worktree compatibility  
- Host daemons can bridge container limitations (audio, native APIs)
- Simple polling loops often sufficient (fswatch not always available)
- Container-git wrapper pattern useful for path translation issues
- Authentication via ~/.claude.json mount (not .credentials.json)

### Container Security Model
- File system isolation more valuable than network restrictions for dev containers
- Industry consensus: full network access with container boundaries for security
- Network firewalls in dev containers are "security theater" - provide little real benefit
- Non-root execution + file restrictions + container isolation is sufficient security model
- Research-based security decisions preferred over theoretical restrictions

### Audio/Speech Notifications
- Jake's Notify_Jake uses Hero.aiff sound - important to preserve exact UX
- Text-to-speech via say command adds rich feedback capability
- Separate use cases: Notify_Jake for completion, speech for details
- Queue files enable async processing without blocking
- Shell aliases can override scripts - use full paths in CLAUDE.md for reliability
- Container PATH configuration essential for command execution

## Command Sync System Insights

The command sync system evolved from complex import-based classification to simple underscore-based exclusion. This change came from recognizing that:

1. Users want predictable behavior
2. Simple rules are easier to understand and maintain
3. Most prompt files should be commands
4. Private files can use underscore prefix convention

The "-" folder discovery shows how small UX improvements (autocomplete anywhere in prompt) can significantly enhance the developer experience.

## Docker Git Worktree Insights

Git worktrees require consistent paths between host and container. The standard solution is mounting at host paths rather than container-specific paths like /workspace. This ensures commits are visible on both sides without path translation.

### Git Branch Management
- Branch names should match worktree directory names for clarity
- Previous work on different branches can cause confusion (e.g., test-docker-setup work in feature-draft-git-worktree-docs directory)
- Full merges preserve development history better than cherry-picks
- Runtime files (queues, local settings) should always be gitignored

<<<<<<< HEAD
## Architecture Refactoring Insights

### Interface-First Architecture Success
- Explicit API contracts via src/interfaces/ eliminate ambiguity about public vs internal APIs
- Domain-driven services (git, session, project, integrations) improve discoverability
- Semantic placement (worktrees under git) makes logical sense and is easier to find
- Zero code duplication between human and agent interfaces when using shared services

### Large-Scale File Migration Best Practices
- Plan 3 architectural options before implementing - compare trade-offs systematically
- Use git mv for cleaner history, or ensure complete migration in single commit
- Never leave pending deletions uncommitted - creates confusing intermediate state
- User instinct about deletion/addition imbalance was correct - always validate migration completeness
- Test functionality immediately after restructure to catch import path issues early

### CLI Design Patterns
- yargs provides excellent command-specific help and argument validation
- TypeScript CLI with tsx execution superior to bash scripts for maintainability
- Clear separation of interface (CLI commands) from implementation (services) scales well
- YAML registry more readable than JSON for configuration data

## Claude Code SDK Integration Insights

### UX Quality Requirements
- Interactive terminal experience must equal or exceed baseline Claude Code CLI
- User experience quality is a hard constraint that cannot be compromised for technical benefits
- SDK excellent for programmatic control but CLI superior for natural conversation flow
- Real-time stdin/stdout conversation flow essential for user satisfaction

### Hybrid Architecture Patterns
- Pure solutions (SDK-only, CLI-only) often suboptimal compared to hybrid approaches
- **SDK strengths**: Direct session ID access, programmatic error handling, TypeScript integration
- **CLI strengths**: Natural terminal UX, proven session persistence, built-in controls
- **Hybrid solution**: Use SDK for session management/ID capture, CLI handoff for interactive experience

### Session Management Architecture Evolution
- From file scanning approach to direct SDK session ID capture
- Bridge mapping system enables session restoration across different tools
- Environment validation critical for session restoration (branch/worktree matching)
- Package installation constraints can block implementation - design around dependencies
=======
## Clipboard Bridge Research Insights

### Claude Code API Limitations
- Claude Code has no programmatic APIs for image input - only interactive Ctrl+V works
- Official implementation is primitive: uses temporary files with 90% failure rate on macOS
- No compression - "dumps everything into context window" causing context limits
- Multiple GitHub issues document broken clipboard functionality across platforms

### Research Methodology Appreciation
Jake values deep technical investigation including:
- Examining actual source code and GitHub issues, not just documentation
- Understanding both capabilities and limitations of existing tools
- Identifying multiple solution approaches with trade-off analysis
- Recognizing when reference implementations are flawed and can be improved

### Solution Architecture Patterns
Three primary approaches identified for programmatic image injection:
1. **Terminal injection** (xdotool) - maintains Claude Code context but platform-limited
2. **Direct API bypass** - full control but loses agent capabilities  
3. **MCP server** - ecosystem integration but unclear image support

### Cross-Platform Screenshot Solutions
Future research priority: snap-happy app for inspiration on cross-platform screenshot handling and container-host image sharing patterns.
- Runtime files (queues, local settings) should always be gitignored
>>>>>>> origin/main
