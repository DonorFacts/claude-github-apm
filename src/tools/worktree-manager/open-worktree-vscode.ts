#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { platform } from 'os';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Opens VS Code in a worktree directory with Claude auto-launch via tasks.json
 */
export function openWorktreeInVSCode(worktreePath: string): void {
  console.log(`🚀 Opening VS Code in worktree: ${worktreePath}`);
  
  try {
    // Install dependencies in the worktree first
    console.log(`📦 Installing dependencies in worktree...`);
    try {
      execSync(`cd "${worktreePath}" && pnpm install`, { stdio: 'inherit' });
      console.log(`✅ Dependencies installed`);
    } catch (error) {
      console.error(`⚠️  Failed to install dependencies: ${(error as Error).message}`);
      console.log(`💡 You may need to run 'pnpm install' manually in the worktree`);
    }
    
    // Ensure .vscode directory exists in worktree
    const vscodeDir = join(worktreePath, '.vscode');
    if (!existsSync(vscodeDir)) {
      mkdirSync(vscodeDir, { recursive: true });
      console.log('📁 Created .vscode directory in worktree');
    }
    
    // Copy tasks.json to worktree
    const tasksSource = join(dirname(worktreePath), 'claude-github-apm', '.vscode', 'tasks.json');
    const tasksTarget = join(vscodeDir, 'tasks.json');
    
    if (existsSync(tasksSource)) {
      copyFileSync(tasksSource, tasksTarget);
      console.log('📋 Copied tasks.json to worktree (Claude will auto-launch)');
    } else {
      // Create tasks.json if source doesn't exist
      const tasksContent = {
        version: "2.0.0",
        tasks: [
          {
            label: "Claude",
            type: "shell",
            command: "claude",
            presentation: {
              reveal: "always",
              panel: "new",
              focus: true,
              clear: true
            },
            runOptions: {
              runOn: "folderOpen"
            },
            problemMatcher: []
          }
        ]
      };
      
      writeFileSync(tasksTarget, JSON.stringify(tasksContent, null, 2));
      console.log('📋 Created tasks.json in worktree (Claude will auto-launch)');
    }
    
    // Open VS Code at the worktree directory
    const osPlatform = platform();
    
    if (osPlatform === 'darwin') {
      // On macOS, use 'open' command with VS Code
      execSync(`open -a "Visual Studio Code" "${worktreePath}"`, { stdio: 'inherit' });
    } else if (osPlatform === 'win32') {
      // On Windows, try common VS Code paths
      execSync(`start "" "C:\\Program Files\\Microsoft VS Code\\Code.exe" "${worktreePath}"`, { stdio: 'inherit', shell: 'cmd.exe' });
    } else {
      // On Linux, try the code command
      execSync(`code "${worktreePath}"`, { stdio: 'inherit' });
    }
    
    console.log('✅ VS Code opened successfully');
    console.log('🤖 Claude will automatically launch in a new terminal panel');
    console.log('\n📝 Additional info:');
    console.log('   - If Claude doesn\'t auto-start, run task manually:');
    console.log('     1. Press Cmd+Shift+P (or Ctrl+Shift+P)');
    console.log('     2. Type "Tasks: Run Task"');
    console.log('     3. Select "Claude"');
    console.log('   - To run Claude manually: Open terminal (Ctrl+`) and type "claude"');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('   Please ensure VS Code is installed');
  }
}

// CLI execution
if (require.main === module) {
  // Get worktree path from command line argument
  const worktreePath = process.argv[2];

  if (!worktreePath) {
    console.error('❌ Usage: tsx open-worktree-vscode.ts <worktree-path>');
    console.error('   Example: tsx open-worktree-vscode.ts ../worktrees/feature-branch');
    process.exit(1);
  }

  openWorktreeInVSCode(worktreePath);
}