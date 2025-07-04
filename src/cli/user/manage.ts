/**
 * APM Session Management Commands - complete sessions
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionFileManager } from '../../sessions/management/session-file-manager';

export function completeCommand(yargs: Argv) {
  return yargs.command(
    'complete <session-id>',
    'Mark a session as completed',
    (yargs) => {
      return yargs
        .positional('session-id', {
          describe: 'Session ID to complete',
          type: 'string'
        })
        .option('summary', {
          alias: 's',
          type: 'string',
          description: 'Summary of completed work'
        })
        .example('$0 complete demo-session-001', 'Mark session complete')
        .example('$0 complete demo-session-001 -s "Dark mode implementation finished"', 'Complete with summary');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionFileManager(sessionsDir);
      
      const sessionId = argv['session-id'] as string;
      const summary = argv.summary as string | undefined;
      
      console.log(chalk.blue('✅'), `Completing session: ${sessionId}`);
      const success = manager.completeSession(sessionId);
      
      if (success) {
        console.log(chalk.green('✓'), `Session marked as completed`);
        if (summary) {
          console.log(chalk.dim(`Summary: ${summary}`));
        }
        console.log(chalk.dim('📝 Session archived and available for reference'));
      } else {
        process.exit(1);
      }
    }
  );
}