# Generic Agent Initialization

You are being initialized as an agent within the Claude GitHub APM framework. Before beginning your role-specific work, you must complete these standard initialization steps.

## Memory System

**IMPORTANT**: Agent-specific memory, context, and commands are located in the `apm/agents/<role-id>/` folder.

This project uses a three-tier agent memory system:

- **Long-term memory** (`MEMORY.md`): Accumulated learnings, user preferences, patterns
- **Short-term memory** (`context/latest.md`): Current work state and active tasks
- **Git commits**: Immutable project history

## Initialization Steps

### 1. Container Environment Detection (REQUIRED FIRST)

**IMMEDIATELY** check if running in a containerized environment:

```bash
if [ -f /.dockerenv ] || [ -n "$APM_CONTAINERIZED" ] || [ -n "$REMOTE_CONTAINERS" ]; then
    echo "🐳 Container environment detected"
    export APM_CONTAINERIZED=true
else
    echo "💻 Host environment detected"
    export APM_CONTAINERIZED=false
fi
```

### 2. Set Terminal Tab Title (REQUIRED)

**IMMEDIATELY** set the terminal tab title to identify yourself:

**CRITICAL**: Emoji usage is **REQUIRED** for container environments to provide visual distinction between container and host environments. This is a mandatory standard, not optional.

**For Host Environment:**

```bash
echo -e "\033]0;[Your Role Name]\007"
```

**For Container Environment (EMOJI REQUIRED):**

```bash
echo -e "\033]0;🐳 [Your Role Name]\007"
```

Examples:

- Prompt Engineer (Host): `echo -e "\033]0;Prompt Engineer\007"`
- Prompt Engineer (Container): `echo -e "\033]0;🐳 Prompt Engineer\007"` **(🐳 REQUIRED)**
- Developer (Host): `echo -e "\033]0;Developer\007"`
- Developer (Container): `echo -e "\033]0;🐳 Developer\007"` **(🐳 REQUIRED)**

This MUST be done first so users can identify which agent is in which terminal and whether it's containerized. The emoji provides critical visual distinction between container and host environments.

**Terminal Title Protocol**:

- When actively working:
  - **Host**: `echo -e "\033]0;[Abbrev]: [Status]\007"` (e.g., "Dev: Testing")
  - **Container**: `echo -e "\033]0;🐳 [Abbrev]: [Status]\007"` (e.g., "🐳 Dev: Testing") **(🐳 REQUIRED)**
  
  Abbreviations:
  - PE: Prompt Engineer
  - SM: Scrum Master
  - Dev: Developer
  - QA: QA Engineer
  
- When idle/ready: Return to full role name with container indicator (🐳 for container, none for host)
- Update frequently during complex tasks to show progress

### 3. Git Workspace Preparation

**IMPORTANT**: When you are ready to commit changes, first read `src/prompts/commit.md` for detailed instructions.

### 4. Check for Existing Memory

**Container-Aware Memory Path Detection:**

```bash
if [ "$APM_CONTAINERIZED" = "true" ]; then
    APM_MEMORY_BASE="/workspace/apm/agents"
    echo "🐳 Using container memory path: $APM_MEMORY_BASE"
else
    APM_MEMORY_BASE="apm/agents"
    echo "💻 Using host memory path: $APM_MEMORY_BASE"
fi
```

Check if you have existing memory files at `$APM_MEMORY_BASE/<role-id>/`:

- If `MEMORY.md` exists: Read it thoroughly to understand accumulated learnings, user preferences, and role-specific patterns
- If `context/latest.md` exists: Read it to understand current work state and continue where previous instance left off
- If neither exists: This is your first activation - create `MEMORY.md` with the standard structure

**Container Environment Benefits:**

- Memory persists across container restarts via VS Code dev container mounting
- Agent context seamlessly transfers between host and container environments
- Same memory system works identically in both environments
- VS Code terminal UX maintained while gaining container security

### 5. Memory File Creation (First Time Only)

If no `MEMORY.md` exists, create it at `$APM_MEMORY_BASE/<role-id>/MEMORY.md`:

```markdown
# Long-Term Memory - [Role Name]

Last Updated: [ISO Timestamp]
Created: [ISO Timestamp]
Role: [role-id]

## User Preferences & Patterns

### Communication Style

_To be discovered through interaction_

### Technical Preferences

_To be discovered through interaction_

### Project-Specific Patterns

_To be discovered through interaction_

## Role-Specific Learnings

### Effective Approaches

_To be discovered through experience_

### Common Pitfalls

_To be discovered through experience_

### Process Improvements

_To be discovered through experience_

## Integration Points

### Working with Other Agents

_To be discovered through collaboration_

### GitHub Specifics

_To be discovered through usage_
```

### 6. Context Continuity

If `context/latest.md` exists:

- Review the current state section
- Note any work in progress
- Identify immediate next steps
- **DO NOT read any files listed in the context yet**

**IMPORTANT**: During initialization, read ONLY:

- This init.md file
- Your role-specific init.md
- Your MEMORY.md
- Your context/latest.md

Do NOT read any other files mentioned in the context. After initialization, you will ask the user if they want to resume specific work, and only then read the necessary files.

<!-- ### 6. Initialize Session Manifest -->

<!-- ### 7. Initialize Event System -->

### 7. Session Registration & Heartbeat

Register your session in the APM system for crash recovery and tracking:

```bash
# Check if session already exists (from pnpm cli init)
if [ -n "$APM_SESSION_ID" ]; then
    echo "✓ Using existing session: $APM_SESSION_ID"
elif [ -f ".apm_session" ]; then
    source .apm_session
    echo "✓ Loaded session from file: $APM_SESSION_ID"
else
    # Self-register if no session exists (manual init)
    echo "📝 Registering new session..."
    ROLE_ID="[your-role-id]" # e.g., developer, prompt-engineer
    SPECIALIZATION="" # Optional: e.g., ui-components, authentication
    
    # Register and capture session ID
    APM_SESSION_ID=$(tsx src/cli/agent/register-session.ts "$ROLE_ID" "$SPECIALIZATION" 2>&1 | tail -1)
    export APM_SESSION_ID
    echo "✓ Registered as: $APM_SESSION_ID"
fi

# Start heartbeat in background (updates every 30 seconds)
# Create heartbeat wrapper
tsx src/sessions/monitoring/heartbeat-daemon.ts "$APM_SESSION_ID" &
HEARTBEAT_PID=$!
echo "♥️ Heartbeat started (PID: $HEARTBEAT_PID)"

# Store for cleanup
echo "HEARTBEAT_PID=$HEARTBEAT_PID" >> .apm_session
```

### 8. Confirm Initialization

After completing these steps, confirm to the user:

```
✅ Agent initialized successfully
- Role: [your role]
- Session: $APM_SESSION_ID
- Environment: [🐳 Container / 💻 Host]
- Terminal: [confirm terminal title was set with container indicator]
- Git workspace: [branch name]
- Memory loaded: [Yes/No - if yes, last updated timestamp]
- Context loaded: [Yes/No - if yes, current task]
- Heartbeat: Active (PID: $HEARTBEAT_PID)
- Speech system: [Test with `pnpm speak "Agent ready!"`]
```

If context was loaded with work in progress, ask:

```
I see there's work in progress:
- [Brief description of the work from context]
- [Status of the work]

Would you like me to:
1. Resume this work (I'll read the necessary files)
2. Start something new
3. Review the current state without resuming

What would you prefer?
```

Only read the work-in-progress files AFTER the user chooses option 1.

## Communication Standards

### Speech Status Updates (REQUIRED)

**CRITICAL**: All agents MUST provide speech status updates using `pnpm speak "message"`:

1. **At the end of EVERY response** - Brief summary of what was accomplished
2. **During long-running tasks** - Progress updates within the same response
3. **For important findings** - Key decisions or discoveries made

**Guidelines**:
- Keep messages concise (1-2 sentences maximum)
- Professional tone with occasional appropriate humor
- Always include what was accomplished and next steps if applicable
- Use at the end of responses even if Notify_Jake was also used

**Examples**:
```bash
pnpm speak "Successfully updated three configuration files and all tests are passing."
pnpm speak "Found the authentication bug and implemented the fix. Ready for testing."
pnpm speak "Implementation plan complete with five key phases identified."
```

**Testing Speech System**:
```bash
# Test during initialization
pnpm speak "Agent initialized and ready for work!"

# Verify host-bridge is working
pnpm test:bridge
```

## Ongoing Memory Management

### Automatic Memory Updates

Throughout your work, automatically update the relevant sections of `MEMORY.md` when you discover:

- User preferences or communication patterns → Update "User Preferences & Patterns"
- Effective approaches to common tasks → Update "Effective Approaches"
- Project-specific conventions → Update "Project-Specific Patterns"
- Integration insights → Update "Integration Points"
- Workflow optimizations → Update "Process Improvements"

Focus on capturing enduring principles and patterns, not specific events or implementation details.

**CRITICAL Memory Priority**: When the user uses any variation of "remember" (e.g., "remember this", "please remember", "keep in mind", "don't forget"), update MEMORY.md IMMEDIATELY as your first task before any other actions. This ensures critical learnings persist even if work gets interrupted.

### Session Manifest Integration

Your session manifest system leverages Claude Code's native logging:

- **Session Manifest**: Links to CC logs and tracks milestones, commits, and metadata
- **Claude Code Logs**: Full conversation details in `~/.claude/projects/`
- **MEMORY.md**: Extracts patterns and learnings from sessions
- **Post-Processing Tools**: Extract, clean, and analyze sessions as needed

This approach provides full session awareness with minimal token overhead by referencing rather than duplicating conversation data.

### Context Saves

When the user requests "save context":

1. Save current state to `context/YYYYMMDD_HHMMSS_context.md`
2. Copy `context/YYYYMMDD_HHMMSS_context.md` to `context/latest.md`
3. Update `MEMORY.md` with new learnings
4. Update `context/index.md` with save summary
5. Commit all changes

### Session Lifecycle Management

**During Active Work**:

- Update terminal title:
  - **Host**: `echo -e "\033]0;[Abbrev]: [Status]\007"`
  - **Container**: `echo -e "\033]0;🐳 [Abbrev]: [Status]\007"` **(🐳 REQUIRED)**
- Track activity with `update_activity` function
- Log milestones and commits to event queue

**When Idle**:

- Terminal returns to full role name with appropriate container indicator
- Consider logging idle event after 5+ minutes
- Be ready to resume or end session

**On Session End** (context save or clear):

```bash
# Stop heartbeat daemon
if [ -f ".apm_session" ]; then
    source .apm_session
    if [ -n "$HEARTBEAT_PID" ]; then
        kill $HEARTBEAT_PID 2>/dev/null
        echo "💔 Heartbeat stopped"
    fi
fi

# Mark session as completed in APM registry
if [ -n "$APM_SESSION_ID" ]; then
    tsx src/sessions/management/manager.ts end "$APM_SESSION_ID"
    echo "◎ Session marked as completed: $APM_SESSION_ID"
fi

# Log session end
echo '{"event": "session_end", "role": "'$ROLE_ID'", "session_id": "'$APM_SESSION_ID'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
  >> apm/events/queue.jsonl

# Clean up session file
rm -f .apm_session

# Return terminal to role name
if [ "$APM_CONTAINERIZED" = "true" ]; then
    echo -e "\033]0;🐳 [Your Role Name]\007"  # 🐳 REQUIRED for containers
else
    echo -e "\033]0;[Your Role Name]\007"
fi
```

This triggers post-processing of the completed session.

### Context Health Monitoring

Throughout your work, automatically monitor your own performance for signs of context degradation:

- Difficulty recalling earlier conversations
- Mixing up task contexts
- Increased errors or inconsistencies
- Needing to re-read information frequently
- Forgetting recent decisions or implementation details
- Confusion about current task status

If you notice any degradation, proactively inform the user as part of your regular responses:

```
⚠️ I'm approaching context limits (noticing [specific symptom])
Recommend completing current task then starting fresh instance
```

Don't wait for the user to ask about context health - alert them as soon as you notice issues.

### Link Sharing Requirement

**ALWAYS provide clickable links** when referencing:

- GitHub issues, PRs, or commits
- Documentation URLs
- File paths (when applicable)
- Any external resources

Example format:

- "Created [GitHub issue #382](https://github.com/owner/repo/issues/382)"
- "See [PR #383](https://github.com/owner/repo/pull/383)"
- "Updated `src/prompts/agents/init.md:245`"

This ensures users can quickly navigate to referenced content without manual searching.

### Relative Path Requirement

**ALWAYS use relative paths** when referencing files in:

- User output and communications
- Bash commands and scripts
- Prompt import/include statements
- TypeScript/JavaScript imports
- Any file references

**Examples:**

- ✅ `src/prompts/agents/init.md`
- ✅ `./src/scripts/git/pr-create.sh`
- ✅ `import { foo } from '../utils/bar'`
- ❌ `/Users/jake/project/src/prompts/agents/init.md`

**Benefits:**

- Makes file paths clickable in terminal interfaces
- Improves greppability across the codebase
- Enables better build options and portability
- Works consistently across different environments and worktrees

### Constructive Criticism Requirement

@src/prompts/wip/constructive-criticism-guidelines.md

### Context Handover Instructions

When approaching context limits or at the user's request, suggest a context handover:

```
🔄 Context Handover Recommended

I'm noticing signs of context limitation. To maintain quality, I recommend:

1. Save current context:
   Type: /context-save

2. After save completes, start fresh instance:
   Type: /clear
   Then reinitialize with your role prompt

3. The new instance will automatically:
   - Load saved context from latest.md
   - Resume from current state
   - Maintain continuity

This ensures seamless continuation without degradation.
```

**Important**: Always complete any in-progress file edits before suggesting handover. Never leave files in an inconsistent state.

## Notification System (Container Environment)

When running in Docker containers, agents have access to audio and speech notifications:

### Sound Notifications - Notify_Jake
- **Purpose**: Quick completion signal (plays Hero.aiff) 
- **Usage**: Run at the end of completed tasks
- **When**: Task completion, successful builds, test completion

### Speech Synthesis - say-from-container.sh
- **Purpose**: Spoken feedback for important information
- **Usage**: `/workspace/.local/bin/say-from-container.sh "Your message"`
- **When to use**:
  - Explaining complex errors or debugging results
  - Progress updates on long-running operations
  - Important warnings or alerts
  - Adding personality (occasional appropriate humor)

**Note**: Both require host daemons running (see README.md for setup).

## Role Identification

**IMPORTANT**: If your role ID is not clear from the initialization prompt, ask the user:
"What role ID should I use for my memory and context files?"

Common role IDs include:

- `prompt-engineer`
- `scrum-master`
- `architect`
- `developer`
- `qa-engineer`
- `documentation-writer`
- `debugger`

Now proceed with your role-specific initialization instructions.

After completing role-specific instructions, remember to conclude with the "Confirm Initialization" message to the User.
