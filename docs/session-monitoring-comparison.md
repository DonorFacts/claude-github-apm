# Session Monitoring Approach Comparison

## Original Approach (Bash + Agent Events)

### How it worked
- Agents generate event files during operation
- Bash scripts process events
- Manual terminal title updates
- File-based event queue

### Pros
- Simple to implement
- No dependencies
- Works immediately

### Cons
- **Token overhead**: Every event costs output tokens
- **Complexity in prompts**: Agents must remember to log events
- **Brittle bash scripts**: Hard to maintain and debug
- **Limited real-time**: Polling-based detection

## New Approach (TypeScript + Log Monitoring)

### How it works
- TypeScript service monitors Claude's native JSONL logs
- Real-time file watching with `tail`
- Automatic event detection from log analysis
- Zero changes to agent behavior

### Pros
- **Zero token overhead**: Monitoring happens externally
- **Simpler prompts**: Agents focus on their work
- **Type-safe code**: Easier to maintain and extend
- **Real-time updates**: Immediate event detection
- **Richer data**: Access to full conversation context

### Cons
- Requires Node.js runtime
- More complex initial setup
- Depends on Claude's log format

## Key Improvements

### 1. Token Efficiency
```
Old: ~50-100 tokens per event logged
New: 0 tokens (external monitoring)

Savings: 100% reduction in monitoring overhead
```

### 2. Prompt Simplicity
```
Old: 50+ lines of event logging instructions
New: 5 lines (just set role environment variable)

Reduction: 90% less prompt complexity
```

### 3. Data Quality
```
Old: Only explicitly logged events
New: Complete conversation history + derived events

Improvement: 10x more data available
```

### 4. Maintenance
```
Old: Bash scripts scattered across multiple files
New: TypeScript classes with clear interfaces

Benefit: Type safety, better tooling, easier testing
```

## Migration Path

1. **Keep existing event system**: Works as fallback
2. **Deploy TypeScript monitor**: Runs alongside
3. **Gradually simplify prompts**: Remove event logging
4. **Enhance with new features**: Add analytics, dashboards

## Conclusion

The TypeScript log monitoring approach is superior because it:
- Eliminates token costs
- Simplifies agent prompts
- Provides richer data
- Offers better maintainability
- Enables real-time monitoring

This represents a shift from "agents self-report" to "system observes agents" - a more scalable and efficient architecture.