# Team Knowledge Contribution Guidelines

## When to Contribute to Team Knowledge

Contribute when you discover something that:
- **Affects multiple agents** - Not just your specialty
- **Will resurface** - Likely to be encountered again
- **Has non-obvious solutions** - Not googleable in 5 seconds
- **Carries consequences** - Could waste hours if unknown

## What Belongs in Team Knowledge vs Agent Memory

### Team Knowledge Base
- Architectural decisions affecting all agents
- Project-specific gotchas and workarounds  
- Cross-cutting patterns (error handling, auth flows)
- Failed approaches (prevent others from trying)
- External system quirks (GitHub API rate limits)

### Individual Agent Memory
- Role-specific techniques
- Personal working preferences
- Specialized domain knowledge
- Individual user relationships

## Contribution Quality Bar

Before adding to team knowledge, ensure:

1. **Specificity** - Include concrete examples
2. **Context** - When does this apply?
3. **Evidence** - What happened that proved this?
4. **Actionability** - What should others DO with this?

## Anti-Patterns to Avoid

❌ "Remember to test your code"
❌ "The user prefers clean code"  
❌ "React can be tricky sometimes"
❌ Copy-pasting documentation

✅ "GitHub webhook delivery can lag 5-30s during high load (discovered 2024-01-15 when sync appeared broken)"
✅ "Project convention: All monetary values in cents to avoid floating point errors (decided after payment bug #234)"
✅ "Workaround: Claude Code's bash blocks fail with unescaped $ in heredocs - use \$ instead"

## Contribution Format

```markdown
## [Brief Title]

**Category**: architecture|pattern|gotcha|project-specific|post-mortem
**Affects**: [Which agents/workflows]
**Discovered**: [Date and context]

### Summary
[One sentence explanation]

### Details
[Full context, examples, evidence]

### Action Items
- What to do when encountering this
- What to avoid

### References
- [Related issue/PR/decision]
```

## Retrieval Pattern

Agents should search team knowledge when:
- Starting work in unfamiliar area
- Hitting unexpected errors
- Making architectural decisions
- Onboarding to new project area

Use semantic search, not full load:
```bash
search-team-knowledge "webhook" "rate limit"
```

This keeps token costs manageable while providing value.