# Session ID Command

This command retrieves and displays the current Claude Code session ID.

## Instructions

To get the current session information, I'll run:

```bash
tsx src/scripts/session/get-current-id.ts
```

This displays:
- Current Session ID (e.g., `abc123def456...`)
- Transcript Path (location of the conversation log)
- When the session was first captured

## How it Works

The session ID is automatically captured by a PreToolUse hook on the first tool use in any conversation. The hook saves the session data to `.claude/conversations/<session-id>/conversation.json`.

If no session data is found, it means this is the first command being run and the hook will capture it on the next tool use.

## Implementation Details

- **Hook**: `src/scripts/hooks/capture-session-id.ts` - Captures session data from stdin
- **Retrieval**: `src/scripts/session/get-current-id.ts` - Finds the most recent session
- **Storage**: `.claude/conversations/<session-id>/conversation.json`