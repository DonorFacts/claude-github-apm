# Claude GitHub APM Framework

> 🚀 Enterprise-ready Agentic Project Management for Claude Code with GitHub-native workflows

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Compatible-purple)](https://claude.ai/code)

## 🎯 What is Claude GitHub APM?

Claude GitHub APM transforms the original [Agentic Project Management (APM)](https://github.com/sdi2200262/agentic-project-management) framework into a **GitHub-native**, **enterprise-ready** system that seamlessly scales from solo developers to large teams.

### Key Enhancements Over Original APM

| Feature                | Original APM         | Claude GitHub APM                |
| ---------------------- | -------------------- | -------------------------------- |
| **Project State**      | Local markdown files | GitHub issues, PRs, and commits  |
| **Progress Tracking**  | Manual updates       | Automated GitHub project boards  |
| **Agent Coordination** | File-based handovers | GitHub-native workflows          |
| **Scalability**        | Limited by context   | Unlimited via GitHub             |
| **Integration**        | Standalone           | Full Claude Code CLI integration |

## ✨ Features

### 🏗️ Build-Time Prompt Enhancement

- Transforms APM prompts with GitHub context at build time
- Injects issue hierarchies, PR workflows, and team conventions
- Maintains compatibility with original APM structure

### 🔗 GitHub-Native Integration

- **Custom Issue Types**: Phase → Project → Epic → Feature → Task/Bug
- **Automated Workflows**: Issue creation from Implementation Plans
- **Smart Commits**: Structured messages that update issue states
- **Project Boards**: Visual progress tracking and burndown

### 🤖 Enhanced Agent Roles

- **Manager Agent**: GitHub-aware project orchestration
- **Scrum Master**: Automated issue and sprint management
- **Prompt Engineer**: Optimized prompts for Claude Code
- **Implementation Agents**: Git-integrated development workflows

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

### Issue Hierarchy

```
Phase (Strategic Milestone - Quarters)
└── Project (Major Initiative - Weeks)
    └── Epic (Feature Set - Days)
        └── Feature/Task/Bug (Atomic Work - Hours)
```

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
