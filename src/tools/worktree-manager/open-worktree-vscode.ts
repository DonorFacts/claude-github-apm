#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Opens VS Code in a worktree directory after installing dependencies.
 * This script exists because Claude Code cannot cd outside the original directory,
 * but we need to run pnpm install in the worktree. Using execSync with cwd option
 * solves this limitation.
 */
function openWorktreeInVSCode(worktreePath: string): void {
  console.log(`🚀 Opening worktree: ${worktreePath}`);
  
  // Verify worktree exists
  if (!existsSync(worktreePath)) {
    console.error(`❌ Worktree path does not exist: ${worktreePath}`);
    process.exit(1);
  }
  
  // Install dependencies using cwd to work around Claude's cd limitation
  console.log(`📦 Installing dependencies...`);
  try {
    execSync('pnpm install', { 
      stdio: 'inherit',
      cwd: worktreePath
    });
    console.log(`✅ Dependencies installed`);
  } catch (error) {
    console.error(`⚠️  Failed to install dependencies: ${(error as Error).message}`);
    console.log(`💡 You may need to run 'pnpm install' manually in the worktree`);
  }
  
  // Open VS Code
  try {
    execSync(`code "${worktreePath}"`, { stdio: 'inherit' });
    console.log('✅ VS Code opened successfully');
    console.log('💡 Claude will auto-start if .vscode/tasks.json is configured');
  } catch (error) {
    console.error('❌ Failed to open VS Code:', error);
    console.log('💡 Please ensure VS Code command line tools are installed');
  }
}

// CLI execution
if (require.main === module) {
  const worktreePath = process.argv[2];

  if (!worktreePath) {
    console.error('❌ Usage: tsx open-worktree-vscode.ts <worktree-path>');
    console.error('   Example: tsx open-worktree-vscode.ts ../worktrees/feature-branch');
    process.exit(1);
  }

  openWorktreeInVSCode(worktreePath);
}