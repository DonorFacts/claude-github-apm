#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { hostBridge } from '../host-bridge/index.js';

/**
 * Opens VS Code in a worktree directory after installing dependencies.
 * Uses the unified host-bridge system for container/host communication.
 * This script exists because Claude Code cannot cd outside the original directory,
 * but we need to run pnpm install in the worktree. Using execSync with cwd option
 * solves this limitation.
 */
async function openWorktreeInVSCode(worktreePath: string): Promise<void> {
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
  
  // Open VS Code via host-bridge
  try {
    console.log(`📤 Opening VS Code via host-bridge...`);
    const success = await hostBridge.vscode_open(worktreePath);
    if (success) {
      console.log('✅ VS Code opened successfully');
      console.log('💡 Claude will auto-start if .vscode/tasks.json is configured');
    } else {
      console.log('💡 Please ensure host-bridge daemon is running');
      console.log('💡 Run: ./.local/bin/host-bridge-daemon.sh');
    }
  } catch (error) {
    console.error('❌ Failed to open VS Code:', (error as Error).message);
    console.log('💡 Please ensure host-bridge daemon is running');
    console.log('💡 Run: ./.local/bin/host-bridge-daemon.sh');
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

  openWorktreeInVSCode(worktreePath).catch(error => {
    console.error('❌ Failed to open worktree:', error);
    process.exit(1);
  });
}