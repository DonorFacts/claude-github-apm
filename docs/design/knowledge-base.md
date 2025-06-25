# Team Knowledge Base - Design Document

## Executive Summary

This document outlines the design for a shared knowledge repository system that enables APM agents to capture, share, and discover cross-cutting knowledge. The system prevents redundant problem-solving while maintaining token efficiency through smart retrieval and quality curation.

## Problem Statement

Currently, agents working on the same project cannot learn from each other's discoveries:
- Developer-1 spends 2 hours debugging a webhook race condition
- Developer-2 encounters the same issue 3 weeks later and repeats the investigation
- Architectural decisions lack persistent rationale
- Project-specific gotchas remain undocumented

This results in:
- Wasted time on redundant discoveries
- Repeated mistakes
- Loss of institutional knowledge between agent sessions
- Inconsistent approaches to solved problems

## Design Principles

1. **Quality Over Quantity** - Better to have 10 valuable entries than 1000 mediocre ones
2. **Progressive Complexity** - Start simple, evolve based on proven needs
3. **Token Efficiency** - Load only relevant knowledge, not entire repository
4. **Clear Boundaries** - Distinct separation between team knowledge and agent memory
5. **Evidence-Based** - All knowledge must be verifiable and specific
6. **Decay-Aware** - Different knowledge types have different lifespans

## Architecture Overview

### Storage Structure

```
[project-root]/
├── project/team-knowledge/          # Project-specific knowledge
│   ├── entries/
│   │   ├── YYYY-MM-DD-slug.md     # Individual knowledge entries
│   │   └── ...
│   ├── index.json                  # Searchable metadata
│   ├── categories.json             # Category definitions
│   └── stats.json                  # Usage statistics
│
└── apm/shared-knowledge/           # Framework-wide knowledge (future)
    └── [similar structure]
```

### Knowledge Entry Structure

```markdown
# [Brief Descriptive Title]

**ID**: YYYY-MM-DD-slug
**Category**: architecture|gotcha|pattern|convention|workaround
**Confidence**: 0.6-1.0
**Decay Type**: permanent|version-dependent|temporal
**Affects**: [agent-roles]
**Tags**: [searchable, keywords]
**Contributed By**: [agent-role]
**Verified Date**: YYYY-MM-DD
**Evidence**: [link to PR/issue/test]

## Summary
One-sentence explanation of the key insight.

## Context
When and why this knowledge applies.

## Details
Full explanation with examples and evidence.

## Action Items
- What to do when encountering this situation
- What to avoid

## Verification
How to verify this knowledge is still accurate.
```

### Metadata Index Structure

```json
{
  "version": "1.0",
  "last_updated": "2024-01-20T10:30:00Z",
  "entries": [
    {
      "id": "2024-01-15-webhook-delays",
      "title": "GitHub Webhook Delivery Delays",
      "category": "gotcha",
      "tags": ["github", "webhook", "async", "delays"],
      "summary": "Webhooks can lag 5-30s during high load",
      "confidence": 0.85,
      "decay_type": "temporal",
      "contributed_by": "scrum-master",
      "verified_date": "2024-01-15",
      "affects": ["scrum-master", "developer"],
      "access_count": 12,
      "helpful_votes": 10,
      "not_helpful_votes": 2
    }
  ]
}
```

## Core Features

### 1. Scope Management

**Phase 1: Project-Specific Only**
- Knowledge that applies to the current project
- Stored within project directory
- Examples:
  - "Our app uses cents for monetary values"
  - "CustomerID can change during mergers"
  - "Staging webhooks have delays"

**Future Phase: Framework-Wide**
- Knowledge that applies across all projects
- Stored in APM directory
- Examples:
  - "Claude Code bash escape patterns"
  - "GitHub API rate limit strategies"

### 2. Discovery Mechanisms

**Active Search (Phase 1)**
```bash
# Command-line search
search-knowledge "webhook delay"
search-knowledge --category gotcha --tags github

# Programmatic search
const results = await searchKnowledge({
  keywords: ['payment', 'decimal'],
  category: 'architecture'
});
```

**Passive Surfacing (Future)**
```typescript
// Agent emits intent
emitIntent('implementing-payment-processing');

// System checks for relevant knowledge
// Returns: "⚠️ Found relevant knowledge: Always store money in cents"
```

### 3. Lifecycle Management

**Decay Types and Policies**

| Decay Type | Examples | Review Cycle | Auto-Archive |
|------------|----------|--------------|--------------|
| permanent | Architectural decisions | Never | Never |
| version-dependent | API quirks, framework bugs | On version change | After 2 major versions |
| temporal | Recent observations | Monthly | 90 days without access |

**Staleness Indicators**
```json
{
  "verified_date": "2024-01-15",
  "last_accessed": "2024-02-01",
  "relevance_score": 0.65,  // Decreases over time
  "status": "active|stale|archived"
}
```

### 4. Trust and Verification

**Confidence Scoring**
```
Initial confidence:
- Manager/Architect contribution: 0.8
- Other agents: 0.6
- External documentation reference: +0.1
- Linked evidence (PR/issue): +0.1

Ongoing adjustments:
- Helpful vote: +0.02 (max 1.0)
- Not helpful vote: -0.05
- Time decay: -0.01/month for temporal
- Verification by different agent: +0.05
```

**Trust Thresholds**
- `>= 0.8`: Trusted (shown prominently)
- `0.4-0.79`: Provisional (shown with caveat)
- `< 0.4`: Archived (hidden unless specifically requested)

## Implementation Phases

### Phase 1: Manual System (Week 1-2)
- Markdown files with consistent format
- Basic bash search command
- Manual quality review
- Prove value with 10-20 entries

### Phase 2: Indexed Search (Week 3-4)
- JSON metadata index
- Semantic search function
- Usage tracking
- Basic confidence scoring
- Agent command integration

### Phase 3: Smart Retrieval (Week 5-6)
- Context-aware loading
- Relevance scoring
- Auto-archival rules
- Performance optimization

### Phase 4: Advanced Features (Future)
- Passive discovery
- Cross-project knowledge
- Knowledge graph visualization
- ML-powered relevance

## API Design

### Core Functions

```typescript
interface KnowledgeAPI {
  // Search and retrieval
  search(query: SearchQuery): Promise<KnowledgeEntry[]>;
  getEntry(id: string): Promise<KnowledgeEntry>;
  getRelevant(context: AgentContext): Promise<KnowledgeEntry[]>;
  
  // Contribution
  contribute(entry: NewKnowledgeEntry): Promise<ValidationResult>;
  update(id: string, updates: Partial<KnowledgeEntry>): Promise<void>;
  
  // Feedback
  markHelpful(id: string, agentId: string): Promise<void>;
  markNotHelpful(id: string, agentId: string, reason?: string): Promise<void>;
  verify(id: string, agentId: string): Promise<void>;
  
  // Maintenance
  archiveStale(): Promise<number>;
  exportKnowledge(): Promise<KnowledgeExport>;
}
```

### Search Query Interface

```typescript
interface SearchQuery {
  keywords?: string[];
  category?: Category;
  tags?: string[];
  affects?: string[];
  minConfidence?: number;
  includeArchived?: boolean;
  limit?: number;
}
```

## Workflow Examples

### Example 1: Contributing Knowledge

```bash
# Developer discovers webhook delays
contribute-knowledge
> Title: GitHub Webhook Delivery Delays
> Category: gotcha
> Summary: Webhooks to staging can lag 5-30s during high load
> Details: [provides full context]
> Evidence: https://github.com/org/repo/issues/234
> Tags: github, webhook, async, staging

# System validates and adds to knowledge base
✅ Knowledge contribution added (confidence: 0.7)
```

### Example 2: Discovering Relevant Knowledge

```bash
# QA Engineer working on payment tests
search-knowledge "payment decimal money"

Found 2 relevant entries:
1. ⭐ 0.92 - Always Store Money in Cents (architecture)
   "Prevents floating point precision errors"
   
2. ⭐ 0.78 - Payment Gateway Timeout Handling (pattern)
   "Implement idempotency keys for retries"
```

### Example 3: Knowledge Decay

```bash
# Automated monthly review
review-stale-knowledge

Temporal entries requiring review:
- "API Endpoint Flaky" - Last verified 67 days ago
- "Webpack Build Slow" - No access in 45 days

Version-dependent entries:
- "React 17 Hydration Bug" - React now at v18
```

## Quality Guidelines

### What Makes Good Knowledge

✅ **Specific**: "GitHub webhooks to staging lag 5-30s under load"
❌ **Vague**: "Webhooks can be slow sometimes"

✅ **Actionable**: "Use cents for money: amount_cents = Math.round(dollars * 100)"
❌ **Theoretical**: "Be careful with decimal numbers"

✅ **Evidenced**: "Discovered in issue #234 when payments showed $99.98 as $99.97"
❌ **Anecdotal**: "I think I saw this happen once"

✅ **Scoped**: "Affects payment processing in our checkout flow"
❌ **Overgeneralized**: "Always important everywhere"

### Review Checklist

Before accepting a contribution:
- [ ] Is it specific enough to be actionable?
- [ ] Does it include evidence or reproduction steps?
- [ ] Is it clearly categorized?
- [ ] Are the affected agents identified?
- [ ] Does it duplicate existing knowledge?
- [ ] Will it remain relevant for >30 days?

## Success Metrics

### Quantitative
- Time saved per prevented issue (target: 30+ minutes)
- Knowledge reuse rate (target: >3 accesses per entry)
- Search success rate (target: >80% find relevant entry)
- Contribution quality rate (target: >60% accepted)

### Qualitative
- Agents report finding helpful knowledge
- Reduced duplicate problem-solving
- Improved consistency across agent approaches
- Preserved institutional knowledge

## Risks and Mitigations

### Risk 1: Knowledge Sprawl
**Mitigation**: Strict quality bar, regular pruning, decay policies

### Risk 2: Token Overhead
**Mitigation**: Smart loading, relevance scoring, summary-first approach

### Risk 3: Stale Information
**Mitigation**: Decay types, verification dates, active review cycles

### Risk 4: Poor Discoverability  
**Mitigation**: Rich tagging, semantic search, suggested keywords

### Risk 5: Duplicate Entries
**Mitigation**: Similar entry detection during contribution

## Future Enhancements

1. **Knowledge Graph** - Visualize relationships between entries
2. **Auto-Extraction** - Detect knowledge from agent conversations
3. **Cross-Project Patterns** - Identify common issues across projects
4. **Knowledge Synthesis** - Combine related entries into best practices
5. **Export/Import** - Share knowledge between teams

## Conclusion

This design provides a structured approach to team knowledge sharing that:
- Starts simple with manual curation
- Scales intelligently with smart retrieval
- Maintains quality through verification
- Respects token constraints
- Enables true team learning

The phased implementation allows us to prove value quickly while building toward a sophisticated knowledge management system that makes the entire agent team more effective.