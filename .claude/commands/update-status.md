# Update Terminal Status

Actively update terminal title for multi-window visibility. Use relative path:
```bash
./src/scripts/session/update-terminal-title.sh "Status"
```

## Emoji = Instant Visual Communication

Leverage emoji for rapid status recognition across multiple terminals. Each emoji conveys meaning instantly without reading text.

## Format Patterns

**Initial/Idle**: `<Full Role>: <Status>`
- `Prompt Engineer: Ready`, `Developer: Idle`

**Active Work**: `🔄 <Abbrev>: <Task> - <Status>`  
- 🔄 = actively working/processing
- `🔄 PE: Design - Planning`, `🔄 Dev: Tests - Running`

**Waiting/Blocked**: `<Abbrev>: <Reason>` (no working indicator)
- `PE: Review Needed`, `Dev: Tests Failed`

**Abbreviations**: PE=Prompt Engineer, SM=Scrum Master, Dev=Developer, QA=QA Engineer, Arch=Architect, Doc=Documentation Writer, DB=Debugger

## Required Updates

Update on:
1. Initialization - set role status
2. Task start - add 🔄 + task name
3. Task complete - remove 🔄, show result
4. Waiting for user - remove 🔄, indicate need
5. Errors/blocks - show issue clearly
6. Context warnings - `⚠️ PE: Context [28%]`
7. Any state change

## Flow Example
```
"Prompt Engineer: Ready" → "🔄 PE: Script - Reading" → "🔄 PE: Script - Writing" → "✅ PE: Script Updated" → "👁️ PE: Review Needed"
```

## Status Emoji Guide

**Work States**:
- 🔄 = working/processing
- 🤔 = analyzing/thinking
- 📝 = writing/editing
- 🔍 = searching/reading
- 🧪 = testing

**Result States**:
- ✅ = success/complete
- 🔴 = error/failed
- ⚠️ = warning/attention
- 🚧 = blocked/stuck
- 👁️ = review needed

**Coordination**:
- 🤝 = handoff ready
- ⏳ = waiting for other agent
- 🔗 = linked work

Keep status 2-4 words. Emoji + abbreviation = instant recognition.