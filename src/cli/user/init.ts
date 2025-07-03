/**
 * APM Init Command - Initialize new agent sessions
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { spawn } from 'child_process';
import * as path from 'path';
import { SessionFileManager, SessionFile } from '../../sessions/management/session-file-manager';

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
      const manager = new SessionFileManager(sessionsDir);

      // Get current context
      const worktree = argv.worktree || path.basename(process.cwd());
      let branch: string = argv.branch || '';
      
      if (!branch) {
        try {
          const { execSync } = require('child_process');
          branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        } catch {
          branch = 'unknown';
        }
      }

      // Generate session ID
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, '');
      const sessionId = `${argv.role}${argv.specialization ? `-${argv.specialization}` : ''}-${timestamp.substring(0, 15)}`;

      // Create session data
      console.log(chalk.blue('🔄'), `Initializing ${argv.role} agent...`);
      
      const sessionData: SessionFile = {
        session: {
          id: sessionId,
          status: 'active',
          role: argv.role as string,
          specialization: argv.specialization as string | undefined,
          agent_prompt_version: 'v2.1.0',
          conversation_topic: 'Agent initialization and task assignment',
          current_task: 'Awaiting initial task assignment',
          task_status: 'in_progress',
          work_completed: [],
          most_recent_completed_task: undefined,
          work_in_progress: ['Session initialization'],
          next_actions: ['Await user task assignment'],
          blockers: [],
          worktree,
          branch,
          context_file: 'context/latest.md',
          context_remaining_percent: 100,
          estimated_tokens_remaining: 200000,
          created: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          agent_last_seen: new Date().toISOString(),
          user_last_seen: new Date().toISOString(),
          last_context_save: new Date().toISOString(),
          message_count: 0,
          session_duration_minutes: 0,
          github_issues: [],
          related_sessions: [],
          environment: process.env.APM_CONTAINERIZED === 'true' ? 'container' : 'host',
          host_project_path: process.cwd(),
          created_by: process.env.USER || 'unknown',
          auto_archive_after: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        }
      };

      const success = manager.createSession(sessionData);

      if (!success) {
        console.error(chalk.red('✗'), 'Failed to create session');
        process.exit(1);
      }

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
      console.log(chalk.dim('💡 Claude conversation UUID will be captured for future restoration'));
      
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