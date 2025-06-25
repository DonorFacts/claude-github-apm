# Token Impacts from Tool Calls in Claude Code

## Executive Summary

**Critical Finding**: Every tool call in Claude Code adds to the context window and increases token consumption. Tool calls are not "free" - they accumulate in the conversation history and consume valuable context space.

## How Tool Calls Impact Tokens

### 1. Tool Definitions Count
When Claude Code uses tools, the tool definitions themselves consume tokens:
- Tool name, description, and parameters are included in every request
- Complex tools with detailed schemas use more tokens
- All available tools are sent with each API call

### 2. Progressive Accumulation
Each tool interaction follows this pattern:
1. **User Message** → Added to context
2. **Claude's Tool Call** → Added to context (includes tool name + parameters)
3. **Tool Result** → Added as new user message to context
4. **Claude's Response** → Added to context

**Result**: A single tool use creates 3-4 message entries that persist in the context window.

### 3. Linear Growth Problem
```
Initial context: 1,000 tokens
After 10 bash commands: ~5,000 tokens
After 50 file edits: ~25,000 tokens
After 100 tool calls: ~50,000+ tokens
```

## Specific Impact: Terminal Title Updates

Our `update-terminal-title.sh` script, while useful for visibility, has token costs:
- Each call adds ~200-300 tokens to context
- Frequent updates (every state change) can consume 5-10% of context window
- In a typical session: 50+ title updates = 10,000-15,000 tokens

## Best Practices for Minimizing Token Impact

### 1. Batch Operations
**Bad Pattern** (multiple tool calls):
```typescript
await bash("mkdir dir1");
await bash("mkdir dir2");
await bash("mkdir dir3");
```

**Good Pattern** (single tool call):
```typescript
await bash("mkdir dir1 dir2 dir3");
```

### 2. Strategic Tool Use
- **Combine Commands**: Use `&&` or `;` to chain bash commands
- **Multi-Edit Tool**: Edit multiple files in one operation
- **Bulk Operations**: Read/process multiple files together

### 3. Context Management
- Use `/clear` between major tasks
- Keep CLAUDE.md for persistent information (doesn't consume conversation tokens)
- Summarize before clearing to preserve important state

### 4. Terminal Title Optimization
**Current Approach** (high token usage):
- Update on every minor state change
- Multiple updates per task

**Optimized Approach**:
- Update only on major state transitions
- Batch multiple status changes
- Use concise status messages

### 5. Tool Selection
**High Token Cost**:
- WebSearch (returns large result sets)
- Read (especially for large files)
- Repeated bash commands

**Lower Token Cost**:
- Glob/Grep (return only matches)
- Edit (targeted changes)
- Write (single operation)

## Token-Efficient Patterns

### Pattern 1: Milestone-Based Updates
Instead of updating terminal title for every action:
```bash
# Start of major task
./update-terminal-title.sh "🔄 PE: Feature Implementation"
# ... many operations ...
# End of task
./update-terminal-title.sh "✅ PE: Feature Complete"
```

### Pattern 2: File-Based State
Store status in files rather than conversation:
```bash
echo "current_task: implementing auth" > .status
# Later, read from file instead of maintaining in context
```

### Pattern 3: Batch Information Gathering
```typescript
// Instead of multiple searches
const results = await Task.search("find all test files and config files");

// Instead of reading files one by one
const files = await Read.multiple(["file1.ts", "file2.ts", "file3.ts"]);
```

## Monitoring Token Usage

### Warning Signs
- Context window warnings (e.g., "28% remaining")
- Performance degradation
- Increased errors or confusion
- Need to re-read previously accessed information

### Proactive Measures
1. Track approximate tokens per operation type
2. Set thresholds for context clearing
3. Use external tools for token counting
4. Plan heavy operations for fresh sessions

## Advanced Token Reduction Patterns

### Beyond Basic Batching

#### 1. Meta-Script Generation
Generate comprehensive scripts instead of multiple commands:
```bash
# One tool call creates script for entire session
cat > session_work.sh << 'EOF'
#!/bin/bash
# All operations in one script
mkdir -p src/{components,utils,tests}
for comp in Button Card Modal; do
  echo "export default {}" > "src/components/$comp.tsx"
done
npm install && npm test
echo "✅ Complete"
EOF
chmod +x session_work.sh && ./session_work.sh
```
**Impact**: 20+ tool calls → 3 tool calls

#### 2. File-Based State Management
Use agent memory system for persistent state:
```bash
# State tracking without context pollution
# Use context saves and MEMORY.md updates
# Scripts can read from apm/agents/<role>/context/latest.md
```

#### 3. Declarative Workflows
Define entire workflows upfront:
```yaml
# .claude/workflow.yml
phases:
  setup: [create_dirs, install_deps]
  implement: [generate_components, add_tests]
  validate: [run_tests, check_lint]
```

#### 4. External Memory Pattern
Store ephemeral data outside conversation:
```bash
# Track in context saves instead of terminal updates
# Update MEMORY.md for patterns
# Only update terminal for major milestones
```

#### 5. Headless Claude Orchestration
Use Claude's headless mode for batch operations:
```bash
claude -p "Generate complete test suite" --output-format stream-json
```

## Recommendations

### For Terminal Status Updates
1. **Milestone-Only Updates**: 5-10 per session (not 50+)
2. **Event-Driven**: Update only on phase transitions
3. **Context Saves**: Track detailed progress in context saves
4. **Batch Status Changes**: Accumulate then update once

### For General Tool Use
1. **Meta-Scripts**: Generate scripts that do multiple operations
2. **State Files**: Track progress in files, not conversation
3. **Slash Commands**: Create reusable .claude/commands/
4. **Transaction Batching**: Queue operations, execute together
5. **External Processing**: Use headless mode for heavy work

## Cost Analysis

Assuming Claude Code pricing at $3 per million input tokens:
- 100 tool calls ≈ 50,000 tokens ≈ $0.15
- Heavy terminal updates (200/session) ≈ 60,000 tokens ≈ $0.18
- Inefficient file operations ≈ 100,000 tokens ≈ $0.30

**Potential Savings**: 50-70% token reduction through optimization

## Conclusion

Tool calls in Claude Code have significant token impact. Every bash command, file operation, and status update persists in the context window. By adopting token-efficient patterns, we can extend effective context window usage by 2-3x while reducing costs proportionally.

The key insight: **Tool calls are conversations, not free operations**. Design your workflows accordingly.