# Hook Input Transcript Command

This command opens the Claude Code session transcript captured by the PreToolUse hook, using the authoritative session data from Claude Code's runtime.

## Instructions

To open the hook-captured transcript in VS Code, I'll:

1. Read the session data captured by our PreToolUse hook
2. Use the transcript_path from the hook input
3. Open it in VS Code via host-bridge

```bash
tsx src/scripts/session/open-hook-transcript.ts
```

## How it Works

This approach uses the session data captured directly from Claude Code's PreToolUse hook input. The hook receives the active session information including session_id and transcript_path directly from Claude Code's runtime.

- Reads captured session data from `.claude/conversations/<session-id>/conversation.json`
- Uses the transcript_path provided by Claude Code
- Opens the authoritative session transcript in VS Code

## Use Cases

- **Authoritative Data**: Uses Claude Code's official session information
- **Runtime Accuracy**: Reflects exactly what Claude Code considers the current session
- **Hook Validation**: Verifies hook capture is working correctly

## Implementation Details

- **Method**: PreToolUse hook capture-based detection
- **Script**: `src/scripts/session/open-hook-transcript.ts`
- **Data Source**: Hook input session_id and transcript_path
- **VS Code**: Opens via host-bridge integration