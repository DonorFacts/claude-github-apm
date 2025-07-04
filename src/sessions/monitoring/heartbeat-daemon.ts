#!/usr/bin/env tsx
/**
 * Heartbeat Daemon - Keeps agent sessions alive
 * Runs in background sending heartbeats every 30 seconds
 */

import { spawn } from 'child_process';
import * as fs from 'fs';

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Error: Session ID required');
  console.error('Usage: heartbeat-daemon.ts <session-id>');
  process.exit(1);
}

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const LOG_FILE = `/tmp/apm_heartbeat_${sessionId}.log`;

// Write PID for cleanup tracking
fs.writeFileSync(`/tmp/apm_heartbeat_${sessionId}.pid`, process.pid.toString());

console.log(`♥️ Heartbeat daemon started for session: ${sessionId}`);
console.log(`   PID: ${process.pid}`);
console.log(`   Interval: ${HEARTBEAT_INTERVAL / 1000}s`);
console.log(`   Log: ${LOG_FILE}`);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n💔 Heartbeat daemon stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n💔 Heartbeat daemon terminated');
  process.exit(0);
});

// Main heartbeat loop
async function sendHeartbeat() {
  const timestamp = new Date().toISOString();
  
  try {
    // Use pnpm cli heartbeat command
    const child = spawn('pnpm', ['cli', 'heartbeat', sessionId, '--silent'], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] ✓ Heartbeat sent\n`);
      } else {
        fs.appendFileSync(LOG_FILE, `[${timestamp}] ✗ Heartbeat failed: ${error || output}\n`);
      }
    });

    // Don't wait for child to complete
    child.unref();

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ✗ Error: ${errorMsg}\n`);
  }
}

// Initial heartbeat
sendHeartbeat();

// Schedule regular heartbeats
const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

// Keep the process running
process.stdin.resume();