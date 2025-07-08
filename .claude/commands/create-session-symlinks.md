# Create Session Symlinks

Creates a `.claude/sessions/` folder structure with symlinks to organize the current conversation and its related subagent sessions.

## What it does

1. **Creates organized folder structure**: 
   ```
   .claude/sessions/YYYYMMDD_HHMMSS-<parent-session-id>/
   ├── main.jsonl -> /Users/jakedetels/.claude/projects/-workspace-main/<parent-session-id>.jsonl
   ├── subagent-1-YYYYMMDD_HHMMSS-<subagent-session-id-1>.jsonl -> (subagent 1 transcript)
   └── subagent-2-YYYYMMDD_HHMMSS-<subagent-session-id-2>.jsonl -> (subagent 2 transcript)
   ```

2. **Intelligently finds subagents**: Analyzes recent parent session messages to find subagent invocations and matches them with subagent transcript files

3. **Creates host-compatible symlinks**: Converts container paths to macOS host paths for easy access

4. **Provides session summary**: Creates `session-info.json` with metadata about the session and subagents

## Requirements

- Must be run from a **parent agent** (not subagent) to get correct session ID
- Requires active hooks system to capture session data
- Works best when subagents have been invoked via `Task` tool with `run src/prompts/` commands

## Usage

Run the script directly:

```bash
tsx src/scripts/session/create-session-symlinks.ts
```

## Output

The script will:
1. Use hooks-captured session data to identify current session
2. Create timestamped folder in `.claude/sessions/`
3. Create `main.jsonl` symlink to parent session transcript
4. Search for and link related subagent transcripts
5. Generate summary file with session metadata

## Troubleshooting

**No captured sessions found**: Ensure hooks are active and you're running from a parent agent, not a subagent.

**No subagents found**: This is normal if no subagents were invoked, or if the pattern matching didn't find connections. Check that subagents were invoked via Tool calls with `run src/prompts/` patterns.

**Permission errors**: Ensure the script has permission to create directories and symlinks.