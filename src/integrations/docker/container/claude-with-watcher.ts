#!/usr/bin/env tsx

/**
 * Claude Code wrapper - simplified version
 * Command watcher is now handled separately on host side
 */

import { spawn } from 'child_process';

class ClaudeWrapper {
  private startClaude(): void {
    // Pass all arguments to Claude Code
    const args = process.argv.slice(2);
    
    // Execute Claude Code directly
    spawn('/usr/local/bin/claude', ['--dangerously-skip-permissions', ...args], {
      stdio: 'inherit',
      shell: false
    }).on('exit', (code) => {
      process.exit(code || 0);
    });
  }
  
  public run(): void {
    this.startClaude();
  }
}

// Run if executed directly
if (require.main === module) {
  const wrapper = new ClaudeWrapper();
  wrapper.run();
}