#!/usr/bin/env tsx
/**
 * Agent Activity Tracker - CLI commands for tracking session activity
 * 
 * Usage via CLI:
 * - pnpm cli track-agent
 * - pnpm cli track-user
 * - pnpm cli task-done "Completed dark mode implementation"
 */

import { Argv } from 'yargs';
import { SessionFileManager } from '../../sessions/management/session-file-manager';
import chalk from 'chalk';

export function trackAgentCommand(yargs: Argv) {
  return yargs.command(
    'track-agent',
    'Update agent activity timestamp',
    () => {},
    async () => {
      await updateActivity(true, false);
    }
  );
}

export function trackUserCommand(yargs: Argv) {
  return yargs.command(
    'track-user', 
    'Update user activity timestamp',
    () => {},
    async () => {
      await updateActivity(false, true);
    }
  );
}

export function taskDoneCommand(yargs: Argv) {
  return yargs.command(
    'task-done <description>',
    'Mark a task as completed',
    (yargs) => {
      return yargs
        .positional('description', {
          describe: 'Description of the completed task',
          type: 'string'
        })
        .example('$0 task-done "Implemented user authentication"', 'Mark task complete')
        .example('$0 task-done "Fixed critical payment bug"', 'Mark another task complete');
    },
    async (argv) => {
      const description = argv.description as string;
      await markTaskComplete(description);
    }
  );
}

async function updateActivity(agentActive: boolean, userActive: boolean): Promise<void> {
  const sessionId = process.env.APM_SESSION_ID;
  if (!sessionId) {
    console.error(chalk.red('✗'), 'No APM_SESSION_ID found in environment');
    process.exit(1);
  }

  try {
    const sessionsDir = process.env.APM_SESSIONS || 'apm/sessions';
    const manager = new SessionFileManager(sessionsDir);
    
    const success = manager.updateActivityTimestamps(sessionId, agentActive, userActive);
    if (success) {
      const activities = [];
      if (agentActive) activities.push('agent');
      if (userActive) activities.push('user');
      console.log(chalk.green('✓'), `Activity updated for: ${activities.join(', ')}`);
    } else {
      console.error(chalk.red('✗'), `Failed to update activity for session: ${sessionId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('✗'), `Error updating activity: ${error}`);
    process.exit(1);
  }
}

async function markTaskComplete(description: string): Promise<void> {
  const sessionId = process.env.APM_SESSION_ID;
  if (!sessionId) {
    console.error(chalk.red('✗'), 'No APM_SESSION_ID found in environment');
    process.exit(1);
  }

  try {
    const sessionsDir = process.env.APM_SESSIONS || 'apm/sessions';
    const manager = new SessionFileManager(sessionsDir);
    
    const success = manager.updateCompletedTask(sessionId, description);
    if (!success) {
      console.error(chalk.red('✗'), `Failed to mark task complete for session: ${sessionId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('✗'), `Error marking task complete: ${error}`);
    process.exit(1);
  }
}