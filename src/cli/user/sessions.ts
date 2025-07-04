/**
 * APM Sessions Command - Enhanced session management with file-based organization
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionFileManager, SessionStatus, TaskStatus } from '../../sessions/management/session-file-manager';

export function sessionsCommand(yargs: Argv) {
  return yargs.command(
    'sessions [filter]',
    'List and manage agent sessions with enhanced UX',
    (yargs) => {
      return yargs
        .positional('filter', {
          describe: 'Filter sessions by status',
          choices: ['active', 'paused', 'completed', 'stale', 'all'] as const,
          default: 'all'
        })
        .option('organize', {
          alias: 'o',
          type: 'boolean',
          description: 'Auto-organize sessions based on activity age'
        })
        .option('topic', {
          alias: 't',
          type: 'string',
          description: 'Filter by conversation topic (fuzzy search)'
        })
        .option('role', {
          alias: 'r',
          type: 'string',
          description: 'Filter by agent role'
        })
        .example('$0 sessions', 'Show all sessions grouped by status')
        .example('$0 sessions active', 'Show only active sessions')
        .example('$0 sessions --topic "dark mode"', 'Find sessions about dark mode')
        .example('$0 sessions --organize', 'Auto-organize sessions and show results');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionFileManager(sessionsDir);

      // Auto-organize if requested
      if (argv.organize) {
        console.log(chalk.blue('🔄'), 'Auto-organizing sessions...');
        manager.autoOrganizeSessions();
        console.log();
      }

      // Get sessions based on filter
      const filter = argv.filter === 'all' ? undefined : argv.filter as SessionStatus;
      let sessions = manager.listSessions(filter);

      // Apply additional filters
      if (argv.topic) {
        const topicFilter = argv.topic.toLowerCase();
        sessions = sessions.filter(s => 
          s.session.conversation_topic.toLowerCase().includes(topicFilter) ||
          s.session.current_task.toLowerCase().includes(topicFilter)
        );
      }

      if (argv.role) {
        sessions = sessions.filter(s => s.session.role === argv.role);
      }

      if (sessions.length === 0) {
        console.log(chalk.blue('ℹ'), 'No sessions found matching criteria');
        return;
      }

      // Group sessions by status for better UX
      const groupedSessions = {
        active: sessions.filter(s => s.session.status === 'active'),
        completed: sessions.filter(s => s.session.status === 'completed'),
        stale: sessions.filter(s => s.session.status === 'stale')
      };

      console.log(chalk.bold(`🧠 APM Collective Intelligence - Session Overview`));
      console.log('='.repeat(60));
      console.log();

      // Helper function to format time diff
      const formatTimeDiff = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        
        if (diffMs < 60 * 1000) {
          return 'just now';
        } else if (diffMs < 60 * 60 * 1000) {
          return `${Math.floor(diffMs / (60 * 1000))}m ago`;
        } else if (diffMs < 24 * 60 * 60 * 1000) {
          return `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
        } else {
          return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))}d ago`;
        }
      };

      // Helper function to format task status
      const formatTaskStatus = (status: TaskStatus) => {
        switch (status) {
          case 'in_progress': return chalk.yellow('🔄 IN PROGRESS');
          case 'blocked': return chalk.red('⛔ BLOCKED');
          case 'completed': return chalk.green('✅ COMPLETED');
          case 'review_needed': return chalk.blue('📋 NEEDS REVIEW');
          default: return status;
        }
      };

      // Helper function to format session
      const formatSession = (session: any) => {
        const envIcon = session.session.environment === 'container' ? '🐳 ' : '💻 ';
        const timeDiff = formatTimeDiff(session.session.last_activity);
        const role = session.session.specialization 
          ? `${session.session.role} (${session.session.specialization})`
          : session.session.role;
        
        console.log(`   ${envIcon}${chalk.bold(session.session.id)}`);
        console.log(`   ${chalk.dim('Role:')} ${role}`);
        console.log(`   ${chalk.dim('Topic:')} ${session.session.conversation_topic}`);
        console.log(`   ${chalk.dim('Task:')} ${session.session.current_task}`);
        console.log(`   ${chalk.dim('Status:')} ${formatTaskStatus(session.session.task_status)}`);
        console.log(`   ${chalk.dim('Branch:')} ${session.session.branch}`);
        console.log(`   ${chalk.dim('Context:')} ${session.session.context_remaining_percent}% remaining | ${session.session.message_count} messages`);
        console.log(`   ${chalk.dim('Last seen:')} ${timeDiff}`);
        
        // Show blockers if any
        if (session.session.blockers && session.session.blockers.length > 0) {
          console.log(`   ${chalk.dim('Blockers:')} ${chalk.red(session.session.blockers.join(', '))}`);
        }
        
        // Show next actions if any
        if (session.session.next_actions && session.session.next_actions.length > 0) {
          console.log(`   ${chalk.dim('Next:')} ${session.session.next_actions[0]}`);
        }
        
        console.log();
      };

      // Display Active Sessions
      if (groupedSessions.active.length > 0) {
        console.log(chalk.green.bold(`🟢 ACTIVE SESSIONS (${groupedSessions.active.length})`));
        console.log();
        groupedSessions.active.forEach(formatSession);
      }

      // Display Completed Sessions
      if (groupedSessions.completed.length > 0) {
        console.log(chalk.blue.bold(`🔵 COMPLETED SESSIONS (${groupedSessions.completed.length})`));
        console.log(chalk.dim('   Finished work, archived for reference'));
        console.log();
        groupedSessions.completed.forEach(formatSession);
      }

      // Display Stale Sessions
      if (groupedSessions.stale.length > 0) {
        console.log(chalk.gray.bold(`⚫ STALE SESSIONS (${groupedSessions.stale.length})`));
        console.log(chalk.dim('   Inactive >24h, candidates for cleanup'));
        console.log();
        groupedSessions.stale.forEach(formatSession);
      }

      // Summary
      const totalActive = groupedSessions.active.length;
      const totalCompleted = groupedSessions.completed.length;
      const totalStale = groupedSessions.stale.length;
      const total = totalActive + totalCompleted + totalStale;

      console.log(chalk.dim('─'.repeat(60)));
      const summary = [];
      if (totalActive > 0) summary.push(chalk.green(`${totalActive} active`));
      if (totalCompleted > 0) summary.push(chalk.blue(`${totalCompleted} completed`));
      if (totalStale > 0) summary.push(chalk.gray(`${totalStale} stale`));
      
      console.log(chalk.bold(`Total: ${summary.join(', ')} (${total} sessions)`));
      
      if (totalStale > 0) {
        console.log();
        console.log(chalk.dim('💡 Use'), chalk.white('pnpm cli cleanup'), chalk.dim('to archive stale sessions'));
      }
    }
  );
}