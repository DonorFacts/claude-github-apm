#!/usr/bin/env node

import { FileWatcher } from './file-watcher';
import * as path from 'path';

interface SyncOptions {
  watch?: boolean;
  sourcePath?: string;
  targetPath?: string;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: SyncOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--source':
      case '-s':
        options.sourcePath = args[++i];
        break;
      case '--target':
      case '-t':
        options.targetPath = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  // Set default paths
  const sourcePath = options.sourcePath || 'src/prompts';
  const targetPath = options.targetPath || '.claude/commands';
  
  // Update terminal title
  const mode = options.watch ? 'Watch' : 'Sync';
  const title = `📁 Command ${mode}`;
  process.stdout.write(`\x1b]0;${title}\x07`);
  process.stdout.write(`\x1b]2;${title}\x1b\\`);
  
  console.log(`Command Sync System`);
  console.log(`Source: ${sourcePath}`);
  console.log(`Targets: ${targetPath} and -/`);
  console.log(`Mode: ${options.watch ? 'Watch' : 'Sync Once'}`);
  console.log('');
  
  // Create file watcher
  const watcher = new FileWatcher({
    sourcePath,
    targetPath,
    syncOnStart: true
  });
  
  try {
    // Start the watcher
    await watcher.start();
    console.log('✓ Initial sync completed');
    
    if (options.watch) {
      console.log('👀 Watching for changes...');
      console.log('Press Ctrl+C to stop');
      
      // Update title to show watching status
      const watchTitle = `👀 Commands Watch`;
      process.stdout.write(`\x1b]0;${watchTitle}\x07`);
      process.stdout.write(`\x1b]2;${watchTitle}\x1b\\`);
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n\nStopping file watcher...');
        await watcher.stop();
        process.exit(0);
      });
      
      // Prevent the process from exiting
      process.stdin.resume();
    } else {
      // Stop watcher after initial sync
      await watcher.stop();
      console.log('✓ Sync completed');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
Command Sync System - Sync prompts to Claude commands

Usage: command-sync [options]

Options:
  -w, --watch      Watch for changes and sync automatically
  -s, --source     Source directory (default: src/prompts)
  -t, --target     Target directory (default: .claude/commands)
  -h, --help       Show this help message

Examples:
  # Sync once
  command-sync
  
  # Watch for changes
  command-sync --watch
  
  # Custom paths
  command-sync --source custom/prompts --target custom/commands
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FileWatcher, SyncOptions };