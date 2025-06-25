# Team Knowledge Base - Technical Design

## Overview

A shared, searchable repository of cross-cutting knowledge that benefits the entire agent team while avoiding token waste through smart retrieval.

## Architecture

### Storage Structure

```
apm/team-knowledge/
├── entries/
│   ├── 2024-01-15-webhook-delays.md
│   ├── 2024-01-16-monetary-cents-decision.md
│   └── 2024-01-18-auth-token-refresh-pattern.md
├── index.json                 # Searchable metadata
├── categories.md             # Category definitions
└── search-cache.json         # Recent search results
```

### Index Structure

```json
{
  "entries": [
    {
      "id": "2024-01-15-webhook-delays",
      "title": "GitHub Webhook Delivery Delays",
      "category": "gotcha",
      "affects": ["scrum-master", "developer"],
      "tags": ["github", "webhook", "performance", "async"],
      "summary": "Webhooks can lag 5-30s during high load",
      "relevance_score": 0.85
    }
  ]
}
```

## Smart Retrieval System

### 1. Contextual Loading

Instead of loading all knowledge, agents load based on:
- Current task domain
- Recent errors encountered  
- Explicit search queries

```typescript
// Pseudocode for selective loading
async function loadRelevantKnowledge(context: AgentContext) {
  const keywords = extractKeywords(context.currentTask);
  const relevantEntries = await searchKnowledgeBase(keywords);
  
  // Load only high-relevance entries
  return relevantEntries.filter(e => e.relevance_score > 0.7);
}
```

### 2. Progressive Disclosure

Knowledge loads in tiers:
1. **Tier 1**: Summaries only (low token cost)
2. **Tier 2**: Full entry if agent needs details
3. **Tier 3**: Related entries if deep diving

### 3. Usage Tracking

Track which knowledge is actually useful:

```json
{
  "entry_id": "2024-01-15-webhook-delays",
  "access_count": 12,
  "helpful_count": 10,
  "last_accessed": "2024-02-01",
  "accessing_agents": ["scrum-master", "developer-1"]
}
```

## Integration Points

### 1. During Agent Initialization

```markdown
Loading role-specific team knowledge...
Found 3 relevant entries for Developer role:
- Auth token refresh pattern (gotcha)
- Monetary values in cents (architecture)
- Test database isolation (best-practice)
```

### 2. On Error/Confusion

```typescript
// Agent hits unexpected error
if (error.type === 'unexpected') {
  const knowledge = await searchTeamKnowledge(error.context);
  if (knowledge.found) {
    console.log(`💡 Team knowledge: ${knowledge.summary}`);
  }
}
```

### 3. Before Major Decisions

```markdown
Agent: "Before implementing payment processing, let me check team knowledge..."
[Searches: "payment", "money", "decimal", "float"]
Found: "Always store monetary values in cents (architecture decision #234)"
```

## Quality Control Mechanisms

### 1. Contribution Review

- New entries tagged as `pending-review`
- Senior agents (Manager, Architect) review monthly
- Stale entries archived after 6 months of no access

### 2. Relevance Decay

```typescript
// Entries lose relevance over time if not accessed
function calculateRelevance(entry: KnowledgeEntry): number {
  const ageFactor = getAgeFactor(entry.created);
  const usageFactor = getUsageFactor(entry.accessCount);
  const helpfulFactor = entry.helpfulCount / entry.accessCount;
  
  return (ageFactor * 0.3) + (usageFactor * 0.4) + (helpfulFactor * 0.3);
}
```

### 3. Duplicate Detection

Before adding new knowledge:
```typescript
function checkDuplicates(newEntry: KnowledgeEntry): DuplicateCheck {
  const similar = findSimilarEntries(newEntry);
  if (similar.length > 0) {
    return {
      hasDuplicates: true,
      suggestion: 'Update existing entry instead',
      similar: similar
    };
  }
}
```

## Cost-Benefit Analysis

### Token Costs
- Index loading: ~200 tokens per agent init
- Relevant summaries: ~500 tokens per session
- Full entries on-demand: ~200-1000 tokens each

### Time Savings  
- Prevents rediscovering bugs: Hours per incident
- Shares architectural context: 30-60 min per decision
- Onboards new agents faster: 2-3x improvement

### ROI Calculation
```
Monthly token cost: ~50K tokens (assuming 10 agents, 20 sessions)
Monthly time saved: ~20 hours of redundant discovery
ROI: Extremely positive if knowledge is curated
```

## Implementation Priority

### Phase 1: Manual System
- Markdown files in team-knowledge/
- Manual search via grep
- Prove value before automation

### Phase 2: Indexed Search  
- JSON index with metadata
- Semantic search function
- Usage tracking

### Phase 3: Smart Loading
- Context-aware retrieval
- Relevance scoring
- Auto-archival

## Critical Success Factors

1. **Ruthless Curation** - Quality > Quantity
2. **Semantic Search** - Must find relevant knowledge quickly  
3. **Low Token Overhead** - Load only what's needed
4. **Clear Guidelines** - What belongs where
5. **Regular Pruning** - Remove stale knowledge

## Conclusion

The team knowledge base is valuable IF:
- We maintain high quality standards
- We implement smart retrieval (not bulk loading)
- We track actual usage and prune accordingly
- We solve the categorization problem clearly

Without these safeguards, it becomes an expensive distraction. With them, it's a force multiplier for team learning.