#!/usr/bin/env tsx
/**
 * /register-session Slash Command
 * Called by agents during initialization to register their session
 */

import chalk from 'chalk';
import * as path from 'path';
import { SessionManager } from '../tools/apm/session-manager';

interface RegisterSessionArgs {
  role: string;
  specialization?: string;
  worktree?: string;
  branch?: string;
  environment?: 'container' | 'host';
}

async function registerSession(args: RegisterSessionArgs): Promise<string> {
  const sessionsDir = process.env.APM_SESSIONS || path.resolve('..', 'apm', 'sessions');
  const manager = new SessionManager(sessionsDir);

  // Auto-detect current context if not provided
  const worktree = args.worktree || path.basename(process.cwd());
  let branch = args.branch;
  
  if (!branch) {
    try {
      const { execSync } = require('child_process');
      branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      branch = 'unknown';
    }
  }

  // Detect container environment
  const environment = args.environment || 
    (process.env.APM_CONTAINERIZED === 'true' ? 'container' : 'host');

  console.log(chalk.blue('📝'), 'Registering agent session...');
  
  const sessionId = manager.registerSession({
    role: args.role,
    specialization: args.specialization,
    worktree,
    branch,
    environment
  });

  // Store session ID for this process
  process.env.APM_SESSION_ID = sessionId;
  
  // Also write to file for other tools to access
  const sessionFile = path.join(process.cwd(), '.apm_session');
  require('fs').writeFileSync(sessionFile, `APM_SESSION_ID=${sessionId}\n`);

  console.log(chalk.green('✅'), `Session registered: ${sessionId}`);
  console.log(chalk.gray(`Environment: ${environment === 'container' ? '🐳 Container' : '💻 Host'}`));
  console.log(chalk.gray(`Worktree: ${worktree}`));
  console.log(chalk.gray(`Branch: ${branch}`));

  return sessionId;
}

// Command-line interface for slash command usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(chalk.red('Error: Role is required'));
    console.error('Usage: register-session.ts <role> [specialization]');
    console.error('Example: register-session.ts developer ui-components');
    process.exit(1);
  }

  const [role, specialization] = args;
  
  registerSession({ role, specialization })
    .then(sessionId => {
      console.log(sessionId); // For script consumption
    })
    .catch(error => {
      console.error(chalk.red('Registration failed:'), error.message);
      process.exit(1);
    });
}

export { registerSession };