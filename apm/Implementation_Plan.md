# Implementation Plan

Project Goal: Transform the original APM framework into a GitHub-native, enterprise-ready system with CLI capabilities, full TypeScript implementation, and seamless scaling from solo developers to enterprise teams.

## Phase 1: TypeScript Foundation & Core Infrastructure - Agent Group Alpha (Agent_TypeScript_Lead, Agent_Test_Engineer)

### Epic 1.1 - Agent_TypeScript_Lead: TypeScript Migration Setup
Objective: Convert the existing JavaScript codebase to strict TypeScript with proper typing and structure.

1. **Task**: Set up TypeScript configuration and build system.
   - Create `tsconfig.json` with strict mode enabled.
   - Configure path aliases for clean imports.
   - Set up build scripts for development and production.
   - Configure source maps for debugging.
2. **Task**: Migrate lib/create-command-files.js to TypeScript.
   - Define interfaces for PromptBuilder configuration.
   - Type all methods and parameters strictly.
   - Handle fs-extra types (install @types/fs-extra).
   - Ensure backward compatibility with existing functionality.
3. **Story**: Migrate all shell scripts to TypeScript.
   - Create TypeScript equivalents using child_process or execa.
   - Implement proper error handling and typing.
   - Add progress indicators for long-running operations.
   - Maintain script functionality while improving maintainability.
4. **Task**: Set up ESLint and Prettier for code quality.
   - Configure ESLint with TypeScript plugin.
   - Set up Prettier with team-standard formatting.
   - Add pre-commit hooks using husky.
   - Configure VS Code settings for consistency.

### Epic 1.2 - Agent_Test_Engineer: Testing Infrastructure Setup
Objective: Establish comprehensive testing framework following TDD principles.

1. **Task**: Set up Jest with TypeScript support.
   - Configure Jest for TypeScript transpilation.
   - Set up coverage reporting thresholds (aim for 80%+).
   - Configure test environments for Node.js.
   - Add test scripts to package.json.
2. **Task**: Create test structure and conventions.
   - Establish __tests__ directories alongside source files.
   - Define naming conventions (*.test.ts, *.spec.ts).
   - Create test utilities and helpers.
   - Document testing best practices in CONTRIBUTING.md.
3. **Task**: Write initial test suite for create-command-files.
   - Test PromptBuilder class initialization.
   - Test file transformation logic.
   - Test error handling scenarios.
   - Test GitHub context injection.
4. **Task**: Set up continuous integration testing.
   - Configure GitHub Actions for test runs.
   - Add test status badges to README.
   - Set up automated test reports in PRs.
   - Configure test caching for faster runs.

### Epic 1.3 - Agent_TypeScript_Lead: Build System for NPM Publishing
Objective: Create robust build system for npm/pnpm package distribution.

1. **Task**: Configure package.json for publishing.
   - Set proper package name (@anthropic/claude-github-apm).
   - Define entry points and exports.
   - Configure files array for published content.
   - Add keywords and metadata for discoverability.
2. **Task**: Create build pipeline for distribution.
   - Set up TypeScript compilation to dist/.
   - Bundle type definitions.
   - Create separate builds for CommonJS and ESM.
   - Implement tree-shaking optimizations.
3. **Task**: Implement post-install script system.
   - Create postinstall.js for consuming repos.
   - Generate .claude/commands/apm/ structure.
   - Copy transformed prompts to consumer's project.
   - Handle cross-platform compatibility.
4. **Task**: Set up local testing workflow.
   - Create npm link setup for development.
   - Add example consumer project for testing.
   - Document local development workflow.
   - Create scripts for simulating installation.

### Feature 1.4 - Agent_TypeScript_Lead: CLAUDE.md Integration System
Objective: Automatically update consuming repository's CLAUDE.md with APM framework usage information.

1. **Task**: Design CLAUDE.md detection and update system.
   - Search for CLAUDE.md in common locations (root, .claude/, docs/).
   - Create fallback to create CLAUDE.md if not found.
   - Design non-destructive append strategy.
   - Plan section markers for updates.
2. **Doc**: Create CLAUDE.md content templates.
   - Write APM framework introduction section.
   - Document available commands and workflows.
   - Add quick reference for agents.
   - Include troubleshooting tips.
3. **Task**: Implement update mechanism.
   - Build file detection algorithm.
   - Create content injection system.
     *Guidance: Use markers like <!-- APM-START --> to manage sections*
   - Implement rollback capability.
   - Add update tracking to prevent duplicates.
4. **Task**: Integrate with post-install process.
   - Add to postinstall.js execution flow.
   - Create update confirmation prompts.
   - Log changes for transparency.
   - Handle permission errors gracefully.

## Phase 2: Prompt Transformation System Enhancement - Agent Group Beta (Agent_Prompt_Engineer, Agent_GitHub_Integration, Agent_Build_Optimizer)

### Epic 2.1 - Agent_Prompt_Engineer: Core APM Prompt Post-Processors
Objective: Create post-processing templates for all essential APM prompts.

1. **Task**: Analyze all prompts in src/prompts/original/.
   - Catalog all APM prompts requiring transformation.
     *Guidance: Focus on Manager, Implementation, and specialized agent prompts*
   - Identify common patterns for reuse.
   - Prioritize based on usage frequency.
   - Document transformation requirements.
2. **Task**: Create Manager Agent post-processors.
   - Create post-processor for 01_Initiation_Prompt.md.
     *Guidance: Inject GitHub project setup, issue creation workflows*
   - Create post-processor for 02_Codebase_Guidance.md.
     *Guidance: Add GitHub repository analysis commands*
   - Create post-processor for Implementation_Plan_Guide.md.
     *Guidance: Include GitHub issue hierarchy mapping*
   - Test transformations with example inputs.
3. **Task**: Create Implementation Agent post-processors.
   - Create post-processor for Implementation_Agent_Onboarding.md.
     *Guidance: Add GitHub workflow integration, commit guidelines*
   - Create task assignment prompt transformations.
   - Add GitHub context awareness to all prompts.
   - Include CLI command references.
4. **Task**: Create specialized agent post-processors.
   - Transform Debugger Agent prompts.
   - Transform Reviewer Agent prompts.
   - Create new Scrum Master transformations.
   - Add Prompt Engineer enhancements.

### Epic 2.2 - Agent_GitHub_Integration: GitHub Context Injection System
Objective: Build system to inject GitHub-specific context into all prompts.

1. **Task**: Design GitHub context detection system.
   - Detect repository configuration.
   - Identify custom issue types.
   - Determine project board setup.
   - Assess team size and structure.
2. **Task**: Implement context injection engine.
   - Create GitHubContextProvider class.
   - Build template variable system.
   - Implement conditional content blocks.
   - Add context validation.
3. **Task**: Create GitHub command templates.
   - Build reusable gh CLI command snippets.
   - Create issue creation templates.
   - Add PR workflow commands.
   - Include project board operations.
4. **Task**: Integrate with build system.
   - Connect context provider to PromptBuilder.
   - Add configuration options.
   - Implement caching for performance.
   - Create debug mode for troubleshooting.

### Feature 2.4 - Agent_Build_Optimizer: Markdown to XML Reference Resolution System
Objective: Pre-compile markdown files with resolved imports/references into XML format for runtime efficiency.

1. **Task**: Design reference resolution system.
   - Define import syntax patterns (@import, [[file]], etc.).
   - Create recursive file resolution algorithm.
   - Handle circular reference detection.
   - Design XML schema for output format.
2. **Task**: Implement markdown parser with reference support.
   - Build AST parser for markdown files.
   - Identify and extract reference patterns.
   - Implement file path resolution logic.
   - Add support for partial file includes.
3. **Task**: Create XML generation engine.
   - Design XML structure with metadata.
     *Guidance: Include source file paths, resolution timestamps*
   - Implement content inlining with proper escaping.
   - Add reference tracking for debugging.
   - Generate source maps for error reporting.
4. **Task**: Integrate with build pipeline.
   - Add XML generation to build:prompts command.
   - Create separate xml output directory.
   - Implement incremental builds for efficiency.
   - Add validation and error reporting.

### Epic 2.3 (Complex) - Agent_Prompt_Engineer & Agent_Test_Engineer: Prompt Validation System
Objective: Ensure all transformed prompts maintain quality and correctness.

1. **Task**: (Agent_Prompt_Engineer) Define prompt quality metrics.
   - Establish clarity standards.
   - Define completeness criteria.
   - Set context preservation rules.
   - Document validation requirements.
2. **Task**: (Agent_Test_Engineer) Implement automated validation.
   - Create prompt parsing utilities.
   - Build validation test suite.
   - Implement regression testing.
   - Add performance benchmarks.
3. **Task**: (Agent_Prompt_Engineer) Create prompt testing scenarios.
   - Design test cases for each prompt type.
   - Create mock GitHub contexts.
   - Define expected transformations.
   - Document edge cases.
4. **Task**: (Agent_Test_Engineer) Build validation reporting.
   - Create validation reports.
   - Add CI/CD integration.
   - Implement prompt diff visualization.
   - Generate quality metrics dashboard.

## Phase 3: GitHub Integration & Automation - Agent Group Gamma (Agent_GitHub_Automation, Agent_Integration_Specialist)

### Epic 3.1 - Agent_GitHub_Automation: TypeScript GitHub Automation Scripts
Objective: Replace shell scripts with robust TypeScript implementations.

1. **Task**: Create GitHub API client wrapper.
   - Build typed wrapper around @octokit/rest.
   - Implement authentication handling.
   - Add retry logic and rate limiting.
   - Create error handling system.
2. **Story**: Implement issue hierarchy management.
   - Convert create-sub-issue.sh to TypeScript.
     *Guidance: Use GitHub GraphQL API for custom issue types*
   - Build parent-child relationship tracker.
   - Add bulk issue creation capabilities.
   - Implement issue template system.
3. **Story**: Create project board automation.
   - Convert add-issues-to-project.sh to TypeScript.
   - Add column management features.
   - Implement card movement automation.
   - Build progress tracking utilities.
4. **Story**: Develop PR and commit integration.
   - Create commit message parser.
   - Build automatic issue linking.
   - Implement PR template generation.
   - Add merge automation helpers.

### Feature 3.2 - Agent_Integration_Specialist: Implementation Plan to GitHub Issues Converter
Objective: Build system to automatically create GitHub issues from Implementation Plans.

1. **Task**: Create Implementation Plan parser.
   - Build markdown AST parser.
   - Extract hierarchy structure.
   - Identify task assignments.
   - Parse metadata and dependencies.
2. **Task**: Implement issue creation engine.
   - Map plan structure to issue types.
     *Guidance: Use phase→project→epic→feature→task hierarchy*
   - Generate issue bodies with context.
   - Preserve acceptance criteria.
   - Add agent assignments as issue metadata.
3. **Task**: Build synchronization system.
   - Track created issues in plan.
   - Update plan with issue numbers.
   - Implement two-way sync capability.
   - Add conflict resolution.
4. **Story**: Create progress tracking integration.
   - Monitor issue state changes.
   - Update plan completion status.
   - Generate progress reports.
   - Build burndown calculations.

### Epic 3.3 - Agent_GitHub_Automation: GitHub Workflow Templates
Objective: Create reusable GitHub Actions and workflows for APM projects.

1. **Task**: Design APM-specific GitHub Actions.
   - Create action for plan validation.
   - Build issue creation action.
   - Add progress reporting action.
   - Implement handover automation.
2. **Task**: Implement CI/CD workflows.
   - Create PR validation workflow.
   - Add automated testing triggers.
   - Build deployment pipelines.
   - Implement security scanning.
3. **Task**: Create agent workflow helpers.
   - Build agent context preservation.
   - Add work session tracking.
   - Implement automatic commits.
   - Create review request automation.
4. **Task**: Package workflows for distribution.
   - Create workflow template repository.
   - Build installation scripts.
   - Add configuration helpers.
   - Document workflow customization.

## Phase 4: CLI Development & Commands - Agent Group Delta (Agent_CLI_Developer, Agent_UX_Designer)

### Epic 4.1 - Agent_CLI_Developer: Core CLI Architecture with Claude Code SDK
Objective: Build comprehensive CLI using Anthropic's Claude Code SDK as foundation.

1. **Task**: Set up CLI project structure.
   - Initialize with Claude Code SDK.
   - Create command routing system.
   - Implement plugin architecture.
   - Add configuration management.
2. **Story**: Implement base CLI commands.
   - Create `apm init` for project setup.
   - Build `apm plan` for Implementation Plan management.
   - Add `apm agent` for agent initialization.
   - Implement `apm status` for project overview.
3. **Task**: Integrate with Claude Code SDK.
   - Implement SDK query interface.
   - Add subprocess command execution.
   - Create MCP server integration.
   - Build context management system.
4. **Task**: Create command extension system.
   - Design plugin interface.
   - Build command discovery.
   - Add dynamic command loading.
   - Implement command aliasing.

### Epic 4.2 (Complex) - Agent_CLI_Developer & Agent_UX_Designer: Interactive Command Workflows
Objective: Create intuitive, interactive workflows for complex APM operations.

1. **Story**: (Agent_UX_Designer) Design command interactions.
   - Create prompt flows for setup.
   - Design agent selection interfaces.
   - Build task assignment wizards.
   - Add progress visualization.
2. **Task**: (Agent_CLI_Developer) Implement interactive prompts.
   - Use inquirer.js or similar for prompts.
   - Build validation and error handling.
   - Add context-aware suggestions.
   - Implement command history.
3. **Doc**: (Agent_UX_Designer) Create help system.
   - Design comprehensive help screens.
   - Build command examples.
   - Add troubleshooting guides.
   - Create quick-start tutorials.
4. **Task**: (Agent_CLI_Developer) Build command output formatting.
   - Implement table layouts.
   - Add color coding system.
   - Create progress indicators.
   - Build export capabilities.

### Epic 4.3 - Agent_CLI_Developer: Claude Command Integration
Objective: Create .claude/commands/apm/ structure for Claude Code integration.

1. **Task**: Design command file structure.
   - Create command categorization.
   - Build command naming conventions.
   - Add metadata system.
   - Implement versioning.
2. **Task**: Generate Claude command files.
   - Transform CLI commands to .claude format.
   - Add Claude-specific metadata.
   - Implement parameter mapping.
   - Create command chains.
3. **Task**: Build command synchronization.
   - Keep CLI and Claude commands in sync.
   - Add bidirectional updates.
   - Implement conflict resolution.
   - Create validation system.
4. **Task**: Package for distribution.
   - Create post-install generator.
   - Build update mechanisms.
   - Add customization options.
   - Document integration patterns.

### Feature 4.4 - Agent_UX_Designer & Agent_CLI_Developer: Visual Notification System
Objective: Implement cross-platform desktop notifications for important APM events outside the terminal.

1. **Story**: (Agent_UX_Designer) Design notification strategy.
   - Define notification-worthy events (task completion, builds, PR reviews).
   - Create notification priority levels (info, success, warning, error).
   - Design notification templates and formatting.
   - Plan user preference management.
2. **Task**: (Agent_CLI_Developer) Research and integrate notification libraries.
   - Evaluate node-notifier for cross-platform support.
     *Guidance: Supports Windows, macOS, Linux with fallbacks*
   - Consider electron-notify for richer notifications.
   - Assess notify-send compatibility on Linux.
   - Choose library based on platform coverage.
3. **Task**: (Agent_CLI_Developer) Implement notification service.
   - Create NotificationService class with queue management.
   - Implement platform detection and fallbacks.
   - Add notification history and logging.
   - Build rate limiting to prevent spam.
4. **Story**: (Both) Create notification preferences system.
   - Build configuration for enabled/disabled events.
   - Implement do-not-disturb scheduling.
   - Add sound and visual customization.
   - Create CLI commands for preference management.

## Phase 5: Testing, Documentation & Publishing - Agent Group Epsilon (Agent_QA_Lead, Agent_Doc_Writer, Agent_DevOps)

### Epic 5.1 - Agent_QA_Lead: End-to-End Testing with journal-ai-cli
Objective: Comprehensive testing using journal-ai-cli as real-world test case.

1. **Task**: Set up journal-ai-cli test environment.
   - Clone journal-ai-cli repository.
   - Install development version of APM.
   - Configure for testing.
   - Create test scenarios.
2. **Task**: Execute full APM workflow testing.
   - Test project initialization.
   - Validate Implementation Plan creation.
   - Test GitHub issue generation.
   - Verify agent workflows.
3. **Task**: Perform integration testing.
   - Test CLI commands end-to-end.
   - Validate GitHub integrations.
   - Test prompt transformations.
   - Verify build system.
4. **Bug**: Create test report and fixes.
   - Document all issues found.
   - Prioritize fixes by severity.
   - Implement corrections.
   - Re-test fixed issues.

### Epic 5.2 - Agent_Doc_Writer: Comprehensive Documentation
Objective: Create full documentation suite for the enhanced APM framework.

1. **Doc**: Write user documentation.
   - Create getting started guide.
   - Document all CLI commands.
   - Write workflow tutorials.
   - Add troubleshooting section.
2. **Doc**: Create developer documentation.
   - Document architecture decisions.
   - Write plugin development guide.
   - Add API references.
   - Create contribution guidelines.
3. **Doc**: Build migration documentation.
   - Write migration guide from original APM.
   - Document breaking changes.
   - Create compatibility matrix.
   - Add upgrade scripts.
4. **Doc**: Generate example projects.
   - Create starter templates.
   - Build showcase examples.
   - Add video tutorials.
   - Create interactive demos.

### Epic 5.3 (Complex) - Agent_DevOps & Agent_TypeScript_Lead: NPM Package Publishing
Objective: Prepare and publish the framework as a professional npm package.

1. **Task**: (Agent_DevOps) Finalize package configuration.
   - Review and optimize package.json.
   - Set up npm organization.
   - Configure package access.
   - Add security policies.
2. **Task**: (Agent_TypeScript_Lead) Optimize build output.
   - Minimize bundle size.
   - Optimize dependencies.
   - Create production builds.
   - Generate source maps.
3. **Task**: (Agent_DevOps) Set up publishing pipeline.
   - Create release workflow.
   - Add version management.
   - Implement changelog generation.
   - Configure npm publishing.
4. **Story**: (Both) Execute initial release.
   - Run final test suite.
   - Create release notes.
   - Publish to npm.
   - Monitor initial adoption.

---
## Note on GitHub-Native Memory System

This project uses GitHub as its primary memory and tracking system:
- **Git commits** serve as the chronological log (see .claude/commands/commit.md)
- **GitHub issues** track all work items using the hierarchy defined above
- **Pull requests** document major changes and reviews
- **Agent context** is preserved in .apm/context/ when needed

The traditional APM Memory Bank is replaced by these GitHub-native mechanisms, aligning with modern development workflows.

---
## Note on Handover Protocol

For long-running projects or situations requiring context transfer (e.g., exceeding LLM context limits, changing specialized agents), the APM Handover Protocol should be initiated. This ensures smooth transitions and preserves project knowledge. 

In this GitHub-integrated system, handovers also include:
- Current branch state
- Open issues assigned to the agent
- Uncommitted changes
- Active PR reviews

Detailed procedures are outlined in the framework guide:
`prompts/01_Manager_Agent_Core_Guides/05_Handover_Protocol_Guide.md`

The current Manager Agent or the User should initiate this protocol as needed.