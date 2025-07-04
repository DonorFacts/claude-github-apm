#!/usr/bin/env tsx

/**
 * Stop command watcher for current worktree
 */

import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const worktreeName = process.cwd().split('/').pop() || 'main';
const pidFile = join(homedir(), '.claude', `command-watcher-${worktreeName}.pid`);

if (!existsSync(pidFile)) {
  console.log('No command watcher running for this worktree');
  process.exit(0);
}

try {
  const pid = parseInt(readFileSync(pidFile, 'utf8'));
  process.kill(pid, 'SIGTERM');
  unlinkSync(pidFile);
  console.log(`✅ Stopped command watcher (PID: ${pid})`);
} catch (error) {
  console.error('Failed to stop command watcher:', error);
  // Clean up PID file anyway
  if (existsSync(pidFile)) {
    unlinkSync(pidFile);
  }
}