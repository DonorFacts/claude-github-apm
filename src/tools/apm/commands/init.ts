/**
 * APM Init Command - Initialize new agent sessions
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as path from 'path';
import { SessionManager } from '../session-manager';

export function initCommand(yargs: Argv) {
  return yargs.command(
    'init <role> [specialization]',
    'Initialize a new agent session',
    (yargs) => {
      return yargs
        .positional('role', {
          describe: 'Agent role to initialize',
          type: 'string',
          choices: ['developer', 'prompt-engineer', 'scrum-master', 'architect', 'qa-engineer']
        })
        .positional('specialization', {
          describe: 'Optional specialization for the role',
          type: 'string'
        })
        .option('worktree', {
          alias: 'w',
          type: 'string',
          description: 'Worktree name (defaults to current directory name)'
        })
        .option('branch', {
          alias: 'b',
          type: 'string', 
          description: 'Git branch (defaults to current branch)'
        })
        .option('register-only', {
          type: 'boolean',
          description: 'Only register session, don\'t start Claude instance'
        })
        .example('$0 init developer', 'Initialize a developer agent')
        .example('$0 init developer ui-components', 'Initialize a UI-focused developer')
        .example('$0 init prompt-engineer --register-only', 'Register session without starting Claude');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionManager(sessionsDir);

      // Get current context
      const worktree = argv.worktree || path.basename(process.cwd());
      let branch = argv.branch;
      
      if (!branch) {
        try {
          const { execSync } = require('child_process');
          branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
          branch = 'unknown';
        }
      }

      // Register the session
      console.log(chalk.blue('🔄'), `Initializing ${argv.role} agent...`);
      
      const sessionId = manager.registerSession({
        role: argv.role,
        specialization: argv.specialization,
        worktree,
        branch,
        environment: process.env.APM_CONTAINERIZED === 'true' ? 'container' : 'host'
      });

      // Store session ID for agent to use
      const sessionEnvFile = path.join(process.cwd(), '.apm_session');
      require('fs').writeFileSync(sessionEnvFile, `APM_SESSION_ID=${sessionId}\n`);

      if (argv.registerOnly) {
        console.log(chalk.green('✓'), 'Session registered. Use the session ID in your agent initialization.');
        console.log(chalk.gray(`Session ID: ${sessionId}`));
        return;
      }

      // Start Claude instance with agent initialization
      console.log(chalk.blue('🚀'), 'Starting Claude instance...');
      
      const claudeCommand = path.join('.local', 'bin', 'claude');
      const agentInitCommand = `/agent-${argv.role}-init`;
      
      // Set environment for the Claude session
      const env = {
        ...process.env,
        APM_SESSION_ID: sessionId,
        APM_AGENT_ROLE: argv.role,
        APM_AGENT_SPECIALIZATION: argv.specialization || '',
        APM_CONTAINERIZED: process.env.APM_CONTAINERIZED || 'false'
      };

      console.log(chalk.gray(`Starting: ${claudeCommand} with ${agentInitCommand}`));
      console.log(chalk.gray(`Session: ${sessionId}`));
      
      // Spawn Claude process
      const child = spawn(claudeCommand, [], {
        stdio: 'inherit',
        env
      });

      // Send the initialization command after a brief delay
      setTimeout(() => {
        if (child.stdin && !child.stdin.destroyed) {
          child.stdin.write(`${agentInitCommand}\n`);
        }
      }, 2000);

      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('✓'), 'Agent session completed successfully');
        } else {
          console.log(chalk.yellow('⚠'), `Agent session ended with code ${code}`);
        }
      });

      child.on('error', (error) => {
        console.error(chalk.red('✗'), `Failed to start Claude: ${error.message}`);
        process.exit(1);
      });
    }
  );
}