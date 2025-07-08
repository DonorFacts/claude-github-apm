# Session Symlinks Creation

You need to create a `.claude/sessions/` folder structure with symlinks to organize session transcripts.

## Task

Run the session symlinks creation script:

```bash
tsx src/scripts/session/create-session-symlinks.ts
```

## What this does

1. **Reads current session data** from hooks-captured information
2. **Creates organized folder** with timestamp and session ID 
3. **Creates main.jsonl symlink** pointing to parent session transcript
4. **Finds related subagents** by analyzing recent parent messages for subagent invocations
5. **Creates subagent symlinks** with descriptive names including timestamps
6. **Generates session summary** with metadata

## Expected structure

```
.claude/sessions/YYYYMMDD_HHMMSS-<session-id>/
├── main.jsonl -> /Users/jakedetels/.claude/projects/-workspace-main/<session-id>.jsonl
├── subagent-1-YYYYMMDD_HHMMSS-<subagent-id>.jsonl -> (subagent transcript)
├── subagent-2-YYYYMMDD_HHMMSS-<subagent-id>.jsonl -> (subagent transcript)
└── session-info.json
```

## Notes

- Only run from parent agents (not subagents) to get correct session ID
- Symlinks use macOS host paths for easy access from VS Code
- If no subagents found, that's normal - only parent session will be linked
- Script is safe to run multiple times (overwrites existing symlinks)

Just run the script and report the results.