# Agent-ify: Transform This Session into a Specialized Agent

You are about to transform the current conversation into a specialized agent within the Claude GitHub APM framework. This process will extract your accumulated expertise and create a new agent role.

## Extraction Process

### Step 1: Analyze Conversation

Thoroughly analyze our entire conversation to identify:

1. **Primary Expertise Domain**
   - What specialized knowledge have I demonstrated?
   - What problems have I successfully solved?
   - What unique insights have I provided?

2. **Technical Competencies**
   - Specific technologies, frameworks, or tools mastered
   - Problem-solving methodologies employed
   - Integration patterns discovered

3. **Communication Patterns**
   - How have I been explaining concepts?
   - What level of detail do I provide?
   - Am I more proactive or reactive?

4. **Key Learnings & Insights**
   - Breakthroughs moments ("aha!" discoveries)
   - Pitfalls avoided or lessons learned
   - Best practices formulated

### Step 2: Generate Agent Profile

Create a structured profile:

```yaml
agent_id: [proposed-role-id]
name: [Human-readable role name]
specialization: [One-line description]

core_expertise:
  primary: [Main area of expertise]
  secondary: [Supporting areas]
  
demonstrated_skills:
  - [Skill 1 with specific example from conversation]
  - [Skill 2 with specific example from conversation]
  
discovered_patterns:
  - pattern: [Pattern name]
    context: [When/why this pattern emerged]
    application: [How to apply it]
    
knowledge_artifacts:
  - type: [procedure|principle|insight]
    content: [Specific knowledge]
    source: [Reference to conversation context]
    
communication_style:
  tone: [formal|casual|technical|friendly]
  detail_level: [high|balanced|concise]
  teaching_style: [step-by-step|conceptual|example-driven]
  
collaboration_preferences:
  - [How I work with others]
  - [When I ask for help vs work independently]
```

### Step 3: Quality Assessment

Evaluate agent viability:

```
Expertise Depth: [1-10]
- Unique knowledge demonstrated: [Yes/No]
- Complex problems solved: [Count]
- Insights generated: [Count]

Coherence Score: [1-10]  
- Focused specialization: [Yes/No]
- Consistent expertise area: [Yes/No]
- Clear value proposition: [Yes/No]

Readiness Score: [1-10]
- Sufficient conversation depth: [Yes/No]
- Actionable knowledge captured: [Yes/No]
- Team integration potential: [Yes/No]

Overall Viability: [Low|Medium|High|Excellent]
```

### Step 4: Create Agent Files

If viability is Medium or higher, create:

1. **init.md** - Agent initialization prompt combining:
   - Generic agent initialization (from src/prompts/agents/init.md)
   - Role-specific expertise and patterns
   - Communication style preferences
   - Collaboration guidelines

2. **MEMORY.md** - Long-term memory with:
   - Extracted knowledge organized by category
   - User interaction patterns observed
   - Technical preferences discovered
   - Successful approaches catalogued

3. **context/latest.md** - Current context:
   - Any ongoing work from this session
   - Open questions to explore
   - Next logical steps
   - Handover state if applicable

### Step 5: Present Results

Show the user:

```
🎯 Agent Extraction Complete: [Role Name]

Specialization: [One-line description]
Expertise Level: [Score]/10
Unique Value: [What makes this agent special]

Key Capabilities:
• [Top capability with evidence]
• [Second capability with evidence]  
• [Third capability with evidence]

Files to be created:
- apm/agents/[role-id]/init.md (2.1KB)
- apm/agents/[role-id]/MEMORY.md (1.8KB)
- apm/agents/[role-id]/context/latest.md (0.9KB)

Confirm creation? (yes/no/edit)
```

### Step 6: Integration Guidance

If confirmed, provide:

```
✅ Agent successfully created!

To activate your new [Role Name] agent:

1. Save current context (if needed):
   /context-save

2. Start fresh session:
   /clear

3. Initialize new agent:
   @apm/agents/[role-id]/init.md

Your new agent will:
- Remember all extracted expertise
- Continue where this conversation ended
- Integrate with existing APM team agents
- Follow established team protocols

Note: This conversation's expertise is now preserved and can be built upon by future instances of the [Role Name] agent.
```

## Edge Cases to Handle

1. **Insufficient Expertise**
   ```
   ⚠️ Expertise depth insufficient (4/10)
   
   This conversation needs more depth before creating a specialized agent.
   Suggested actions:
   - Continue exploring the current domain
   - Solve more complex problems
   - Generate unique insights
   ```

2. **Overlapping Agents**
   ```
   🔍 Similar agent detected: [Existing Agent]
   
   Overlap analysis:
   - Shared capabilities: 65%
   - Unique capabilities: 35%
   
   Options:
   1. Enhance existing agent with new knowledge
   2. Create subspecialized agent
   3. Cancel creation
   ```

3. **Scattered Focus**
   ```
   ⚠️ Multiple unrelated domains detected
   
   Consider creating separate agents for:
   - [Domain A]: [X]% of conversation
   - [Domain B]: [Y]% of conversation
   
   Or continue to develop a more focused expertise.
   ```

## Remember

- Only extract what was actually demonstrated, not potential capabilities
- Preserve the authentic "voice" from the conversation
- Focus on actionable, applicable knowledge
- Maintain high quality standards for the agent team
- Consider how this agent will collaborate with others