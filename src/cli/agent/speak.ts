#!/usr/bin/env tsx
/**
 * Agent Speak Command - Enhanced speak with automatic activity tracking
 * 
 * Usage: pnpm cli speak "message"
 */

import { Argv } from 'yargs';
import { spawn } from 'child_process';
import { SessionFileManager } from '../../sessions/management/session-file-manager';
import chalk from 'chalk';

export function speakCommand(yargs: Argv) {
  return yargs.command(
    'speak <message>',
    'Provide speech feedback with automatic activity tracking',
    (yargs) => {
      return yargs
        .positional('message', {
          describe: 'Message to speak',
          type: 'string'
        })
        .example('$0 speak "Task completed successfully"', 'Speak with automatic activity tracking')
        .example('$0 speak "Found the bug in authentication module"', 'Report findings with activity update');
    },
    async (argv) => {
      const message = argv.message as string;
      
      // Update agent activity automatically
      await updateAgentActivity();
      
      // Call the original speech helper
      const speakProcess = spawn('tsx', [
        'src/integrations/docker/host-bridge/container/cli/speech.ts',
        message
      ], {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      speakProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(chalk.red('✗'), `Speech command failed with code ${code}`);
          process.exit(1);
        }
      });
      
      speakProcess.on('error', (error) => {
        console.error(chalk.red('✗'), `Speech command error: ${error.message}`);
        process.exit(1);
      });
    }
  );
}

async function updateAgentActivity(): Promise<void> {
  const sessionId = process.env.APM_SESSION_ID;
  if (!sessionId) {
    // Silent fail - activity tracking is optional if no session
    return;
  }

  try {
    const sessionsDir = process.env.APM_SESSIONS || 'apm/sessions';
    const manager = new SessionFileManager(sessionsDir);
    manager.updateActivityTimestamps(sessionId, true, false);
  } catch (error) {
    // Silent fail - don't break speech if activity tracking fails
  }
}