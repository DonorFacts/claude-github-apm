/**
 * APM List Command - TypeScript implementation
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionFileManager } from '../../sessions/management/session-file-manager';

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
      const manager = new SessionFileManager(sessionsDir);

      // Determine filter based on options
      let filter: 'active' | 'completed' | 'stale' | undefined;
      if (argv.crashed) {
        filter = 'stale'; // Map crashed to stale in new system
      } else if (argv.all) {
        filter = undefined; // Show all
      } else if (argv.filter === 'all') {
        filter = undefined;
      } else if (argv.filter === 'crashed') {
        filter = 'stale'; // Map crashed to stale in new system
      } else {
        filter = argv.filter as 'active' | 'completed';
      }

      const sessions = manager.listSessions(filter);

      if (sessions.length === 0) {
        console.log(chalk.blue('ℹ'), 'No sessions found');
        return;
      }

      // Group sessions by status for better UX  
      const groupedSessions = {
        active: sessions.filter(s => s.session.status === 'active'),
        completed: sessions.filter(s => s.session.status === 'completed'),
        stale: sessions.filter(s => s.session.status === 'stale')
      };

      const activeCnt = groupedSessions.active.length;
      const completedCnt = groupedSessions.completed.length;
      const staleCnt = groupedSessions.stale.length;

      console.log(chalk.bold(`Session Status Report - ${new Date().toLocaleString()}`));
      console.log('='.repeat(50));
      console.log();

      // Helper functions to format time differences with colored indicators
      const formatTimeDiff = (timestamp: string) => {
        const time = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - time.getTime();
        
        const minutes = Math.floor(diffMs / (60 * 1000));
        const hours = Math.floor(diffMs / (60 * 60 * 1000));
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        
        let color, indicator;
        
        if (minutes < 5) {
          color = chalk.green;
          indicator = '🟢';
        } else if (minutes < 30) {
          color = chalk.yellow;
          indicator = '🟡';
        } else if (hours < 2) {
          color = (text: string) => chalk.hex('#FFA500')(text); // Orange color
          indicator = '🟠';
        } else {
          color = chalk.red;
          indicator = '🔴';
        }
        
        let timeText;
        if (minutes < 1) {
          timeText = 'just now';
        } else if (minutes < 60) {
          timeText = `${minutes}m ago`;
        } else if (hours < 24) {
          const remainingMinutes = minutes % 60;
          timeText = remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m ago` : `${hours}h ago`;
        } else {
          const remainingHours = hours % 24;
          timeText = remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`;
        }
        
        return `${indicator} ${color(timeText)}`;
      };

      // Helper function to format session info with enhanced details
      const formatSession = (session: any, statusIcon: string) => {
        const envIcon = session.session.environment === 'container' ? '🐳 ' : '';
        const role = session.session.specialization ? `${session.session.role} (${session.session.specialization})` : session.session.role;
        
        // Format timing with agent/user activity
        const agentTime = session.session.agent_last_seen ? formatTimeDiff(session.session.agent_last_seen) : chalk.dim('unknown');
        const userTime = session.session.user_last_seen ? formatTimeDiff(session.session.user_last_seen) : chalk.dim('unknown');
        
        console.log(`${statusIcon} ${envIcon}${chalk.bold(session.session.id)}`);
        console.log(`   ${chalk.dim('Subject:')} ${session.session.conversation_topic || chalk.dim('No topic set')}`);
        console.log(`   ${chalk.dim('Role:')} ${role}`);
        console.log(`   ${chalk.dim('Worktree:')} ${session.session.worktree}`);
        
        // Show most recent completed task if available
        if (session.session.most_recent_completed_task) {
          console.log(`   ${chalk.dim('Last completed:')} ${session.session.most_recent_completed_task}`);
        }
        
        console.log(`   ${chalk.dim('Last seen:')} Agent ${agentTime}, User ${userTime}`);
        console.log();
      };

      // Display Active Sessions
      if (groupedSessions.active.length > 0) {
        console.log(chalk.green.bold(`🟢 ACTIVE SESSIONS (${activeCnt})`));
        console.log();
        groupedSessions.active.forEach(session => {
          formatSession(session, chalk.green('✓'));
        });
      }

      // Display Stale Sessions  
      if (groupedSessions.stale.length > 0) {
        console.log(chalk.red.bold(`🔴 STALE SESSIONS (${staleCnt})`));
        console.log(chalk.dim('   Sessions inactive >24 hours, need cleanup'));
        console.log();
        groupedSessions.stale.forEach(session => {
          formatSession(session, chalk.red('✗'));
        });
      }

      // Display Completed Sessions
      if (groupedSessions.completed.length > 0) {
        console.log(chalk.gray.bold(`⚪ COMPLETED SESSIONS (${completedCnt})`));
        console.log();
        groupedSessions.completed.forEach(session => {
          formatSession(session, chalk.gray('◎'));
        });
      }

      // Improved Summary
      console.log(chalk.dim('─'.repeat(50)));
      if (!filter) {
        const summary = [];
        if (activeCnt > 0) summary.push(chalk.green(`${activeCnt} active`));
        if (staleCnt > 0) summary.push(chalk.red(`${staleCnt} stale`));
        if (completedCnt > 0) summary.push(chalk.gray(`${completedCnt} completed`));
        console.log(chalk.bold(`Total: ${summary.join(', ')}`));
      } else {
        const filterName = filter.charAt(0).toUpperCase() + filter.slice(1);
        const count = sessions.length;
        console.log(chalk.bold(`${filterName} sessions: ${count}`));
      }
    }
  );
}