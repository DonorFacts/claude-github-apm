# Session Lifecycle & Post-Processing Design

## Requirements Summary

1. **Post-processing Trigger**: Execute when session ends or after inactivity
2. **Dynamic Terminal Titles**: Show agent status during work
3. **Event System**: Trigger events for external processing
4. **User Notifications**: Alert when tasks complete

## Design Options Analysis

### Option 1: File-Based Event System (Simple)
**Approach**: Agents write to event files that external watchers monitor

**Pros**:
- Simple to implement in prompts
- No additional dependencies
- Works across all platforms
- Easy to debug and test

**Cons**:
- Requires external file watcher
- Slight delay in event detection
- No built-in notification support

**Implementation**:
```bash
# Agent signals session end
echo "SESSION_END:$(date -u +%Y-%m-%dT%H:%M:%SZ):$ROLE:$SESSION_ID" >> apm/events/queue.txt
```

### Option 2: Terminal Title with Timer (Intermediate)
**Approach**: Use terminal titles for status + bash background job for inactivity

**Pros**:
- Visual feedback to user
- Built-in timeout capability
- No external dependencies

**Cons**:
- Limited to terminal environment
- No desktop notifications
- Complex bash scripting

**Implementation**:
```bash
# Start inactivity timer (background job)
(sleep 600 && echo "INACTIVE:$SESSION_ID" >> apm/events/queue.txt) &
TIMER_PID=$!

# Reset timer on activity
kill $TIMER_PID 2>/dev/null
(sleep 600 && echo "INACTIVE:$SESSION_ID" >> apm/events/queue.txt) &
```

### Option 3: Node.js Service Integration (Advanced)
**Approach**: Create lightweight Node.js service for notifications and events

**Pros**:
- Desktop notifications via `node-notifier`
- Rich terminal titles via `console-title`
- WebSocket support for real-time events
- Cross-platform compatibility

**Cons**:
- Requires Node.js service running
- More complex setup
- Additional dependencies

**Implementation**:
```javascript
// apm-monitor service
const notifier = require('node-notifier');
const consoleTitle = require('console-title');
const fs = require('fs');

// Watch for events
fs.watch('apm/events', (eventType, filename) => {
  const event = fs.readFileSync(`apm/events/${filename}`, 'utf8');
  handleEvent(event);
});
```

## Recommended Solution: Hybrid Approach

Combine the best aspects of each option for maximum flexibility and minimal complexity:

### 1. Core Event System (File-Based)
- Agents write events to `apm/events/queue.jsonl`
- Simple, reliable, no dependencies
- Works even if other systems fail

### 2. Terminal Title Updates (Native)
- Use bash escape sequences for status
- Format: `<Role>: <Status>` during work
- Return to `<Role>` when idle

### 3. Optional Enhancement Layer
- Node.js monitor service (opt-in)
- Provides desktop notifications
- Handles post-processing triggers
- Can be added later without changing prompts

## Prompt Engineering Strategy

### Session Lifecycle States

1. **INIT**: Agent starts, sets up session
2. **ACTIVE**: Working on tasks, updates terminal
3. **IDLE**: No activity for 5+ minutes
4. **ENDING**: User requests save/exit
5. **ENDED**: Session complete, triggers post-processing

### Terminal Title Protocol

```bash
# Format: <Role Abbreviation>: <Status>
# Examples:
echo -e "\033]0;PE: Analyzing code\007"
echo -e "\033]0;SM: Creating issues\007"
echo -e "\033]0;Dev: Running tests\007"

# Return to normal
echo -e "\033]0;Prompt Engineer\007"
```

### Event Queue Format

```json
{"event": "session_start", "role": "prompt-engineer", "session_id": "20241218_150000", "timestamp": "2024-12-18T15:00:00Z"}
{"event": "milestone", "description": "Completed GitHub integration", "timestamp": "2024-12-18T15:30:00Z"}
{"event": "commit", "sha": "abc123", "message": "feat: add webhook", "timestamp": "2024-12-18T15:45:00Z"}
{"event": "session_idle", "duration_minutes": 10, "timestamp": "2024-12-18T16:00:00Z"}
{"event": "session_end", "role": "prompt-engineer", "session_id": "20241218_150000", "timestamp": "2024-12-18T16:30:00Z"}
```

### Inactivity Detection

```bash
# Agent maintains activity timestamp
LAST_ACTIVITY=$(date +%s)

# Function to check inactivity (called periodically)
check_inactivity() {
    local now=$(date +%s)
    local idle_time=$((now - LAST_ACTIVITY))
    
    if [ $idle_time -gt 300 ]; then  # 5 minutes
        echo '{"event": "session_idle", "duration_minutes": '$((idle_time/60))', "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' \
            >> apm/events/queue.jsonl
    fi
}

# Update activity on any action
update_activity() {
    LAST_ACTIVITY=$(date +%s)
}
```

## Implementation Plan

### Phase 1: Core Event System
1. Update agent prompts to write events
2. Implement terminal title updates
3. Add inactivity detection

### Phase 2: Post-Processing
1. Create event processor script
2. Implement session finalization
3. Extract patterns to memory

### Phase 3: Enhanced Monitoring (Optional)
1. Node.js monitor service
2. Desktop notifications
3. Real-time dashboard

## Benefits of This Approach

1. **Progressive Enhancement**: Basic functionality works immediately, enhancements are optional
2. **Token Efficient**: Minimal overhead in agent responses
3. **Extensible**: Easy to add new event types or processors
4. **Debuggable**: File-based events are easy to inspect
5. **Cross-Platform**: Works on all systems Claude Code supports

## Next Steps

1. Update agent initialization prompt with event system
2. Create event processor scripts
3. Document event types and handlers
4. Test with multiple concurrent agents