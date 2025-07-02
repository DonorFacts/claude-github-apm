#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { hostBridge } from '../../integrations/docker/host-bridge/index';

/**
 * Opens VS Code in a worktree directory after minimal dependency setup.
 * Uses the unified host-bridge system for container/host communication.
 * 
 * Architecture:
 * - Container: Installs basic deps for module resolution only
 * - Host: Handles runtime commands (pnpm start, watch, etc.) with correct platform binaries
 * - This separation avoids cross-platform binary issues
 */
async function openWorktreeInVSCode(worktreePath: string): Promise<void> {
  console.log(`🚀 Opening worktree: ${worktreePath}`);
  
  // Verify worktree exists
  if (!existsSync(worktreePath)) {
    console.error(`❌ Worktree path does not exist: ${worktreePath}`);
    process.exit(1);
  }
  
  // Install basic dependencies for module resolution (container-only)
  // Host will reinstall with correct platform binaries when needed
  console.log(`📦 Installing basic dependencies for module resolution...`);
  try {
    execSync('pnpm install --ignore-scripts', { 
      stdio: 'inherit',
      cwd: worktreePath
    });
    console.log(`✅ Basic dependencies installed`);
    console.log(`💡 Host will reinstall with platform-specific binaries as needed`);
  } catch (error) {
    console.error(`⚠️  Failed to install dependencies: ${(error as Error).message}`);
    console.log(`💡 Host can run 'pnpm install' to get platform-specific binaries`);
  }
  
  // Open VS Code via host-bridge
  try {
    console.log(`📤 Opening VS Code via host-bridge...`);
    const success = await hostBridge.vscode_open(worktreePath);
    if (success) {
      console.log('✅ VS Code opened successfully');
      console.log('💡 Run `pnpm start` in VS Code terminal for development server');
      console.log('💡 Host will install platform-specific binaries automatically');
    } else {
      console.log('💡 Please ensure host-bridge daemon is running');
      console.log('💡 Run: ./src/integrations/docker/host-bridge/daemons/host-bridge-daemon.sh');
    }
  } catch (error) {
    console.error('❌ Failed to open VS Code:', (error as Error).message);
    console.log('💡 Please ensure host-bridge daemon is running');
    console.log('💡 Run: ./src/integrations/docker/host-bridge/daemons/host-bridge-daemon.sh');
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