# Claude GitHub APM - Project Context

## Project Focus

Claude GitHub APM is a **multi-agent coordination framework** for running professional product management and software engineering operations. The system orchestrates specialized AI agents to work as a cohesive team, following established PM/SWE best practices.

## Core Objectives

1. **Multi-Agent Orchestration**

   - Coordinate specialized agents (Manager, Scrum Master, Developers, QA, etc.)
   - Enable seamless handoffs between agents
   - Maintain quality through agent specialization

2. **Professional PM/SWE Practices**

   - Implement real-world methodologies (Agile, Scrum, Kanban)
   - Follow established software development lifecycle patterns
   - Maintain professional documentation and communication standards

3. **Flexible Integration**

   - Currently implemented with GitHub for issue tracking
   - Architecture supports any tracking system (Jira, Linear, etc.)
   - Not locked to specific tools - focus on workflows

4. **Enterprise Scalability**
   - Handle projects from simple features to complex multi-phase initiatives
   - Support team collaboration patterns
   - Maintain audit trails and compliance readiness

## Key Principles

- **Agents are Team Members**: Each agent role represents a professional on a software team
- **Memory Enables Learning**: Three-tier memory system helps agents improve over time
- **External State Management**: Use GitHub/Jira/etc for state, not conversation context
- **Automation with Oversight**: Agents work autonomously but with clear checkpoints

## Project Structure

- `src/prompts/agents/` - Agent initialization and command prompts
- `apm/agents/<role>/` - Agent-specific memory and context
- `docs/` - Technical documentation and designs
- `scripts/` - Utilities and tools
- `.claude/commands/` - CLI integration (future)

## Current Development Focus

The project is actively developing:

- Agent coordination mechanisms
- Session monitoring for multi-agent visibility
- GitHub integration for issue/PR management
- Memory system improvements

## Commands

If the User provides you with just a file reference and no other information, then you should read the file and presume it contains a specific prompt or instructions from the User for you to follow.
