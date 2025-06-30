#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Opens VS Code in a worktree directory after installing dependencies.
 * Uses the host VS Code daemon for container/host communication.
 * This script exists because Claude Code cannot cd outside the original directory,
 * but we need to run pnpm install in the worktree. Using execSync with cwd option
 * solves this limitation.
 */

/**
 * Request VS Code to open via the host daemon
 */
function requestVSCodeOpen(worktreePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const queueFile = path.join(process.cwd(), '.local', 'vscode-queue');
    const responseFile = path.join(process.cwd(), '.local', 'vscode-response');
    
    // Clear any existing response
    if (existsSync(responseFile)) {
      writeFileSync(responseFile, '');
    }
    
    // Send request to daemon
    const request = {
      action: 'open',
      path: worktreePath,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📤 Sending VS Code request to host daemon...`);
    writeFileSync(queueFile, JSON.stringify(request) + '\n');
    
    // Poll for response with timeout
    const startTime = Date.now();
    const timeout = 10000; // 10 seconds
    
    const checkResponse = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for VS Code daemon response'));
        return;
      }
      
      if (existsSync(responseFile)) {
        try {
          const responseContent = readFileSync(responseFile, 'utf8').trim();
          if (responseContent) {
            const response = JSON.parse(responseContent);
            if (response.status === 'success') {
              console.log(`✅ ${response.message}`);
              resolve(true);
            } else {
              console.error(`❌ VS Code daemon error: ${response.message}`);
              resolve(false);
            }
            return;
          }
        } catch (error) {
          // Response file exists but may be empty or invalid, continue polling
        }
      }
      
      // Continue polling
      setTimeout(checkResponse, 200);
    };
    
    checkResponse();
  });
}
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
  
  // Open VS Code via daemon
  try {
    const success = await requestVSCodeOpen(worktreePath);
    if (success) {
      console.log('💡 Claude will auto-start if .vscode/tasks.json is configured');
    } else {
      console.log('💡 Please ensure VS Code daemon is running (pnpm start)');
      console.log('💡 And that VS Code command line tools are installed on host');
    }
  } catch (error) {
    console.error('❌ Failed to open VS Code:', (error as Error).message);
    console.log('💡 Please ensure VS Code daemon is running (pnpm start)');
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