# Reflect on Conversation for Documentation Updates

## Purpose

Analyze the current conversation to identify significant features, patterns, or insights that should be captured in project documentation (README.md, docs/, etc.).

## Reflection Process

### Step 1: Conversation Analysis

Review our entire conversation and identify:

1. **New Features or Capabilities**
   - What new functionality was designed or implemented?
   - How does it enhance the project's value proposition?
   - What problems does it solve that weren't addressed before?

2. **Architectural Decisions**
   - What design patterns were introduced?
   - What trade-offs were discussed and resolved?
   - What principles guide the new additions?

3. **Differentiators**
   - What makes this unique in the agent framework space?
   - What competitive advantages were created?
   - What innovative approaches were taken?

4. **User-Facing Changes**
   - What new commands or workflows are available?
   - How does this change the user experience?
   - What new possibilities does this enable?

### Step 2: Documentation Impact Assessment

For each identified item, evaluate:

```yaml
significance: [high|medium|low]
audience: [users|developers|both]
documentation_location:
  - README.md: [if user-facing or major feature]
  - docs/: [if technical detail needed]
  - CHANGELOG.md: [if tracking versions]
placement_rationale: [why this location makes sense]
```

### Step 3: Generate Documentation Updates

Create proposed updates in this format:

```markdown
## Proposed README.md Updates

### New Section: [Section Name]
Location: [After/Before existing section]
Content:
[Proposed text that explains the feature/capability clearly and concisely]

### Update to Section: [Existing Section]
Reason: [Why this section needs updating]
Addition:
[New content to add]

## Proposed docs/ Updates

### New File: docs/[filename].md
Purpose: [What this document explains]
Outline:
- [Major topic 1]
- [Major topic 2]
- [etc.]
```

### Step 4: Significance Filtering

Only propose updates for items that:

1. **Add significant value** - Features that meaningfully enhance capabilities
2. **Change user workflow** - New ways of working with the framework
3. **Introduce new concepts** - Ideas that need explanation
4. **Differentiate the project** - Unique aspects worth highlighting

Skip items that are:
- Internal implementation details
- Minor optimizations
- Experimental ideas not yet validated
- Standard practices common to all agent frameworks

### Step 5: Present Recommendations

```
📚 Documentation Update Recommendations

Based on our conversation, I recommend updating:

1. **README.md**
   - [Feature/Section]: [One-line rationale]
   - Impact: [How this helps users]

2. **docs/[specific-file].md**  
   - Topic: [What needs documentation]
   - Reason: [Why separate doc needed]

3. **No updates needed for:**
   - [Topic]: [Why not significant enough]

Would you like me to proceed with these updates?
```

## Quality Checks

Before proposing updates, ensure:

- **Clarity**: Can a new user understand the feature from the description?
- **Accuracy**: Does it reflect what was actually built/designed?
- **Relevance**: Will users actually care about this?
- **Conciseness**: Is it explained as briefly as possible?
- **Integration**: Does it fit naturally with existing documentation?

## Example Output

```
📚 Documentation Update Recommendations

Based on our conversation about ad hoc agent creation:

1. **README.md**
   - New Feature Section: "Ad Hoc Agent Creation"
   - Impact: Users can transform any expertise-rich conversation into a reusable agent
   - Differentiator: Unique approach to organic agent development

2. **docs/ad-hoc-agents.md**
   - Topic: Technical details of the agent-ify process
   - Reason: Implementation details too verbose for README

3. **No updates needed for:**
   - Token optimization discussions: Internal concern, not user-facing

Proposed README addition:

### 🎯 Ad Hoc Agent Creation

Transform any Claude Code conversation into a specialized agent! As you work through complex problems and develop expertise, you can crystallize that knowledge into a reusable agent role.

```bash
# After developing expertise in a conversation:
/agent-ify <role-name>

# The system will:
# 1. Analyze conversation for expertise patterns
# 2. Extract core competencies and insights  
# 3. Create a new specialized agent
# 4. Preserve your working style and knowledge
```

This enables organic agent development - expertise emerges through real problem-solving, not pre-planning.
```

This reflection ensures valuable innovations are captured in user-facing documentation while maintaining focus on what truly matters to users.