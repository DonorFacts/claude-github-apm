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

### 🤖 Multi-Agent Architecture

**Enterprise Security**: All agents run in a shared Docker container with `--dangerously-skip-permissions` safely contained within security boundaries.

**Single-Container Architecture**: One persistent container serves all agents and worktrees:
- Automatic container creation on first `pnpm claude` usage
- Shared resources reduce overhead and complexity
- Dynamic user mapping - runs as your host user (not root)
- Health monitoring with auto-restart capabilities

**Multi-Agent Collaboration**: Agents can coordinate across worktrees with shared access to:
- Main branch for architectural context
- All worktrees for cross-team coordination  
- Shared APM memory system for handoffs and knowledge transfer
- Real-time inter-agent communication through secure filesystem mounts

#### Specialized Agent Roles

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
- **Docker Desktop** for container security (`docker --version`)
  - Required for safe `--dangerously-skip-permissions` execution
  - Enables multi-agent collaboration with enterprise security
  - Container auto-starts when you run `pnpm claude`

### GitHub Bot Account Setup (Recommended)

For enhanced security, Claude agents can use a dedicated bot account that prevents unauthorized access to your main branch. The system gracefully falls back to your personal credentials with appropriate warnings if no bot account is configured.

**Quick Setup:**
1. Create bot account with email alias: `your-email+bot@gmail.com`
2. Generate Personal Access Token with `repo` and `workflow` scopes
3. Set environment variable: `export GITHUB_BOT_TOKEN="<token>"`

**What this achieves:**
- ✅ Your commits in main: `your-email@gmail.com`
- ✅ Bot commits in worktrees: `your-email+bot@gmail.com`  
- ✅ Bot cannot push to main (blocked by branch rulesets)
- ✅ Clear audit trail of human vs automated changes

**Complete Guide:** See [GitHub Bot Account Setup](docs/github-bot-account.md) for detailed instructions, security model, and troubleshooting.

### Installation

TBD

### Configure Security Level (Optional)

Choose your security posture based on environment:

```bash
# Development (default) - Full compatibility
export APM_SECURITY_LEVEL=standard

# Production - Firewall with domain whitelist  
export APM_SECURITY_LEVEL=restricted

# Maximum Security - No network access
export APM_SECURITY_LEVEL=maximum
```

See [Docker Security Guide](docs/docker-usage.md) for detailed configuration.

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
# Initialize Manager Agent (automatically containerized)
claude --apm manager init

# The Manager will guide you through:
# - Project discovery
# - Implementation planning
# - GitHub integration setup
# - Agent task assignment
```

**Security**: All agents run in a shared Docker container with `--dangerously-skip-permissions` safely contained.

### Docker Container Management

The APM framework uses a single persistent Docker container for all agents:

```bash
# Start Claude (container auto-creates if needed)
pnpm claude

# Container management commands (optional)
pnpm container:status   # Check if container is running
pnpm container:stop     # Stop when done for the day
pnpm container:logs     # Debug any issues
```

The container:
- **Auto-starts** when you run `pnpm claude`
- **Persists** between sessions (restart-unless-stopped policy)
- **Shares** resources across all agents and worktrees
- **Maps** your user ID to avoid permission issues

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

### Container Audio & Speech Notifications

The framework provides two notification methods for Claude Code running in Docker containers:

#### 1. **Notify_Jake** - Sound Notifications
- **Purpose**: Quick audio feedback when tasks complete
- **Sound**: Plays the macOS Hero.aiff sound
- **When to use**: Task completion, build success, test completion
- **Setup**: Run `./.local/bin/host-sound-daemon.sh` on host

#### 2. **say-from-container.sh** - Speech Synthesis  
- **Purpose**: Detailed spoken feedback and updates
- **When to use**: 
  - Explaining complex errors or results
  - Providing progress updates on long-running tasks
  - Delivering important warnings or alerts
  - Making jokes to lighten the mood 😄
- **Setup**: Run `./.local/bin/host-speech-daemon.sh` on host
- **Usage**: `./local/bin/say-from-container.sh "Your message here"`

#### Notification Guidelines
- Use **Notify_Jake** for simple "done" signals
- Use **speech** for messages that need attention or contain information
- Both work seamlessly from within Docker containers while maintaining security
- Host daemons process notification queues without exposing audio hardware to containers

## 🛠️ Development Tool Organization

This project uses the **`.dev.ext` naming convention** for debugging and development tools, providing clear separation from production framework code.

**Quick examples:**
- `apm-container.dev.ts` - Advanced container management with health monitoring
- `claude-container` - Simple production wrapper for daily use

**When to use `.dev.ext`:**
- Debugging utilities and diagnostic tools
- Enhanced versions of existing production tools  
- Development workflow helpers

**Alternative patterns:** `.test.ext` (testing), `.config.ext` (configuration), `tools/` (standalone utilities), `scripts/` (build/deployment)

**Complete guide:** See [Development Tool Organization](docs/debugging-tools.md) for decision frameworks, agent guidelines, and integration patterns.

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
