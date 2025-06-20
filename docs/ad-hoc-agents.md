# Ad Hoc Agent Creation - Technical Guide

## Overview

The ad hoc agent creation system allows users to transform expertise-rich Claude Code sessions into specialized agents. This document provides technical details on how the system works and how to use it effectively.

## How Knowledge Extraction Works

### Expertise Pattern Recognition

The system analyzes conversations for specific indicators of expertise development:

```javascript
// Expertise indicators the system looks for:
const expertisePatterns = [
  /figured out that/,
  /the key insight is/,
  /after trying several approaches/,
  /the pattern here is/,
  /discovered that/,
  /learned that/,
  /best practice is/
];

// Confidence markers that strengthen expertise signals:
const confidenceMarkers = [
  "definitely",
  "always", 
  "never",
  "critical to",
  "essential for",
  "must"
];
```

### Quality Assessment Criteria

Before creating an agent, the system evaluates:

1. **Expertise Depth Score (1-10)**
   - Unique knowledge demonstrated
   - Complex problems solved
   - Insights generated
   - Minimum threshold: 6/10

2. **Coherence Score (1-10)**  
   - Focused specialization vs scattered topics
   - Consistent expertise area
   - Clear value proposition
   - Minimum threshold: 7/10

3. **Readiness Score (1-10)**
   - Sufficient conversation depth (10+ substantive exchanges)
   - Actionable knowledge captured
   - Team integration potential
   - Minimum threshold: 6/10

### Viability Scoring System

```yaml
Overall Viability = (Expertise + Coherence + Readiness) / 3

Ratings:
- Excellent: 8.5-10 → Create immediately
- High: 7.5-8.4 → Create with user confirmation
- Medium: 6.0-7.4 → Suggest continuing conversation
- Low: <6.0 → Not ready for agent creation
```

## Agent Profile Generation

### Competency Extraction

The system identifies demonstrated skills with specific evidence:

```yaml
demonstrated_skills:
  - skill: "React Performance Optimization"
    evidence: "Identified and fixed rendering bottlenecks in ProductList component"
    confidence: 0.9
  
  - skill: "Memory Profiling"
    evidence: "Used Chrome DevTools to track memory leaks"
    confidence: 0.85
```

### Best Practice Formulation

Discovered patterns are converted into actionable best practices:

```yaml
best_practices:
  - pattern: "Memoization Strategy"
    when: "Component has expensive calculations"
    how: "Use useMemo with proper dependency arrays"
    learned_from: "ProductList optimization (reduced renders by 80%)"
```

### Communication Style Preservation

The system captures how expertise was communicated:

```yaml
communication_style:
  tone: technical # formal|casual|technical|friendly
  detail_level: high # high|balanced|concise
  teaching_style: example-driven # step-by-step|conceptual|example-driven
  proactivity: balanced # highly-proactive|balanced|user-directed
```

## Integration with APM Framework

### Memory System Population

When creating an ad hoc agent:

1. **MEMORY.md** is pre-populated with:
   - Extracted patterns and principles
   - User interaction preferences observed
   - Technical approaches that worked
   - Pitfalls to avoid

2. **context/latest.md** captures:
   - Current work state from conversation
   - Open questions identified
   - Next logical steps
   - Any handover requirements

3. **init.md** combines:
   - Generic agent initialization requirements
   - Role-specific expertise and patterns
   - Communication style preferences
   - Integration guidelines

### Team Collaboration Setup

Ad hoc agents are configured to work with existing team members:

```markdown
## Working with Other Agents

Based on your expertise in [domain], you'll primarily collaborate with:

- **Developer Agents**: For implementation of [specific techniques]
- **QA Engineer**: To validate [specific quality aspects]
- **Manager Agent**: To report on [specific metrics]

Your unique value: [What you bring that others don't]
```

### Similarity Detection

Before creating a new agent, the system checks for overlap with existing agents:

```javascript
function checkAgentSimilarity(newProfile, existingAgents) {
  for (const agent of existingAgents) {
    const overlap = calculateCapabilityOverlap(newProfile, agent);
    
    if (overlap > 0.7) {
      return {
        similar: true,
        agent: agent.name,
        overlap: overlap,
        uniqueCapabilities: identifyUnique(newProfile, agent)
      };
    }
  }
  return { similar: false };
}
```

## Token Optimization Strategies

### Efficient Extraction

- **Sliding Window Analysis**: For long conversations, analyze in chunks with overlap
- **High-Signal Focus**: Prioritize segments with expertise indicators
- **Compression**: Convert verbose explanations to concise principles
- **Reference vs Repeat**: Link to conversation segments rather than duplicating

### Memory Efficiency

```markdown
Instead of:
"In message 47, we discovered that using useMemo..."

Use:
"Best Practice: useMemo for expensive calculations [Conv:47]"
```

## Usage Examples

### Example 1: Creating a Performance Specialist

After a session optimizing React performance:

```bash
/agent-ify react-performance-specialist

# System response:
🎯 Agent Extraction Complete: React Performance Specialist

Specialization: React rendering optimization and profiling
Expertise Level: 8.5/10
Unique Value: Deep knowledge of React DevTools profiling and memo strategies

Key Capabilities:
• Identify rendering bottlenecks using React Profiler
• Implement effective memoization strategies
• Optimize component hierarchies for performance

Files created successfully. Activate with:
@apm/agents/react-performance-specialist/init.md
```

### Example 2: Insufficient Expertise Warning

```bash
/agent-ify api-expert

# System response:
⚠️ Expertise depth insufficient (4/10)

This conversation needs more depth before creating a specialized agent.
Suggested actions:
- Solve more complex API integration challenges
- Develop patterns for error handling
- Build reusable authentication flows
```

### Example 3: Similar Agent Detection

```bash
/agent-ify database-optimizer

# System response:
🔍 Similar agent detected: Performance Engineer

Overlap analysis:
- Shared capabilities: 65%
- Unique capabilities: 35% (specifically database query optimization)

Options:
1. Enhance existing Performance Engineer with database expertise
2. Create subspecialized Database Performance agent
3. Cancel creation
```

## Future Enhancements

### Agent Evolution Commands (Planned)

```bash
# Merge two agents' expertise
/agent-merge performance-specialist react-expert

# Create learning relationship
/agent-apprentice senior-dev junior-dev

# Deepen expertise in specific area
/agent-specialize performance-specialist webgl-rendering
```

### Continuous Learning

- Agents created ad hoc can continue learning from new sessions
- Expertise scores update based on successful problem resolution
- Best practices evolve based on outcomes

## Best Practices for Users

1. **Develop Deep Expertise**: Work through complex problems thoroughly before creating an agent
2. **Maintain Focus**: Keep conversations centered on a coherent domain
3. **Document Insights**: Explicitly state learnings and patterns discovered
4. **Test Solutions**: Verify approaches work before encoding them in an agent
5. **Name Meaningfully**: Choose role names that clearly indicate the agent's specialty

## Troubleshooting

### Common Issues

1. **"Expertise insufficient" errors**
   - Continue working on more complex problems
   - Explicitly document patterns you discover
   - Ensure you're demonstrating unique knowledge

2. **"Multiple domains detected" warnings**
   - Focus on one specialty per conversation
   - Consider creating multiple specialized agents
   - Use clear domain boundaries

3. **"Similar agent exists" notifications**
   - Review existing agent capabilities
   - Consider enhancing vs creating new
   - Focus on truly unique expertise

## Conclusion

Ad hoc agent creation transforms Claude GitHub APM from a static team into a dynamically growing ecosystem of expertise. Each conversation has the potential to birth a new specialist, ensuring that hard-won knowledge is never lost and can be leveraged by the entire team.