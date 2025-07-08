# Session Code Command

This command opens the current Claude Code session transcript in VS Code for review and analysis.

## Instructions

To open the current session transcript in VS Code, I'll:

1. Get the current session information
2. Extract the transcript path (JSONL file) 
3. Run `code <transcript-path>` to open it in VS Code

```bash
tsx src/scripts/session/open-in-code.ts
```

## How it Works

The session transcript path is automatically captured by the PreToolUse hook on the first tool use in any conversation. The hook saves the session data to `.claude/conversations/<session-id>/conversation.json`, including the transcript path.

This command:
- Retrieves the most recent session data
- Extracts the transcript path from the captured session info
- Opens the JSONL transcript file in VS Code for review

## Use Cases

- **Session Review**: Review the full conversation history
- **Debugging**: Analyze tool calls and responses
- **Context Analysis**: Understand the flow of a complex session
- **Learning**: Study how Claude Code handles various tasks

## Implementation Details

- **Hook**: `src/scripts/hooks/session-capture-fixed.ts` - Captures session data including transcript path
- **Retrieval**: `src/scripts/session/open-in-code.ts` - Opens transcript in VS Code
- **Storage**: `.claude/conversations/<session-id>/conversation.json`

If no session data is found, it means this is the first command being run and the hook will capture it on the next tool use.