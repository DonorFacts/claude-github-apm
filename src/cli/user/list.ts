/**
 * APM List Command - TypeScript implementation
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionManager } from '../../sessions/management/manager';

export function listCommand(yargs: Argv) {
  return yargs.command(
    'list [filter]',
    'Show agent sessions',
    (yargs) => {
      return yargs
        .positional('filter', {
          describe: 'Filter sessions by status',
          choices: ['active', 'crashed', 'completed', 'all'] as const,
          default: 'active'
        })
        .option('crashed', {
          alias: 'c',
          type: 'boolean',
          description: 'Show only crashed sessions (equivalent to --filter crashed)'
        })
        .option('all', {
          alias: 'a', 
          type: 'boolean',
          description: 'Show all sessions (equivalent to --filter all)'
        })
        .example('$0 list', 'Show active sessions')
        .example('$0 list --crashed', 'Show crashed sessions')
        .example('$0 list --all', 'Show all sessions')
        .example('$0 list crashed', 'Show crashed sessions');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionManager(sessionsDir);

      // Determine filter based on options
      let filter: 'active' | 'crashed' | 'completed' | undefined;
      if (argv.crashed) {
        filter = 'crashed';
      } else if (argv.all) {
        filter = undefined; // Show all
      } else if (argv.filter === 'all') {
        filter = undefined;
      } else {
        filter = argv.filter as 'active' | 'crashed' | 'completed';
      }

      const sessions = manager.listSessions(filter);

      if (sessions.length === 0) {
        console.log(chalk.blue('ℹ'), 'No sessions found');
        return;
      }

      console.log(chalk.bold(`Session Status Report - ${new Date().toLocaleString()}`));
      console.log('='.repeat(50));
      console.log();

      let activeCnt = 0;
      let crashedCnt = 0;
      let completedCnt = 0;

      for (const session of sessions) {
        // Status icon and counting
        let statusIcon: string;
        switch (session.status) {
          case 'active':
            statusIcon = chalk.green('✓');
            activeCnt++;
            break;
          case 'crashed':
            statusIcon = chalk.red('✗');
            crashedCnt++;
            break;
          case 'completed':
            statusIcon = chalk.gray('◎');
            completedCnt++;
            break;
        }

        // Time since last activity
        const lastHeartbeat = new Date(session.last_heartbeat);
        const now = new Date();
        const diffMs = now.getTime() - lastHeartbeat.getTime();
        
        let timeDiff: string;
        if (diffMs < 60 * 1000) {
          timeDiff = 'just now';
        } else if (diffMs < 60 * 60 * 1000) {
          timeDiff = `${Math.floor(diffMs / (60 * 1000))}m ago`;
        } else if (diffMs < 24 * 60 * 60 * 1000) {
          timeDiff = `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
        } else {
          timeDiff = `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}d ago`;
        }

        // Environment indicator
        const envIcon = session.environment === 'container' ? '🐳 ' : '';

        console.log(`${statusIcon} ${envIcon}${session.id}`);
        console.log(`   Role: ${session.role}${session.specialization ? ` (${session.specialization})` : ''}`);
        console.log(`   Worktree: ${session.worktree}`);
        console.log(`   Branch: ${session.branch}`);
        console.log(`   Last seen: ${timeDiff}`);
        console.log();
      }

      // Summary
      if (!filter) {
        console.log(chalk.bold(`Summary: ${activeCnt} active, ${crashedCnt} crashed, ${completedCnt} completed`));
      } else if (filter === 'active') {
        console.log(chalk.bold(`Active sessions: ${activeCnt}`));
      } else if (filter === 'crashed') {
        console.log(chalk.bold(`Crashed sessions: ${crashedCnt}`));
      } else if (filter === 'completed') {
        console.log(chalk.bold(`Completed sessions: ${completedCnt}`));
      }
    }
  );
}