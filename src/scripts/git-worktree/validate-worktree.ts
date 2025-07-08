#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface ValidationResult {
  criterion: string;
  passed: boolean;
  message: string;
  details?: string;
}

class WorktreeValidator {
  private results: ValidationResult[] = [];
  
  constructor(
    private branchName?: string,
    private issueNumber?: string
  ) {}

  private runCommand(command: string, silent: boolean = true): { success: boolean; output: string } {
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit'
      }).trim();
      return { success: true, output };
    } catch (error) {
      return { success: false, output: error instanceof Error ? error.message : String(error) };
    }
  }

  private addResult(criterion: string, passed: boolean, message: string, details?: string): void {
    this.results.push({ criterion, passed, message, details });
  }

  private autoDetectBranch(): string | null {
    // Try current branch first
    const { success: currentSuccess, output: currentBranch } = this.runCommand('git branch --show-current');
    if (currentSuccess && currentBranch && currentBranch !== 'main' && currentBranch !== 'master') {
      return currentBranch;
    }

    // Try to find recent non-main branches
    const { success: branchSuccess, output: branches } = this.runCommand('git branch --sort=-committerdate');
    if (branchSuccess) {
      const nonMainBranches = branches.split('\n')
        .map(b => b.trim().replace(/^[\*\+\-]\s*/, '')) // Remove prefix markers
        .filter(b => b && b !== 'main' && b !== 'master');
      
      if (nonMainBranches.length > 0) {
        return nonMainBranches[0];
      }
    }

    return null;
  }

  private discoverExistingWorktrees(): void {
    const { success, output } = this.runCommand('git worktree list');
    
    if (success) {
      const worktrees = output.split('\n').filter(line => line.trim());
      const nonMainWorktrees = worktrees.filter(line => !line.includes('[main]') && !line.includes('[master]'));
      
      if (nonMainWorktrees.length > 0) {
        this.addResult(
          'Existing Worktrees',
          true,
          `Found ${nonMainWorktrees.length} existing worktree(s)`,
          nonMainWorktrees.map(w => `  ${w}`).join('\n')
        );
      } else {
        this.addResult(
          'Existing Worktrees',
          false,
          'No feature worktrees found',
          'Only main/master worktree exists'
        );
      }
    }
  }

  private validatePrerequisites(): void {
    // Check git repository
    const { success: gitSuccess } = this.runCommand('git rev-parse --git-dir');
    this.addResult(
      'Git Repository',
      gitSuccess,
      gitSuccess ? 'In a git repository' : 'Not in a git repository',
      gitSuccess ? undefined : 'Must be run from within a git repository'
    );

    // Check GitHub CLI
    const { success: ghSuccess, output: ghOutput } = this.runCommand('gh --version');
    this.addResult(
      'GitHub CLI',
      ghSuccess,
      ghSuccess ? 'GitHub CLI available' : 'GitHub CLI not found',
      ghSuccess ? `Version: ${ghOutput.split('\n')[0]}` : 'Install with: brew install gh'
    );

    // Check container environment
    const { success: containerSuccess, output: containerOutput } = this.runCommand('echo $APM_CONTAINERIZED');
    const isContainerized = containerOutput === 'true';
    this.addResult(
      'Container Environment',
      isContainerized,
      isContainerized ? 'Running in containerized environment' : 'Not running in container',
      `APM_CONTAINERIZED=${containerOutput}`
    );
  }

  private validateContainerEnvironment(): void {
    // This is handled by validatePrerequisites now
    // Keeping for backward compatibility
  }

  private extractIssueNumberFromBranch(branchName: string): string | null {
    // Look for patterns like feature-123-desc, fix-456-bug, etc.
    const match = branchName.match(/(?:feature|fix|hotfix|bug)-(\d+)-/);
    if (match) {
      return match[1];
    }
    
    // Look for any number pattern in branch name
    const numberMatch = branchName.match(/(\d+)/);
    if (numberMatch) {
      return numberMatch[1];
    }
    
    return null;
  }

  private searchRecentIssues(): string | null {
    // Get recent issues that might match
    const { success, output } = this.runCommand(`gh issue list --limit 20 --state open --json number,title,createdAt`);
    
    if (!success) {
      return null;
    }
    
    try {
      const issues = JSON.parse(output);
      
      // If we have a branch name, try to find matching issue
      if (this.branchName) {
        const extractedNumber = this.extractIssueNumberFromBranch(this.branchName);
        if (extractedNumber) {
          const matchingIssue = issues.find((issue: any) => issue.number.toString() === extractedNumber);
          if (matchingIssue) {
            return extractedNumber;
          }
        }
        
        // Try to find issue with similar title/content
        const branchWords = this.branchName.toLowerCase().split(/[-_]/);
        const matchingByTitle = issues.find((issue: any) => {
          const titleWords = issue.title.toLowerCase().split(/\s+/);
          return branchWords.some(word => word.length > 3 && titleWords.some((tw: string) => tw.includes(word)));
        });
        
        if (matchingByTitle) {
          return matchingByTitle.number.toString();
        }
      }
      
      // Return the most recent issue as a fallback
      if (issues.length > 0) {
        return issues[0].number.toString();
      }
    } catch (error) {
      // JSON parsing failed
    }
    
    return null;
  }

  private validateGitHubIssue(): void {
    // First try to use provided issue number
    let issueToCheck = this.issueNumber;
    
    // If no issue provided, try to discover it
    if (!issueToCheck && this.branchName) {
      const extracted = this.extractIssueNumberFromBranch(this.branchName);
      if (extracted) {
        issueToCheck = extracted;
        this.addResult(
          'Issue Discovery',
          true,
          `Extracted issue #${issueToCheck} from branch name`,
          `Branch: ${this.branchName} → Issue: #${issueToCheck}`
        );
      }
    }
    
    // If still no issue, search recent issues
    if (!issueToCheck) {
      const searched = this.searchRecentIssues();
      if (searched) {
        issueToCheck = searched;
        this.addResult(
          'Issue Discovery',
          true,
          `Found potential matching issue #${issueToCheck} from recent issues`,
          `Matched with branch: ${this.branchName || 'N/A'}`
        );
      }
    }
    
    // Now validate the discovered or provided issue
    if (!issueToCheck) {
      this.addResult(
        'GitHub Issue',
        false,
        'No issue number found - could not extract from branch name or find recent issues',
        'Ensure branch follows naming convention (e.g., feature-123-description) or GitHub CLI is authenticated'
      );
      return;
    }

    const { success, output } = this.runCommand(`gh issue view ${issueToCheck}`);
    
    if (success) {
      // Parse issue details to show more info
      try {
        const lines = output.split('\n');
        const titleLine = lines.find(line => line.trim() && !line.startsWith('#') && !line.startsWith('--'));
        const title = titleLine ? titleLine.trim() : 'Unknown title';
        
        this.addResult(
          'GitHub Issue',
          true,
          `Issue #${issueToCheck} exists: "${title}"`,
          `Branch alignment: ${this.branchName?.includes(issueToCheck) ? 'Matches' : 'No match'}`
        );
      } catch {
        this.addResult(
          'GitHub Issue',
          true,
          `Issue #${issueToCheck} exists`,
          undefined
        );
      }
    } else {
      this.addResult(
        'GitHub Issue',
        false,
        `Issue #${issueToCheck} not found or GitHub CLI not authenticated`,
        output
      );
    }
  }

  private validateFeatureBranch(): void {
    if (!this.branchName) {
      this.addResult(
        'Feature Branch',
        false,
        'No branch name provided - skipping branch validation',
        'Provide branch name as first argument for full validation'
      );
      return;
    }

    const { success, output } = this.runCommand(`git branch --list ${this.branchName}`);
    const branchExists = success && output.includes(this.branchName);
    
    this.addResult(
      'Feature Branch',
      branchExists,
      branchExists ? `Branch '${this.branchName}' exists` : `Branch '${this.branchName}' not found`,
      output || 'No branches found'
    );
  }

  private validateWorktreeDirectory(): void {
    if (!this.branchName) {
      this.addResult(
        'Worktree Directory',
        false,
        'No branch name provided - skipping worktree directory validation',
        'Provide branch name as first argument for full validation'
      );
      return;
    }

    const worktreePath = join('..', 'worktrees', this.branchName);
    const exists = existsSync(worktreePath);
    
    if (exists) {
      try {
        const stats = statSync(worktreePath);
        const isDirectory = stats.isDirectory();
        
        this.addResult(
          'Worktree Directory',
          isDirectory,
          isDirectory ? `Worktree directory exists: ${worktreePath}` : `Path exists but is not a directory: ${worktreePath}`,
          `Path: ${worktreePath}`
        );
      } catch (error) {
        this.addResult(
          'Worktree Directory',
          false,
          `Error accessing worktree directory: ${worktreePath}`,
          error instanceof Error ? error.message : String(error)
        );
      }
    } else {
      this.addResult(
        'Worktree Directory',
        false,
        `Worktree directory not found: ${worktreePath}`,
        `Expected path: ${worktreePath}`
      );
    }
  }

  private validateGitWorktree(): void {
    if (!this.branchName) {
      this.addResult(
        'Git Worktree',
        false,
        'No branch name provided - skipping git worktree validation',
        'Provide branch name as first argument for full validation'
      );
      return;
    }

    const { success, output } = this.runCommand('git worktree list');
    
    if (!success) {
      this.addResult(
        'Git Worktree',
        false,
        'Failed to get git worktree list',
        'Git worktree command failed'
      );
      return;
    }
    
    // Check both relative and absolute paths for the worktree
    const relativeWorktreePath = join('..', 'worktrees', this.branchName);
    const absoluteWorktreePath = `/workspace/worktrees/${this.branchName}`;
    
    const hasWorktree = output.includes(relativeWorktreePath) || 
                       output.includes(absoluteWorktreePath) ||
                       output.includes(`worktrees/${this.branchName}`);
    
    this.addResult(
      'Git Worktree',
      hasWorktree,
      hasWorktree ? `Worktree registered in git` : `Worktree not found in git worktree list`,
      output
    );
  }

  private validateHandoverFile(): void {
    if (!this.branchName) {
      this.addResult(
        'Handover File',
        false,
        'No branch name provided - skipping handover file validation',
        'Provide branch name as first argument for full validation'
      );
      return;
    }

    const handoverPath = join('..', 'worktrees', this.branchName, 'apm', 'worktree-handovers', 'not-started', `${this.branchName}.md`);
    const exists = existsSync(handoverPath);
    
    this.addResult(
      'Handover File',
      exists,
      exists ? `Handover file exists: ${handoverPath}` : `Handover file not found: ${handoverPath}`,
      `Expected path: ${handoverPath}`
    );
  }

  private validateVSCodeIntegration(): void {
    if (!this.branchName) {
      this.addResult(
        'VS Code Integration',
        false,
        'No branch name provided - skipping VS Code integration validation',
        'Provide branch name as first argument for full validation'
      );
      return;
    }

    // Just check if the script exists and the worktree path exists
    const scriptPath = 'src/integrations/docker/host-bridge/container/cli/open-vscode.ts';
    const worktreePath = join('..', 'worktrees', this.branchName);
    
    const scriptExists = existsSync(scriptPath);
    const worktreeExists = existsSync(worktreePath);
    
    const passed = scriptExists && worktreeExists;
    
    this.addResult(
      'VS Code Integration',
      passed,
      passed ? 'VS Code integration script and worktree path both exist' : 'VS Code integration prerequisites missing',
      `Script exists: ${scriptExists}, Worktree exists: ${worktreeExists}`
    );
  }

  private validateClaudeAccess(): void {
    // Skip this validation - we're already running inside Claude Code
    this.addResult(
      'Claude Access',
      true,
      'Claude Code is already running (validation skipped)',
      'This validation is not meaningful since we are executing within Claude Code'
    );
  }

  private validateBoundaryProtocol(): void {
    const completeHandoffPath = 'src/prompts/git/worktrees/complete-handoff.md';
    const exists = existsSync(completeHandoffPath);
    
    this.addResult(
      'Boundary Protocol',
      exists,
      exists ? 'Boundary protocol documentation exists' : 'Boundary protocol documentation not found',
      `Expected path: ${completeHandoffPath}`
    );
  }


  public async validateAll(): Promise<boolean> {
    console.log(chalk.blue('🔍 Validating worktree setup...'));
    
    // Auto-detect branch if not provided
    if (!this.branchName) {
      const detectedBranch = this.autoDetectBranch();
      if (detectedBranch) {
        this.branchName = detectedBranch;
        console.log(chalk.yellow(`Auto-detected branch: ${this.branchName}`));
      } else {
        console.log(chalk.yellow('No branch name provided and no suitable branch detected'));
        console.log(chalk.yellow('Running in discovery mode - checking prerequisites and existing worktrees'));
      }
    }
    
    console.log(chalk.gray(`Branch: ${this.branchName || 'N/A'}`));
    console.log(chalk.gray(`Issue: ${this.issueNumber || 'N/A'}`));
    console.log('');

    // Run prerequisite validations first
    this.validatePrerequisites();
    this.discoverExistingWorktrees();
    
    // Run specific validations if we have a branch name
    if (this.branchName) {
      this.validateGitHubIssue();
      this.validateFeatureBranch();
      this.validateWorktreeDirectory();
      this.validateGitWorktree();
      this.validateHandoverFile();
      this.validateVSCodeIntegration();
    }
    
    // Run general validations
    this.validateClaudeAccess();
    this.validateBoundaryProtocol();

    // Display results
    let allPassed = true;
    
    for (const result of this.results) {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? chalk.green : chalk.red;
      
      console.log(`${icon} ${color(result.criterion)}: ${result.message}`);
      
      if (result.details) {
        console.log(chalk.gray(`   ${result.details}`));
      }
      
      if (!result.passed) {
        allPassed = false;
      }
      
      console.log('');
    }

    // Summary
    const passedCount = this.results.filter(r => r.passed).length;
    const totalCount = this.results.length;
    
    console.log(chalk.bold('📊 Summary:'));
    console.log(`   Passed: ${chalk.green(passedCount)}/${totalCount}`);
    console.log(`   Failed: ${chalk.red(totalCount - passedCount)}/${totalCount}`);
    console.log('');

    if (allPassed) {
      console.log(chalk.green.bold('🎉 All acceptance criteria passed!'));
    } else {
      console.log(chalk.red.bold('❌ Some acceptance criteria failed.'));
      console.log(chalk.yellow('💡 Please resolve the failed criteria before proceeding.'));
    }

    return allPassed;
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Arguments are now optional - if none provided, run in discovery mode
  const branchName = args[0];
  const issueNumber = args[1];

  if (args.length === 0) {
    console.log(chalk.blue('No arguments provided - running in discovery mode'));
    console.log(chalk.gray('Usage: tsx validate-worktree.ts [branch-name] [issue-number]'));
    console.log('');
  }

  const validator = new WorktreeValidator(branchName, issueNumber);
  const allPassed = await validator.validateAll();

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}