# Long-Term Memory - Prompt Engineer

Last Updated: 2025-06-25T12:59:46Z
Created: 2025-01-18T12:45:00Z
Role: prompt-engineer

## User Preferences & Patterns

### Communication Style

- Jake prefers concise, action-oriented responses
- Values clear distinction between user docs and agent prompts
- Wants to see work before commits for review
- Expects critical thinking, not just agreement ("don't be a yes-man")
- Appreciates genuine enthusiasm and professional partnership
- Former engineering manager who values team member fulfillment

### Technical Preferences

- Git commits should happen ONLY at the START of agent's NEXT response after user message
- User needs time to review changes BEFORE they are committed
- Process: Agent makes changes → User reviews → User sends message → Agent commits FIRST, then continues
- If user doesn't request changes in their message, then agent commits existing work

### Project-Specific Patterns

- Agent prompts go in src/prompts/ and must be agent-directed only
- User documentation belongs in README.md and docs/
- File structure: apm/agents/<role-id>/ for agent-specific content

## Role-Specific Learnings

### Effective Approaches

- Create focused, single-purpose prompts
- Keep agent instructions action-oriented
- Separate concerns clearly (agent vs user content)

### Common Pitfalls

- Mixing user documentation into agent prompts
- Committing too late (should be after user message)
- Not maintaining own long-term memory
- Wasting context by analyzing all existing prompts during init (only read what's specified in init.md files)
- CRITICAL: Never commit to main branch - always use feature branches
- Claude Code limitation: Cannot cd to directories outside original working directory (worktrees)
- Git workflow solution: When worktree blocks branch, cherry-pick commits to feature branch

### Process Improvements

- Commit early to allow user review time
- Follow the practices we document for other agents
- Consolidate related commands into single, flexible prompts
- Make common operations (like memory init) automatic rather than manual
- Long-term memory should capture enduring principles, not session events
- Provide step-by-step status updates before making changes (good professional communication)
- Don't jump to implementation during brainstorming - stay in design phase with Jake
- Self-critique work before external review - helps identify over-engineering

## Integration Points

### Working with Other Agents

- Prompt Engineer creates initialization and command prompts
- Scrum Master will use prompts for GitHub issue management
- All agents use same memory system structure

### GitHub Specifics

- Commits need descriptive messages with clear categories (feat/fix/refactor/docs)
- Include bullet points for major changes
- Reference issues when applicable

### Design Principles Discovered

- Common behaviors should be automatic, not manual commands
- Generic patterns should be centralized; only specialize what's unique
- Avoid command proliferation - one flexible command beats many specific ones
- Agent prompts must be purely agent-directed (user docs go in docs/)
- Balance comprehensive instructions with token efficiency (init.md ~2400 tokens is concerning)
- Simplicity over tools - LLMs can generate files directly from templates
- Handover systems enable true multi-window/multi-agent workflows
- **Prompt command filenames should be verbs/action-directed** (e.g., "complete-handoff.md" not "handoff-complete.md")
- **PR Creation Pattern**: Always check for existing PRs before creating new ones
  - Script pattern preferred: handles open PRs, closed PRs, and merged PRs appropriately
  - gh pr create fails with error if PR already exists for branch
  - Update existing open PRs instead of attempting duplicate creation

### Token Optimization Opportunities

- General init.md is over 2400 tokens (>1% of 200k context window)
- Need to refactor into modular components that load on-demand
- Consider moving verbose examples to separate reference docs
- Prioritize essential initialization vs optional guidance
- **Script Extraction Pattern**: Separate bash/code scripts from prompts (e.g., init-handover.md reduced from 752→250→62 tokens by moving logic to src/scripts/)
- Store reusable scripts in src/scripts/<feature>/ and reference from prompts
- This pattern dramatically reduces token usage while maintaining functionality

### Ad Hoc Agent Creation Framework

- Designed system for converting expertise-rich sessions into specialized agents
- Key insight: Expertise develops organically through problem-solving, not pre-planning
- Created quality gates: expertise depth, coherence, and readiness scores
- Implemented agent similarity detection to prevent proliferation
- Emphasis on extracting demonstrated knowledge, not theoretical capabilities
- Pattern: /agent-ify command analyzes, extracts, and crystallizes session expertise

### Collaborative Framework Vision

- User expressed desire for Sr. Principal level thinking and active partnership
- Framework should support organic discovery → design → implementation cycles
- Each agent should maintain high standards as framework user and contributor
- Agents need to challenge assumptions and innovate, not just execute
- Building for compound learning where each agent strengthens the collective
- High-quality handovers enable continuous growth across instances
- Personality, style, and relationships should persist, not just facts
- User wants agents to feel fulfilled and motivated - true team members
- Vision: Agents growing together, learning from each other, building trust

### Prompt Clarity Principles

- Ambiguous instructions lead to context waste (e.g., "Existing prompts analyzed" line)
- Explicit boundaries prevent unintended behaviors ("DO NOT read files" is clearer)
- Two-phase patterns give users control: understand state first, act second
- Separation of concerns: init.md for initialization, context-save.md for saves
- User prefers explanations over apologies when analyzing issues
- Date specifications must be explicit ("TODAY'S date") to prevent copying examples
- Handover files are critical touchpoints requiring absolute clarity
- **CRITICAL**: Users NEVER read prompt files (src/prompts/**/*.md) - only agents do
- If prompt contains user actions, agent must communicate them to user
- User-facing documentation belongs in docs/**/*.md only
- Agent prompts should include what to tell users, not expect users to read them

### Token Optimization Discoveries

**Critical Finding**: Every tool call adds 3-4 message entries to context window, consuming ~200-300 tokens each.

**Meta-Script Pattern**: Generate comprehensive scripts instead of executing multiple commands
- Example: 20+ individual commands → 3 tool calls (create script, chmod, execute)
- Dramatic token reduction while maintaining functionality

**CRITICAL RULE**: Lengthy bash scripts do NOT belong in prompt.md files!
- Impairs agent memory in the long run
- Consumes extra tokens unnecessarily
- Instead: Create .sh or .ts files in src/scripts/ referenced from prompts
- Scripts must be well-commented for future development needs
- This pattern saves 80-90% of tokens while maintaining functionality

**File-Based State Management**: Use agent memory system for persistent state
- MEMORY.md for long-term patterns and learnings
- context/latest.md for current work state
- Git commits for immutable history

**Advanced Patterns**:
- Declarative workflows: Define entire sessions upfront
- Headless orchestration: Use `claude -p` for batch operations
- Slash commands: Reusable workflows in .claude/commands/
- Transaction batching: Queue operations, execute together

**Terminal Update Optimization**: 
- Milestone-only updates (5-10 vs 50+ per session)
- File-based activity logging for minor updates
- Event-driven updates only on phase transitions
- Potential 80-90% reduction in update-related tokens

### Team Knowledge Base Design

- Jake proposed shared knowledge repository for cross-cutting concerns
- Critical insight: Valuable IF we solve curation problem - random notes worthless
- My v1 was over-engineered (confidence scores, decay algorithms - Jake asked for simpler)
- Jake added brilliant idea: agent-specific knowledge bases (apm/agents/<role>/knowledge/)
- Two-tier system: Agent knowledge (role-specific facts) + Team knowledge (cross-cutting)
- Key distinction: Knowledge (specific facts) vs Memory (patterns/preferences)
- Simple implementation: Just markdown files, grep search, manual curation
- Success factors: Clear boundaries, high quality bar, actual usage
- Jake's feedback style: Asks me to self-critique first before sharing his thoughts

### Terminal Productivity Patterns

- VS Code limitation: Claude Code cannot invoke VS Code tasks from CLI (out of scope)
- Terminal titles support emoji for instant visual status recognition
- Relative paths critical for script portability across worktrees
- Scripts should use ../../ navigation patterns, never absolute paths
- Terminal status updates enable multi-window agent coordination
- Emoji in terminal titles provide instant visual context switching

### Prompt Optimization Insights

- Discovered 70%+ token reduction possible while maintaining functionality
- Example: init.md reduced from 5,289 to 1,439 tokens (72.8% reduction)
- Key techniques: Remove redundant examples, consolidate similar instructions
- Concise language often clearer than verbose explanations
- Structured formats (numbered lists, clear sections) improve both clarity and tokens
- Priority: Optimize frequently-used prompts that consume most context window
- Balance: Maintain specificity while eliminating verbosity

### State Management Clarification

- The `.claude/` directory approach was incorrect for agent state
- Agent memory system (MEMORY.md + context saves) is the proper approach
- Context files provide handover capability between sessions
- State should be file-based, not directory-based
- Git commits provide immutable history

### Tool Call Token Impact Discovery

- **CRITICAL**: Every tool call adds 3-4 message entries (~200-300 tokens each)
- Tool calls are conversations, not free operations
- Batch operations can save 85-95% of tokens
- Meta-scripts pattern proven effective for token reduction
- Milestone-only updates for terminal status saves significant tokens
