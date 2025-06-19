# Token Efficiency Guide for APM Agents

## Understanding Token Costs in Claude Code

### The Exponential Cost Problem

When using Claude Code, token costs grow in two dimensions:

1. **Context Window Growth**: Each message includes the entire conversation history
   - Message 1: Just the first exchange
   - Message 10: All 10 exchanges
   - Message 20: All 20 exchanges (4x the context of message 10)

2. **Additional Logging Overhead**: If agents generate logs, this doubles output tokens
   - User message → Agent response (base cost)
   - User message → Agent response + Log generation (2x output cost)

### Cost Multiplication Example

Traditional full logging approach:
- 10-message conversation = 55 cumulative message processings (1+2+3...+10)
- With JSONL generation = 2x output tokens per message
- Result: Quadratic growth in token costs

## Efficient Session Tracking Strategy

### Principle: Leverage Existing Infrastructure

Claude Code already maintains full conversation logs in `~/.claude/projects/`. Instead of duplicating this data, we:

1. **Use Native Logs**: Full conversation details already captured
2. **Add Minimal Metadata**: Single-line bash commands for milestones
3. **Avoid Redundancy**: Don't regenerate what's already logged

### Implementation

Instead of:
```json
{
  "type": "user",
  "content": "full message content...",
  "timestamp": "...",
  // ... many more fields
}
```

We use:
```bash
echo "2024-12-18_14:30:22 | MILESTONE: Implemented GitHub integration" >> current_session.txt
```

### Benefits

1. **Token Savings**: 
   - Full JSONL: ~200-500 tokens per entry
   - Milestone tracking: ~20 tokens per bash command
   - Savings: 90-95% reduction in logging overhead

2. **No Context Inflation**: Bash commands don't add to conversation history

3. **Preserved Functionality**: Can still track sessions, milestones, and patterns

## Best Practices for Agents

### When to Log Milestones

Log only significant events:
- Major task completions
- Key decisions made
- Pattern discoveries
- Error resolutions

### When NOT to Log

Avoid logging:
- Every tool use
- Routine operations
- Intermediate steps
- Thinking processes

### Memory System Integration

The three-tier memory system remains unchanged:
1. **Session Tracking**: Lightweight milestone markers
2. **MEMORY.md**: Extracted patterns and learnings
3. **Context Files**: Current work state

Session tracking provides waypoints for navigating Claude Code's native logs when deeper analysis is needed.

## Cost Optimization Tips

1. **Batch Operations**: Combine multiple tool uses in single responses
2. **Strategic Summaries**: Update MEMORY.md with patterns, not transcripts
3. **Milestone Focus**: Track outcomes, not process
4. **Context Awareness**: Monitor and alert on context degradation early

## Conclusion

By respecting Claude Code's existing logging infrastructure and adding only essential metadata, we achieve:
- 90%+ reduction in logging token costs
- No impact on conversation quality
- Full session awareness
- Sustainable scaling for long conversations

This approach demonstrates thoughtful prompt engineering that balances functionality with economic efficiency.