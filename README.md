# Claude GitHub APM Framework

> 🚀 Multi-agent coordination system for running professional product management and software engineering operations

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-purple)](https://claude.ai/code)

## 🎯 What is Claude GitHub APM?

Claude GitHub APM is a **multi-agent project management framework** that coordinates specialized AI agents to perform the full range of activities found in professional product management and software engineering departments. It transforms the original [Agentic Project Management (APM)](https://github.com/sdi2200262/agentic-project-management) framework into an **enterprise-ready** system that follows established PM/SWE best practices.

### Core Value Proposition

- **Multi-Agent Operations**: Orchestrates specialized agents (Manager, Scrum Master, Developers, QA, etc.) to work as a cohesive team
- **Professional Methodologies**: Implements real-world PM/SWE practices (Agile, Scrum, issue tracking, code reviews)
- **Flexible Integration**: Currently uses GitHub for tracking, but architecture supports Jira, Linear, or other systems
- **Scalable Coordination**: Handles everything from simple features to complex, multi-phase projects

## ✨ Features

### 🤝 Multi-Agent Coordination

- **Specialized Roles**: Each agent has distinct responsibilities and expertise
- **Seamless Handoffs**: Agents pass work between each other using shared memory and tracking systems
- **Quality Gates**: Built-in review and validation between agent activities
- **Continuous Learning**: Agents improve through memory accumulation

### 🏗️ Professional PM/SWE Practices

- **Project Planning**: Implementation Plans, technical specs, architecture docs
- **Issue Management**: Hierarchical tracking (Phase → Project → Epic → Feature → Task/Bug)
- **Development Workflow**: Feature branches, code reviews, testing, documentation
- **Progress Visibility**: Real-time status updates and milestone tracking

### 🔗 Flexible Integration (Currently GitHub)

- **Issue Tracking**: Create and manage issues programmatically
- **Code Management**: Smart commits that reference and update issues
- **Project Boards**: Visual progress tracking and sprint management
- **Extensible**: Architecture supports swapping GitHub for Jira, Linear, etc.

### 🤖 Enhanced Agent Roles

Each agent role has specialized capabilities and maintains its own memory:

- **Manager Agent** (`manager`): Creates Implementation Plans, orchestrates work, reviews results
- **Scrum Master** (`scrum-master`): Converts plans to GitHub issues, manages sprints
- **Prompt Engineer** (`prompt-engineer`): Creates and optimizes agent prompts
- **Developer Agents** (`developer`): Implement features with tests and docs
- **QA Engineer** (`qa-engineer`): Comprehensive testing and validation
- **Documentation Writer** (`documentation`): Technical docs and user guides

### 🎯 Ad Hoc Agent Creation

Transform any expertise-rich Claude Code session into a specialized agent! As you work through complex problems and develop deep knowledge, you can crystallize that expertise into a reusable agent role.

```bash
# After developing expertise in a conversation:
/agent-ify <role-name>

# The system will:
# 1. Analyze conversation for expertise patterns
# 2. Extract core competencies and insights  
# 3. Create a new specialized agent with your knowledge
# 4. Preserve your working style and communication patterns
```

This enables **organic agent development** where expertise emerges through real problem-solving rather than pre-planning. Your ad hoc agents integrate seamlessly with the existing team structure, complete with:

- Specialized initialization prompt based on extracted expertise
- Long-term memory pre-populated with discovered best practices
- Context awareness of pitfalls and constraints encountered
- Your unique problem-solving approach and communication style

**Example**: After a deep debugging session on React performance, create a Performance Specialist agent that remembers your profiling techniques, common bottleneck patterns, and optimization strategies.

### 🛠️ Professional CLI

- Built on Anthropic's Claude Code SDK
- Interactive workflows for complex operations
- Seamless `.claude/commands/` integration
- TypeScript with full type safety

### 📦 Enterprise Features

- **Multi-repo support**: Coordinate across repositories
- **Team permissions**: GitHub-based access control
- **Audit trails**: Complete history in git
- **Compliance ready**: All decisions tracked

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- Claude Code installed globally
- GitHub CLI (`gh`) authenticated
- Active GitHub repository

### Installation

TBD

### Initialize APM in Your Project

```bash
# Run in your project root
claude-github-apm init

# This will:
# 1. Create .claude/commands/apm/ structure
# 2. Generate initial Implementation_Plan.md
# 3. Set up GitHub issue templates
# 4. Configure git commit conventions
```

### Start Your First APM Session

```bash
# Initialize Manager Agent
claude --apm manager init

# The Manager will guide you through:
# - Project discovery
# - Implementation planning
# - GitHub integration setup
# - Agent task assignment
```

## 📖 Core Concepts

### Agent Memory System

Claude GitHub APM uses a three-tier memory system that enables agents to learn and improve over time:

#### 1. **Long-Term Memory** (`apm/agents/<role>/MEMORY.md`)

- Captures enduring patterns, preferences, and principles
- Persists across Claude Code sessions
- Helps each agent role become more effective over time
- Automatically loaded when agents initialize

#### 2. **Short-Term Memory** (`apm/agents/<role>/context/`)

- Saves current work state and active tasks
- Enables seamless continuation after breaks
- Includes `latest.md` and timestamped archives
- Automatically loaded on agent initialization

#### 3. **Git History** (Project commits)

- Immutable record of all changes and decisions
- Tracked through structured commit messages
- Provides audit trail and project evolution

#### Knowledge Extraction from Conversations

The APM framework can analyze entire Claude Code sessions to extract:
- Domain expertise and technical skills demonstrated
- Successful approaches and best practices discovered
- Pitfalls encountered and lessons learned
- Communication patterns and problem-solving styles

This extracted knowledge becomes the foundation for new ad hoc agents, ensuring that valuable expertise developed during work sessions is never lost.

### Agent Initialization

When you start an agent in Claude Code:

```bash
# Example: Initialize Scrum Master
# The agent will automatically:
# 1. Read generic initialization instructions
# 2. Load any existing long-term memory
# 3. Check for saved context to continue work
# 4. Confirm readiness with current state

"Initialize as Scrum Master agent"
```

Agents handle their own memory - you don't need to manage it manually. They'll:

- Create memory files on first use
- Update learnings automatically during work
- Save context when you request it
- Alert you if approaching context limits

### VS Code Terminal Tab Naming

To see agent names in terminal tabs, add this to your VS Code settings:

```json
{
  "terminal.integrated.tabs.title": "${sequence}"
}
```

This allows agents to set their terminal tab title during initialization, making it easy to identify which agent is running in each terminal.

### Issue Hierarchy

```
Phase (Strategic Milestone - Quarters)
└── Project (Major Initiative - Weeks)
    └── Epic (Feature Set - Days)
        └── Feature/Task/Bug (Atomic Work - Hours)
```

### Context Management

Save your agent's work state at any time:

```bash
# Simple command to save current context
"save context"

# The agent will:
# - Save current work to context/latest.md
# - Create timestamped archive
# - Update long-term memory with new learnings
# - Confirm save completion
```

When Claude approaches context limits, agents will proactively alert you:

```
⚠️ I'm approaching context limits (noticing difficulty recalling earlier details)
Recommend completing current task then starting fresh instance
```

To continue after context reset:

1. Start a new Claude Code instance
2. Initialize the same agent role
3. Agent automatically loads memory and continues where left off

### Workflow Example

```bash
# 1. Manager creates Implementation Plan
claude --apm manager plan

# 2. Scrum Master converts to GitHub issues
claude --apm scrum create-issues

# 3. Implementation Agent works on task
claude --apm implement task-123

# 4. Automatic commit with issue tracking
git commit -m "feat: implement user auth

- Added JWT authentication
- Created login endpoint
- Added session middleware

Issues: #123 #120 #100 #10
Status: completed
Next: implement user profile"
```

## 🏗️ Architecture

### Build-Time Transformation

```
Original APM Prompts → Post-Processing → GitHub-Enhanced Prompts
                            ↓
                     GitHub Context
                     - Issue Types
                     - Team Config
                     - Conventions
```

### Runtime Integration

```
Claude Code ← → APM CLI ← → GitHub API
     ↓             ↓            ↓
  Agents      Commands      Issues/PRs
```

## 🧪 Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/claude-github-apm
cd claude-github-apm

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build project
pnpm build

# Link for local development
pnpm link
```

### Project Structure

TBD

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original [APM Framework](https://github.com/sdi2200262/agentic-project-management) by CobuterMan
- [Anthropic](https://anthropic.com) for Claude and Claude Code
- The open source community

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/@anthropic/claude-github-apm)
- [GitHub Repository](https://github.com/yourusername/claude-github-apm)
- [Issue Tracker](https://github.com/yourusername/claude-github-apm/issues)
- [Discussions](https://github.com/yourusername/claude-github-apm/discussions)

---

Built with ❤️ for the Claude Code community
