#!/usr/bin/env tsx
/**
 * Watch Processes Module
 * Manages background watch processes for APM system
 */

import { spawn, execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, basename } from 'path';

// Environment variables
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const CURRENT_WORKTREE = basename(process.cwd());

// PID file paths
const HOST_BRIDGE_PID_FILE = '/tmp/apm-watch-processes.pid';
const COMMAND_WATCHER_PID_FILE = `/tmp/apm-command-watcher-${CURRENT_WORKTREE}.pid`;
const COMMAND_WATCHER_LOG_FILE = `/tmp/apm-command-watcher-${CURRENT_WORKTREE}.log`;

/**
 * Check if a process is running
 */
function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read PID from file
 */
function readPidFile(pidFile: string): number | null {
  if (!existsSync(pidFile)) return null;
  try {
    const pid = parseInt(readFileSync(pidFile, 'utf8').trim(), 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Write PID to file
 */
function writePidFile(pidFile: string, pid: number): void {
  writeFileSync(pidFile, pid.toString());
}

/**
 * Start host-bridge daemon if not already running
 */
function startHostBridgeDaemon(): void {
  const existingPid = readPidFile(HOST_BRIDGE_PID_FILE);
  
  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`📋 Host-bridge daemon already running (PID: ${existingPid})`);
    return;
  }

  if (existingPid) {
    console.log('🔄 Cleaning up stale PID file...');
    unlinkSync(HOST_BRIDGE_PID_FILE);
  }

  console.log('🚀 Starting host-bridge daemon on host...');
  
  // Change to project directory
  const projectDir = existsSync(join(PROJECT_ROOT, 'main')) 
    ? join(PROJECT_ROOT, 'main') 
    : PROJECT_ROOT;
  
  const child = spawn('pnpm', ['start'], {
    cwd: projectDir,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore']
  });
  
  child.unref();
  writePidFile(HOST_BRIDGE_PID_FILE, child.pid!);
  console.log(`✅ Host-bridge daemon started (PID: ${child.pid}, logs: /tmp/apm-host-bridge.log)`);
}

/**
 * Start command watcher for the current worktree only
 */
function startCommandWatcherProcess(): void {
  const existingPid = readPidFile(COMMAND_WATCHER_PID_FILE);
  
  if (existingPid && isProcessRunning(existingPid)) {
    console.log(`📋 Command watcher already running for ${CURRENT_WORKTREE} (PID: ${existingPid})`);
    return;
  }

  if (existingPid) {
    console.log('🔄 Cleaning up stale command watcher PID file...');
    unlinkSync(COMMAND_WATCHER_PID_FILE);
  }

  console.log(`🚀 Starting command watcher for ${CURRENT_WORKTREE}...`);
  
  // Change to project directory
  const projectDir = existsSync(join(PROJECT_ROOT, 'main')) 
    ? join(PROJECT_ROOT, 'main') 
    : PROJECT_ROOT;
  
  const child = spawn('pnpm', ['run', 'start-command-watcher'], {
    cwd: projectDir,
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
    env: { ...process.env, WORKTREE_NAME: CURRENT_WORKTREE }
  });
  
  child.unref();
  writePidFile(COMMAND_WATCHER_PID_FILE, child.pid!);
  console.log(`✅ Command watcher started (PID: ${child.pid}, logs: ${COMMAND_WATCHER_LOG_FILE})`);
}

/**
 * Start all watch processes
 */
export function startWatchProcesses(): void {
  startHostBridgeDaemon();
  startCommandWatcherProcess();
}

/**
 * Stop all watch processes for the current worktree
 */
export function stopWatchProcesses(): void {
  console.log('🛑 Stopping watch processes...');
  
  // Stop host-bridge daemon (shared across all worktrees)
  const hostBridgePid = readPidFile(HOST_BRIDGE_PID_FILE);
  if (hostBridgePid && isProcessRunning(hostBridgePid)) {
    console.log(`🛑 Stopping host-bridge daemon (PID: ${hostBridgePid})...`);
    try {
      process.kill(hostBridgePid, 'SIGTERM');
    } catch (e) {
      console.error('Failed to stop host-bridge daemon:', e);
    }
  }
  if (existsSync(HOST_BRIDGE_PID_FILE)) {
    unlinkSync(HOST_BRIDGE_PID_FILE);
  }
  
  // Stop command watcher for current worktree only
  const commandWatcherPid = readPidFile(COMMAND_WATCHER_PID_FILE);
  if (commandWatcherPid && isProcessRunning(commandWatcherPid)) {
    console.log(`🛑 Stopping command watcher for ${CURRENT_WORKTREE} (PID: ${commandWatcherPid})...`);
    try {
      process.kill(commandWatcherPid, 'SIGTERM');
    } catch (e) {
      console.error('Failed to stop command watcher:', e);
    }
  }
  if (existsSync(COMMAND_WATCHER_PID_FILE)) {
    unlinkSync(COMMAND_WATCHER_PID_FILE);
  }
  
  console.log('✅ Watch processes stopped');
}

// Handle direct execution
if (require.main === module) {
  const command = process.argv[2] || 'start';
  
  switch (command) {
    case 'start':
      startWatchProcesses();
      break;
    case 'stop':
      stopWatchProcesses();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Usage: tsx watch-processes.ts [start|stop]');
      process.exit(1);
  }
}