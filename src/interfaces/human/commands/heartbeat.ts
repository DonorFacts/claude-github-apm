/**
 * APM Heartbeat Command - Update session heartbeat
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionManager } from '../../../services/session/manager';

export function heartbeatCommand(yargs: Argv) {
  return yargs.command(
    'heartbeat <session-id>',
    'Update session heartbeat (internal use)',
    (yargs) => {
      return yargs
        .positional('session-id', {
          describe: 'Session ID to update',
          type: 'string'
        })
        .option('silent', {
          alias: 's',
          type: 'boolean',
          description: 'Silent mode - no output except errors'
        })
        .example('$0 heartbeat developer-ui-20250702-030000', 'Update heartbeat for session');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionManager(sessionsDir);

      const success = manager.updateHeartbeat(argv.sessionId);
      
      if (!argv.silent) {
        if (success) {
          console.log(chalk.green('✓'), `Heartbeat updated for ${argv.sessionId}`);
        } else {
          console.error(chalk.red('✗'), `Failed to update heartbeat for ${argv.sessionId}`);
        }
      }

      process.exit(success ? 0 : 1);
    }
  );
}