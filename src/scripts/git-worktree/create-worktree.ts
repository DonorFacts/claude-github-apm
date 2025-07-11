#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';

interface WorktreeOptions {
  branchName: string;
  agentRole: string;
  description?: string;
  issueNumber?: string;
}

class GitWorktreeManager {
  private worktreeDir: string;
  private mainDir: string;

  constructor() {
    this.mainDir = process.cwd();
    this.worktreeDir = join(this.mainDir, '..', 'worktrees');
  }

  private runCommand(command: string, options?: { cwd?: string }): string {
    try {
      return execSync(command, { 
        encoding: 'utf8', 
        cwd: options?.cwd || this.mainDir 
      }).trim();
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error}`);
    }
  }

  private validateEnvironment(): void {
    // Check if we're in a git repository
    try {
      this.runCommand('git rev-parse --git-dir');
    } catch {
      throw new Error('Not in a git repository');
    }

    // Check if we have gh CLI
    try {
      this.runCommand('gh --version');
    } catch {
      throw new Error('GitHub CLI (gh) not found. Please install it first.');
    }
  }

  private getCurrentBranch(): string {
    return this.runCommand('git branch --show-current');
  }

  private hasUncommittedChanges(): boolean {
    const status = this.runCommand('git status --porcelain');
    return status.length > 0;
  }

  private createGitHubIssue(title: string, body: string): string {
    const issueUrl = this.runCommand(`gh issue create --title "${title}" --body "${body}"`);
    const issueNumber = issueUrl.split('/').pop() || '';
    return issueNumber;
  }

  private createWorktree(branchName: string, targetDir: string): void {
    // Ensure worktrees directory exists
    if (!existsSync(this.worktreeDir)) {
      mkdirSync(this.worktreeDir, { recursive: true });
    }

    // Create new branch and worktree
    this.runCommand(`git worktree add -b ${branchName} ${targetDir}`);
    
    // Fix .git file to use relative paths for container/host compatibility
    this.fixWorktreeGitFile(targetDir);
  }

  private fixWorktreeGitFile(worktreeDir: string): void {
    const gitFilePath = join(worktreeDir, '.git');
    
    if (!existsSync(gitFilePath)) {
      console.log('⚠️  .git file not found in worktree, skipping path fix');
      return;
    }
    
    try {
      const gitFileContent = readFileSync(gitFilePath, 'utf8').trim();
      
      // Extract the gitdir path (format: "gitdir: /absolute/path")
      const gitdirMatch = gitFileContent.match(/^gitdir:\s*(.+)$/);
      if (!gitdirMatch) {
        console.log('⚠️  Could not parse .git file format, skipping path fix');
        return;
      }
      
      const absolutePath = gitdirMatch[1];
      
      // Convert absolute path to relative path
      const relativePath = relative(worktreeDir, absolutePath);
      const newContent = `gitdir: ${relativePath}`;
      
      // Write back the fixed content
      writeFileSync(gitFilePath, newContent + '\n');
      console.log(`✅ Fixed .git file path: ${absolutePath} → ${relativePath}`);
      
    } catch (error) {
      console.log(`⚠️  Failed to fix .git file paths: ${error}`);
    }
  }

  private createHandoverFile(worktreeDir: string, options: WorktreeOptions): void {
    const agentDir = join(worktreeDir, 'apm', 'agents', options.agentRole, 'not-started');
    mkdirSync(agentDir, { recursive: true });

    const handoverContent = `# Handover Instructions for ${options.branchName}

## Task Overview
- **Branch**: ${options.branchName}
- **Agent Role**: ${options.agentRole}
- **Issue**: ${options.issueNumber ? `#${options.issueNumber}` : 'TBD'}
- **Description**: ${options.description || 'Mobile app development'}

## Context
This is a new feature branch for mobile app development. The agent should:
1. Implement mobile-specific features
2. Follow TypeScript-only guidelines
3. Run tests frequently with \`pnpm test\`
4. Use \`pnpm cli speak\` for status updates

## Next Steps
1. Read the issue requirements
2. Plan the implementation approach
3. Start with tests (TDD)
4. Implement features incrementally

## Important Notes
- Use TypeScript exclusively (no shell scripts)
- Follow existing code patterns
- Run \`pnpm ts-check\` after TypeScript changes
- Notify Jake with \`pnpm cli speak\` when complete
`;

    writeFileSync(join(agentDir, 'handover.md'), handoverContent);
  }

  private async openVSCode(worktreeDir: string): Promise<void> {
    try {
      console.log('📤 Opening VS Code via host-bridge...');
      // Convert absolute path to relative path for host-bridge compatibility
      const relativePath = relative(this.mainDir, worktreeDir);
      this.runCommand(`tsx src/integrations/docker/host-bridge/container/cli/open-vscode.ts ${relativePath}`);
    } catch (error) {
      console.log(`Could not open VS Code automatically: ${error}`);
      console.log(`Please manually open: ${worktreeDir}`);
      console.log('💡 Make sure host-bridge daemon is running');
    }
  }

  async createWorktreeWithIssue(options: WorktreeOptions): Promise<void> {
    console.log('🔍 Validating environment...');
    this.validateEnvironment();

    console.log('📊 Checking git status...');
    const currentBranch = this.getCurrentBranch();
    const hasChanges = this.hasUncommittedChanges();

    if (hasChanges) {
      console.log('⚠️  You have uncommitted changes. Please commit or stash them first.');
      process.exit(1);
    }

    console.log(`📋 Current branch: ${currentBranch}`);

    // Create GitHub issue if not provided
    if (!options.issueNumber) {
      console.log('🎫 Creating GitHub issue...');
      const issueTitle = `Mobile App Development: ${options.description || 'Feature Implementation'}`;
      const issueBody = `## Overview
This issue tracks the development of mobile app features.

## Scope
- Branch: ${options.branchName}
- Agent Role: ${options.agentRole}
- Implementation: TypeScript-only

## Acceptance Criteria
- [ ] Feature implemented with TypeScript
- [ ] Tests written and passing
- [ ] Code follows existing patterns
- [ ] Documentation updated if needed

## Notes
Created automatically by git worktree setup.
`;
      
      try {
        options.issueNumber = this.createGitHubIssue(issueTitle, issueBody);
        console.log(`✅ Created issue #${options.issueNumber}`);
      } catch (error) {
        console.log(`⚠️  Could not create GitHub issue: ${error}`);
        console.log('Continuing without issue number...');
      }
    }

    // Create worktree
    const worktreeDir = join(this.worktreeDir, options.branchName);
    console.log(`🌳 Creating worktree: ${worktreeDir}`);
    
    try {
      this.createWorktree(options.branchName, worktreeDir);
      console.log('✅ Worktree created successfully');
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`);
    }

    // Create handover file
    console.log('📝 Creating handover file...');
    this.createHandoverFile(worktreeDir, options);
    console.log('✅ Handover file created');

    // Open VS Code
    console.log('🚀 Opening VS Code...');
    await this.openVSCode(worktreeDir);

    console.log(`
✅ Worktree setup complete!

📁 Worktree location: ${worktreeDir}
🌿 Branch: ${options.branchName}
👤 Agent role: ${options.agentRole}
${options.issueNumber ? `🎫 Issue: #${options.issueNumber}` : ''}

🔍 Running validation...`);

    // Run validation
    try {
      this.runCommand(`tsx src/scripts/git-worktree/validate-worktree.ts ${options.branchName} ${options.issueNumber || ''}`);
      console.log('✅ Validation completed successfully!');
    } catch (error) {
      console.log('⚠️  Validation found issues - please review above');
    }

    console.log(`
Next steps:
1. Switch to the new VS Code window
2. Verify Claude is running in the terminal
3. Run 'pnpm start' or 'pnpm watch:commands' in the terminal
4. Begin feature development
`);
  }
}

// CLI interface
if (require.main === module) {
  const [,, branchName, agentRole, description, issueNumber] = process.argv;

  if (!branchName || !agentRole) {
    console.error('Usage: tsx create-worktree.ts <branch-name> <agent-role> [description] [issue-number]');
    console.error('Example: tsx create-worktree.ts mobile-app developer "mobile features"');
    process.exit(1);
  }

  const manager = new GitWorktreeManager();
  manager.createWorktreeWithIssue({
    branchName,
    agentRole,
    description,
    issueNumber
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { GitWorktreeManager };