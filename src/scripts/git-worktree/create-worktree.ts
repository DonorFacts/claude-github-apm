#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, relative } from 'path';

interface WorktreeOptions {
  agentRole: string;
  description: string;
  branchType?: 'feature' | 'fix' | 'hotfix' | 'bug';
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

  private generateBranchName(options: WorktreeOptions): string {
    if (!options.issueNumber) {
      throw new Error('Issue number is required to generate branch name');
    }
    
    // Convert description to kebab-case
    const kebabDescription = options.description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    const branchType = options.branchType || 'feature';
    return `${branchType}-${options.issueNumber}-${kebabDescription}`;
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

  private createHandoverFile(worktreeDir: string, options: WorktreeOptions & { branchName: string }): void {
    const agentDir = join(worktreeDir, 'apm', 'agents', options.agentRole, 'not-started');
    mkdirSync(agentDir, { recursive: true });

    const handoverContent = `# Handover Instructions for ${options.branchName}

## Task Overview
- **Branch**: ${options.branchName}
- **Agent Role**: ${options.agentRole}
- **Issue**: #${options.issueNumber}
- **Description**: ${options.description}

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

  private createWorktreeHandoverFile(worktreeDir: string, options: WorktreeOptions & { branchName: string }): void {
    const handoverDir = join(worktreeDir, 'apm', 'worktree-handovers', 'not-started');
    mkdirSync(handoverDir, { recursive: true });

    const handoverContent = `# Handover Instructions for ${options.branchName}

## Task Overview
- **Branch**: ${options.branchName}
- **Agent Role**: ${options.agentRole}
- **Issue**: #${options.issueNumber}
- **Description**: ${options.description}

## Context
This is a new ${options.branchType || 'feature'} branch for: ${options.description}

The agent should:
1. Implement the feature using TypeScript exclusively
2. Follow TDD practices (tests first)
3. Run tests frequently with \`pnpm test\`
4. Use \`pnpm cli speak\` for status updates
5. Run \`pnpm ts-check\` after TypeScript changes

## Next Steps
1. Read the GitHub issue #${options.issueNumber} for detailed requirements
2. Plan the implementation approach (consider 2+ alternatives)
3. Write tests first (TDD)
4. Implement features incrementally
5. Notify Jake with \`pnpm cli speak\` when complete

## Important Notes
- Use TypeScript exclusively (no shell scripts)
- Follow existing code patterns
- Maintain clean git history
- Update documentation if needed
`;

    writeFileSync(join(handoverDir, `${options.branchName}.md`), handoverContent);
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

    // Create GitHub issue FIRST (required for branch naming)
    if (!options.issueNumber) {
      console.log('🎫 Creating GitHub issue...');
      const issueTitle = `${options.branchType === 'fix' ? 'Bug Fix' : 'Feature Development'}: ${options.description}`;
      const issueBody = `## Overview
This issue tracks the development of: ${options.description}

## Scope
- Agent Role: ${options.agentRole}
- Implementation: TypeScript-only
- Branch Type: ${options.branchType || 'feature'}

## Acceptance Criteria
- [ ] Feature implemented with TypeScript
- [ ] Tests written and passing (TDD approach)
- [ ] Code follows existing patterns
- [ ] Documentation updated if needed
- [ ] All TypeScript checks pass

## Notes
Created automatically by git worktree setup.
`;
      
      try {
        options.issueNumber = this.createGitHubIssue(issueTitle, issueBody);
        console.log(`✅ Created issue #${options.issueNumber}`);
      } catch (error) {
        throw new Error(`Failed to create GitHub issue: ${error}. Issue number required for branch naming.`);
      }
    }

    // Generate branch name from issue number and description
    const branchName = this.generateBranchName(options);
    console.log(`🌿 Generated branch name: ${branchName}`);

    // Create worktree
    const worktreeDir = join(this.worktreeDir, branchName);
    console.log(`🌳 Creating worktree: ${worktreeDir}`);
    
    try {
      this.createWorktree(branchName, worktreeDir);
      console.log('✅ Worktree created successfully');
    } catch (error) {
      throw new Error(`Failed to create worktree: ${error}`);
    }

    // Create handover files
    console.log('📝 Creating handover files...');
    this.createHandoverFile(worktreeDir, { ...options, branchName });
    this.createWorktreeHandoverFile(worktreeDir, { ...options, branchName });
    console.log('✅ Handover files created');

    // Open VS Code
    console.log('🚀 Opening VS Code...');
    await this.openVSCode(worktreeDir);

    console.log(`
✅ Worktree setup complete!

📁 Worktree location: ${worktreeDir}
🌿 Branch: ${branchName}
👤 Agent role: ${options.agentRole}
🎫 Issue: #${options.issueNumber}

🔍 Running validation...`);

    // Run validation
    try {
      this.runCommand(`tsx src/scripts/git-worktree/validate-worktree.ts ${branchName} ${options.issueNumber}`);
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
  const [,, agentRole, description, branchType, issueNumber] = process.argv;

  if (!agentRole || !description) {
    console.error('Usage: tsx create-worktree.ts <agent-role> <description> [branch-type] [issue-number]');
    console.error('Example: tsx create-worktree.ts developer "text-to-speech mistral 7b integration"');
    console.error('Branch types: feature (default), fix, hotfix, bug');
    process.exit(1);
  }

  const validBranchTypes = ['feature', 'fix', 'hotfix', 'bug'];
  const finalBranchType = branchType && validBranchTypes.includes(branchType) ? branchType as 'feature' | 'fix' | 'hotfix' | 'bug' : 'feature';

  const manager = new GitWorktreeManager();
  manager.createWorktreeWithIssue({
    agentRole,
    description,
    branchType: finalBranchType,
    issueNumber
  }).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

export { GitWorktreeManager };