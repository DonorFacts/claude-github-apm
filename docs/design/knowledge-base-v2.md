# Team Knowledge Base - Design Document (v2)

## Purpose

Enable agents to preserve and share knowledge at the right level:
- **Agent-specific knowledge**: Preserved across instances of the same role
- **Team knowledge**: Shared across all agents on the project

## Core Concept

Two complementary knowledge bases with clear boundaries:
1. Agent knowledge stays with the role (survives reinitialization)
2. Team knowledge helps all agents avoid repeating discoveries

## Knowledge Hierarchy

### Agent-Specific Knowledge (apm/agents/<role-id>/knowledge/)
Knowledge that helps a specific role but doesn't need team-wide sharing:

**Examples for Developer Agent:**
- "VSCode snippet for our error boundary pattern"
- "Debugging technique for our webpack config"  
- "How to efficiently profile our React components"

**Examples for Scrum Master Agent:**
- "GitHub project board automation tricks"
- "Issue template patterns that work well"
- "Sprint planning calculations for our velocity"

### Team Knowledge (project/team-knowledge/)
Discoveries that affect multiple agents:

**Examples:**
- Architectural decisions: "We use cents for money because of float precision"
- External system quirks: "GitHub webhooks to staging can lag 5-30 seconds"
- Non-obvious solutions: "CustomerID changes during mergers - use InternalID instead"
- Project conventions: "All dates are stored in UTC, displayed in user's timezone"

### What Goes in Memory vs Knowledge

**MEMORY.md** - Learning patterns and preferences:
- "User prefers concise responses"
- "Effective approaches to common tasks"
- "Working style preferences"

**Knowledge Base** - Specific, referenceable facts:
- "Config file located at /app/config/prod.json"
- "API endpoint /v2/users deprecated - use /v3/users"
- "Deploy script requires NODE_ENV=production"

## Directory Structure

```
# Agent-specific knowledge
apm/agents/
├── developer/
│   └── knowledge/
│       ├── README.md    # Index for this agent's knowledge
│       ├── 2024-01-10-react-profiling-setup.md
│       └── 2024-01-15-webpack-debug-trick.md
├── scrum-master/
│   └── knowledge/
│       ├── README.md
│       └── 2024-01-12-github-board-automation.md
└── [other-agents]/

# Team-wide knowledge  
project/team-knowledge/
├── README.md           # Index of team knowledge
├── entries/
│   ├── 2024-01-15-webhook-delays.md
│   ├── 2024-01-16-money-in-cents.md
│   └── 2024-01-20-customerid-changes.md
```

## Entry Format

```markdown
# [Clear, Specific Title]

**Date**: 2024-01-15
**Category**: decision | gotcha | convention
**Discovered by**: [agent-role]

## Summary
One sentence explaining the key point.

## Details
What happened, why it matters, and what to do about it.

## Evidence
Link to issue, PR, or specific code where this was discovered.
```

That's it. No confidence scores. No decay algorithms. No complex metadata.

## Architecture Details

### Search Hierarchy
When an agent searches for knowledge:
1. First check own agent-specific knowledge
2. Then check team knowledge
3. Return combined results, clearly labeled

### File Naming Convention
- Pattern: `YYYY-MM-DD-descriptive-slug.md`
- Keep slugs short but meaningful
- Use hyphens, not underscores

### Index Files (README.md)
Each knowledge directory has a README that serves as a simple index:

```markdown
# Developer Agent Knowledge

## Quick Reference
- [React Profiling Setup](./2024-01-10-react-profiling-setup.md) - Configure profiler for our app
- [Webpack Debug Trick](./2024-01-15-webpack-debug-trick.md) - Show real error in dev mode
```

### Integration with Agent Init
During agent initialization:
1. Agent loads their MEMORY.md (patterns and preferences)
2. Agent scans their knowledge/ directory for quick reference
3. Agent notes team-knowledge location for cross-cutting issues

## Implementation Plan

### Week 1: Setup & First Entries
**Goal**: Prove the concept works with real knowledge

1. Create directory structure:
   ```bash
   mkdir -p apm/agents/{developer,scrum-master,prompt-engineer}/knowledge
   mkdir -p project/team-knowledge/entries
   ```

2. Add README.md templates to each knowledge directory

3. Seed with 2-3 real entries per location:
   - Agent knowledge: Something each role has discovered
   - Team knowledge: Recent gotchas that affected multiple agents

4. Update agent init prompts to mention knowledge directories

### Week 2: Search Implementation
**Goal**: Make knowledge discoverable

1. Create simple bash function:
   ```bash
   search-knowledge() {
     echo "=== Your Knowledge ==="
     rg -i "$1" apm/agents/$(whoami)/knowledge/ || echo "No matches"
     echo "\n=== Team Knowledge ==="
     rg -i "$1" project/team-knowledge/ || echo "No matches"
   }
   ```

2. Add to agent workflows:
   - "Before debugging, check: search-knowledge [error message]"
   - "Starting new feature? search-knowledge [feature area]"

3. Document search patterns in agent init files

### Week 3: Refinement
**Goal**: Improve based on actual usage

1. Review which knowledge gets accessed (ask agents)
2. Identify gaps - what knowledge should exist but doesn't?
3. Clarify any boundary confusion between agent/team knowledge
4. Add contribution guidelines based on real examples

### Week 4: Habits & Process
**Goal**: Make knowledge contribution routine

1. Add to agent workflows:
   - "Solved non-obvious problem? Add to knowledge"
   - "Hit same issue twice? Document it"

2. Weekly review pattern:
   - Each agent reviews their knowledge entries
   - Team reviews shared knowledge together
   - Archive anything outdated

### Success Metrics (Simple)

- Week 2: At least one agent says "found helpful knowledge"
- Week 3: Knowledge base prevents at least one repeated investigation
- Week 4: Agents contributing without being reminded

## Decision Tree: Where Does Knowledge Belong?

```
Is this knowledge specific to my role?
├─ YES → Will future instances of my role need this?
│   ├─ YES → Add to my agent knowledge
│   └─ NO → Keep in conversation context
└─ NO → Will other agents benefit?
    ├─ YES → Add to team knowledge
    └─ NO → Maybe it doesn't need preserving
```

## Quality Bar

Before adding knowledge, ask:
1. Will I (or another agent) hit this same issue again?
2. Is the solution non-obvious?
3. Is it specific enough to be actionable?

If not 3x YES, it doesn't belong in knowledge base.

### Good Examples

✅ **"GitHub webhooks to our staging environment can be delayed 5-30 seconds"**
- Specific to our setup
- Non-obvious (seems like a bug at first)
- Other agents will encounter this

✅ **"Use InternalID not CustomerID - customers can merge and IDs change"**
- Critical business logic
- Non-obvious from database schema
- Prevents data integrity issues

### Bad Examples

❌ **"Always handle errors properly"**
- Too general
- Obvious
- Not actionable

❌ **"React components should be optimized"**
- Role-specific (belongs in Developer agent memory)
- Vague
- Not project-specific

## Search Strategy

Keep it simple:
1. **Filename convention**: `YYYY-MM-DD-brief-slug.md`
2. **Categories**: decision, gotcha, convention (that's all)
3. **Search**: grep/ripgrep through entries
4. **Index**: README.md with one-line summaries

## Maintenance

- Review monthly: Archive entries that haven't helped anyone
- When updating systems (e.g., React version), check if gotchas still apply
- If an entry is wrong, update it or delete it

## Success Criteria

We'll know this is working when:
- Agents say "Good thing I checked team knowledge!"
- We see the same knowledge helping multiple agents
- Time saved > time spent maintaining it

## Anti-Patterns to Avoid

❌ Complex scoring systems
❌ Automatic anything (let agents use judgment)
❌ Duplicate information from docs
❌ Theoretical or "might be useful" entries
❌ Over-categorization

## Implementation Steps

1. Create the directory structure
2. Add first 3-5 entries from real issues
3. Tell agents it exists
4. See if they use it
5. Iterate based on actual usage

## Why This Design

- **Two-tier system**: Clear boundaries prevent confusion about where knowledge belongs
- **Simple**: Can start using today with just mkdir and vim
- **Practical**: Solves real problem (redundant discovery)
- **Evolvable**: Can add features if needed, but doesn't require them
- **Low overhead**: No tokens wasted on metadata
- **Trust through transparency**: Entries show who discovered them and when
- **Role preservation**: Agent knowledge survives reinitialization

## Future Considerations (Only If Needed)

If this proves valuable, we might add:
- Tags for better search
- "This helped me" feedback mechanism
- Automated staleness warnings

But not until we prove the basic concept works.

## Integration with Existing Memory System

The knowledge base complements but doesn't replace the existing memory system:

### Memory System (Existing)
- **MEMORY.md**: Patterns, preferences, approaches
- **context/latest.md**: Current work state
- **Purpose**: Learning and continuity

### Knowledge Base (New)
- **knowledge/*.md**: Specific facts and solutions
- **Purpose**: Reference and discovery

### Example Distinction

**Goes in MEMORY.md:**
"I've learned that Jake prefers git commits at the start of responses"

**Goes in Knowledge Base:**
"Git commit hook fails with error 'missing semicolon' - fix by adding ; to line 45 of .githooks/pre-commit"

## Conclusion

This design creates a practical two-tier knowledge system that:
- Preserves role-specific knowledge across agent instances
- Shares team-wide discoveries efficiently
- Maintains clear boundaries with existing memory system
- Can be implemented immediately with basic tools
- Evolves based on real usage, not speculation

The agent-specific knowledge directories ensure that each role builds its own expertise library while the team knowledge prevents everyone from solving the same problems repeatedly.