# Container Speech Notifications Design

## Overview

Enable Docker containers to trigger macOS text-to-speech notifications for immediate user feedback when Claude Code completes tasks.

## Architecture Decision: Volume Mount with Intelligent Polling

### Rationale

Volume mount approach chosen over network/SSH because:
1. **Consistency**: Matches existing volume-based container integration pattern
2. **Simplicity**: No additional services, ports, or authentication required
3. **Reliability**: Leverages proven file system operations
4. **Security**: No network surface area to secure
5. **Immediacy**: With `fswatch` daemon, provides near real-time feedback

### Implementation Strategy

#### Container Side
- Write timestamped speech messages to `/workspace/.local/speech-queue`
- Simple append operation with message + timestamp
- No polling or waiting required

#### Host Side  
- Lightweight `fswatch` daemon monitors speech queue file
- On file change, processes new messages and calls macOS `say` command
- Truncates processed messages to prevent file growth
- Runs as background service during development sessions

#### Integration Points
- Extends existing volume mount system (`/workspace/.local` already mounted)
- Integrates with existing `Notify_Jake` command pattern
- Works transparently with current container wrapper scripts

### Technical Specifications

#### File Format
```
TIMESTAMP|MESSAGE
2025-06-28T16:45:00Z|Task completed by Claude Code
```

#### Host Daemon
```bash
#!/bin/bash
# speech-daemon.sh - monitors and processes speech queue
fswatch /path/to/speech-queue | while read event; do
    # Process new messages and call 'say'
    # Truncate processed content
done
```

#### Container Integration
```bash
# Enhanced Notify_Jake command
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)|Task completed by Claude Code!" >> /workspace/.local/speech-queue
echo "🔔 Task completed by Claude Code!"
```

### Future Enhancements
- Voice selection options
- Message prioritization
- Multiple container support
- Fallback to visual notifications

### Security Considerations
- File-based approach eliminates network attack surface
- Standard file permissions control access
- No authentication or encryption complexity

## Implementation Plan

1. Create host-side speech daemon with `fswatch`
2. Update container `Notify_Jake` command to write to queue
3. Test end-to-end workflow
4. Document setup instructions
5. Consider background service integration (launchd)

## Next Steps

This design will be implemented as a separate feature request to restore immediate speech feedback for Claude Code task completion in containerized environments.