#!/usr/bin/env tsx
/**
 * Common utilities for APM CLI (TypeScript conversion from common.sh)
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as path from 'path';

// Logging functions with chalk styling
export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function logSuccess(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function logWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function logError(message: string): void {
  console.error(chalk.red('✗'), message);
}

// Session management utilities
export function getSessionRegistry(): string {
  const apmSessions = process.env.APM_SESSIONS || path.resolve('..', 'apm', 'sessions');
  return path.join(apmSessions, 'registry.yaml');
}

export function generateSessionId(role: string = 'unknown', specialization: string = 'general'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
  return `${role}-${specialization}-${timestamp}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Check if session is stale (no heartbeat >2 minutes)
export function isSessionStale(lastHeartbeat: string): boolean {
  const currentTime = Date.now();
  const heartbeatTime = new Date(lastHeartbeat).getTime();
  const diff = currentTime - heartbeatTime;
  
  // Stale if >120 seconds (2 minutes)
  return diff > 120 * 1000;
}

// VS Code window detection
export function getVSCodeWindows(): string {
  // Simple approach: get terminal session info
  // This would be enhanced with actual VS Code window detection
  return `VS Code - ${path.basename(process.cwd())}`;
}

// Git context
export function getGitContext(): string {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
    const uncommitted = statusOutput.split('\n').filter(line => line.trim()).length;
    return `branch:${branch},uncommitted:${uncommitted}`;
  } catch {
    return 'branch:unknown,uncommitted:0';
  }
}