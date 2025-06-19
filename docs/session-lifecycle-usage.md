# Session Lifecycle Usage Guide

## Overview

The APM session lifecycle system provides:
- Dynamic terminal titles showing agent status
- Event-based session tracking
- Automatic post-processing when sessions end
- Integration with Claude Code's native logs

## How It Works

### 1. Agent Initialization
When an agent starts, it:
- Sets terminal title to role name
- Creates session manifest entry
- Logs `session_start` event
- Initializes activity tracking

### 2. During Work
Agents:
- Update terminal title with status: `PE: Analyzing code`
- Track activity to detect idle periods
- Log milestones and commits
- Maintain session manifest

### 3. Session End
When context is saved or cleared:
- Log `session_end` event
- Mark session as ended in manifest
- Return terminal title to role name
- Trigger post-processing

## Terminal Title Convention

| Role | Abbreviation | Example Status |
|------|--------------|----------------|
| Prompt Engineer | PE | PE: Designing prompts |
| Scrum Master | SM | SM: Creating issues |
| Developer | Dev | Dev: Running tests |
| QA Engineer | QA | QA: Writing tests |

## Event Types

Events are logged to `apm/events/queue.jsonl`:

```json
{"event": "session_start", "role": "prompt-engineer", "session_id": "20241218_150000", "timestamp": "2024-12-18T15:00:00Z"}
{"event": "milestone", "description": "Implemented GitHub integration", "timestamp": "2024-12-18T15:30:00Z"}
{"event": "commit", "sha": "abc123", "message": "feat: add webhook", "timestamp": "2024-12-18T15:45:00Z"}
{"event": "session_idle", "duration_minutes": 10, "timestamp": "2024-12-18T16:00:00Z"}
{"event": "session_end", "role": "prompt-engineer", "session_id": "20241218_150000", "timestamp": "2024-12-18T16:30:00Z"}
```

## Post-Processing

### Manual Processing
Run when you want to process events:
```bash
./scripts/session-tools/process-events.sh
```

### Automatic Processing
Run the watcher in a separate terminal:
```bash
./scripts/watch-events.sh
```

### What Happens
When a session ends, the system:
1. Extracts the full session from Claude Code logs
2. Cleans sensitive data
3. Generates session analysis
4. Extracts patterns for memory updates
5. Updates session topic if needed
6. Optionally sends desktop notification

## Output Files

Post-processing creates in `apm/agents/<role>/sessions/`:
- `<session_id>_full.jsonl` - Complete session log
- `<session_id>_clean.jsonl` - Sanitized version
- `<session_id>_analysis.txt` - Session statistics
- `<session_id>_patterns.md` - Extracted patterns

## Desktop Notifications (Optional)

To enable desktop notifications:

1. Install node-notifier:
   ```bash
   npm install node-notifier
   ```

2. Notifications will appear when:
   - Sessions complete post-processing
   - Errors occur during processing
   - Custom milestones are reached

## Integration with Memory System

The session lifecycle complements the three-tier memory:
- **Session Logs**: Detailed conversation history
- **Pattern Extraction**: Identifies recurring themes
- **Memory Updates**: Agents can review patterns to update MEMORY.md
- **Context Continuity**: Sessions link to context saves

## Best Practices

1. **Update Terminal Frequently**: Shows users what agent is doing
2. **Log Key Milestones**: But not every action
3. **Commit Tracking**: Automatically captured in manifest
4. **Clean Sessions**: Run post-processing before sharing logs
5. **Pattern Review**: Periodically review extracted patterns

## Troubleshooting

### Events Not Processing
- Check if `apm/events/queue.jsonl` exists
- Ensure scripts are executable: `chmod +x scripts/session-tools/*.sh`
- Look for lock file: `apm/events/.processing.lock`

### Session Not Found
- Verify session ID in manifest
- Check Claude Code log exists
- Ensure proper timestamps

### No Notifications
- Install node-notifier: `npm install node-notifier`
- Check system notification permissions
- Run notify test: `node scripts/notify.js "Test" "Message"`