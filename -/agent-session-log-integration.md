# Session Log Integration Design

## Overview

This document outlines how agents integrate with Claude Code's native session logs while adding agent-specific tracking.

## Architecture

### 1. Session Manifest File
Each agent maintains a manifest that links to Claude Code's native logs:

**File**: `apm/agents/<role-id>/sessions/manifest.jsonl`

**Entry Format**:
```json
{
  "session_id": "20241218_143022",
  "role": "prompt-engineer",
  "started": "2024-12-18T14:30:22Z",
  "ended": null,
  "cc_log_path": "~/.claude/projects/-Users-jakedetels-www-claude-github-apm/d1ba1f60-f36d-48cc-ad4f-3af5446b2c93.jsonl",
  "topic": "github-integration",
  "milestones": [],
  "commits": []
}
```

### 2. Milestone Tracking
Agents append milestones to the current session entry:

```bash
# When completing a significant task
jq '.milestones += [{"timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'", "description": "Implemented GitHub webhook handler"}]' \
  < manifest.jsonl > manifest.tmp && mv manifest.tmp manifest.jsonl
```

### 3. Git Commit Tracking
Automatically capture commits made during the session:

```bash
# After making a commit
COMMIT_SHA=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)
jq '.commits += [{"sha": "'$COMMIT_SHA'", "message": "'$COMMIT_MSG'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}]' \
  < manifest.jsonl > manifest.tmp && mv manifest.tmp manifest.jsonl
```

### 4. Session Lifecycle

**On Agent Init**:
1. Check for active session in manifest
2. If none, create new entry with CC log path
3. If exists, continue with that session

**On Context Clear (`/clear`)**:
1. Mark current session as ended
2. Start new session entry
3. Link to new CC log file

**On Context Save**:
1. Update session with final milestones
2. Mark as ended if appropriate
3. Archive to timestamped file

## Post-Processing Utilities

### Extract Agent Sessions
Script to extract agent-specific portions from CC logs:

```bash
#!/bin/bash
# extract-session.sh
SESSION_ID=$1
MANIFEST_ENTRY=$(jq -r --arg id "$SESSION_ID" 'select(.session_id == $id)' manifest.jsonl)
CC_LOG=$(echo $MANIFEST_ENTRY | jq -r '.cc_log_path')
START_TIME=$(echo $MANIFEST_ENTRY | jq -r '.started')
END_TIME=$(echo $MANIFEST_ENTRY | jq -r '.ended // now')

# Extract relevant timeframe from CC log
jq -c --arg start "$START_TIME" --arg end "$END_TIME" \
  'select(.timestamp >= $start and .timestamp <= $end)' \
  $(eval echo $CC_LOG)
```

### Clean Sensitive Data
Remove sensitive information from logs:

```bash
#!/bin/bash
# clean-logs.sh
jq 'if .message.content then 
      .message.content |= gsub("api_key=[^\\s]+"; "api_key=REDACTED") |
      .message.content |= gsub("password=[^\\s]+"; "password=REDACTED")
    else . end'
```

### Analyze Patterns
Extract insights from session logs:

```bash
#!/bin/bash
# analyze-session.sh
# Count tool usage
jq -r 'select(.message.content[0].type? == "tool_use") | .message.content[0].name' | sort | uniq -c

# Extract error patterns
jq -r 'select(.toolUseResult.error?) | .toolUseResult.error'

# Time between milestones
jq -r '.milestones[].timestamp' | while read -r ts; do date -d "$ts" +%s; done | \
  awk 'NR>1{print ($1-prev)/60 " minutes"} {prev=$1}'
```

## Benefits

1. **Zero Token Overhead**: No additional conversation logging
2. **Full Integration**: Direct access to CC's complete logs
3. **Agent Context**: Adds role-specific metadata and milestones
4. **Git Awareness**: Tracks commits within sessions
5. **Privacy Ready**: Post-processing can clean sensitive data
6. **Analysis Capable**: Enables pattern extraction and insights

## Implementation Priority

1. Basic manifest creation and session tracking
2. Milestone and commit integration
3. Post-processing utilities
4. Analysis and pattern extraction tools