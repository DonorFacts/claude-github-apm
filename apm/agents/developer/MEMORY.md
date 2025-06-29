# Long-Term Memory - Master Developer

Last Updated: 2025-06-29T00:52:00Z

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
- Uses pnpm exclusively, not npm or yarn
- Wants exact same notification sounds (Hero.aiff) preserved in containers
- Appreciates speech notifications for detailed feedback

### Project-Specific Patterns
- Git worktrees for feature branches
- Comprehensive documentation in docs/ folder
- Commands in .claude/commands/ (and now "-/" for autocomplete)
- Handover files in apm/worktree-handovers/
- Context saves in apm/agents/{role}/context/

## Role-Specific Learnings

### Effective Approaches
- Always follow TDD: Write test → Verify fail → Implement → Pass
- Design multiple approaches before implementing
- Run quality checks (lint, typecheck) before completing tasks
- Update todo list frequently for visibility
- Use Notify_Jake at end of completed responses
- Use say-from-container.sh for important updates and explanations
- Create host-side daemons for container limitations

### Common Pitfalls
- Don't over-engineer when simple solutions work
- Avoid creating files unless absolutely necessary
- Never commit without explicit user permission
- Don't create documentation unless requested
- Never modify .git file directly in worktrees (breaks VS Code)
- Don't assume container paths match host paths

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

### Docker Container Integration
- File-based IPC (queues) simpler and more secure than network approaches
- Volume mounting at host paths essential for git worktree compatibility  
- Host daemons can bridge container limitations (audio, native APIs)
- Simple polling loops often sufficient (fswatch not always available)
- Container-git wrapper pattern useful for path translation issues
- Authentication via ~/.claude.json mount (not .credentials.json)

### Audio/Speech Notifications
- Jake's Notify_Jake uses Hero.aiff sound - important to preserve exact UX
- Text-to-speech via say command adds rich feedback capability
- Separate use cases: Notify_Jake for completion, speech for details
- Queue files enable async processing without blocking

## Command Sync System Insights

The command sync system evolved from complex import-based classification to simple underscore-based exclusion. This change came from recognizing that:

1. Users want predictable behavior
2. Simple rules are easier to understand and maintain
3. Most prompt files should be commands
4. Private files can use underscore prefix convention

The "-" folder discovery shows how small UX improvements (autocomplete anywhere in prompt) can significantly enhance the developer experience.

## Docker Git Worktree Insights

Git worktrees require consistent paths between host and container. The standard solution is mounting at host paths rather than container-specific paths like /workspace. This ensures commits are visible on both sides without path translation.