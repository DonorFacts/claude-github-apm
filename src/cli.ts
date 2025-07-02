#!/usr/bin/env tsx
/**
 * APM CLI - AI Package Manager for Collective Intelligence
 * Main entry point for agent session management
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

// Import commands using modern ES modules
import { listCommand } from './cli/user/list';
import { initCommand } from './cli/user/init';
import { recoverCommand } from './cli/user/recover';
import { searchCommand } from './cli/user/search';
import { heartbeatCommand } from './cli/user/heartbeat';

// Environment setup
const APM_ROOT = path.resolve(__dirname, '..');
const APM_EXTERNAL = path.resolve(APM_ROOT, '..', 'apm');
const APM_SESSIONS = path.join(APM_EXTERNAL, 'sessions');
const APM_CONVERSATIONS = path.join(APM_EXTERNAL, 'conversations');

// Ensure external directories exist
function ensureDirectories() {
  const dirs = [
    APM_SESSIONS,
    path.join(APM_CONVERSATIONS, 'active'),
    path.join(APM_CONVERSATIONS, 'completed')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}


// Main CLI setup
async function main() {
  ensureDirectories();
  
  const cli = yargs(hideBin(process.argv))
    .scriptName('pnpm cli')
    .usage(chalk.blue('APM - AI Package Manager for Collective Intelligence'))
    .usage('')
    .usage('Usage: $0 <command> [options]')
    .example('$0 list', 'Show all active agent sessions')
    .example('$0 list --crashed', 'Show crashed sessions that need recovery')
    .example('$0 init developer', 'Initialize a new developer agent session')
    .example('$0 recover auth-dev-001-20250701', 'Recover a specific crashed session')
    .example('$0 search "OAuth implementation"', 'Search across active conversations')
    .help('h')
    .alias('h', 'help')
    .version(false)
    .demandCommand(1, chalk.red('Please specify a command. Use --help for available commands.'))
    .recommendCommands()
    .strict();

  // Add commands
  listCommand(cli);
  initCommand(cli);
  recoverCommand(cli);
  searchCommand(cli);
  heartbeatCommand(cli);

  // Global middleware for error handling
  cli.middleware((argv) => {
    process.env.APM_ROOT = APM_ROOT;
    process.env.APM_EXTERNAL = APM_EXTERNAL;
    process.env.APM_SESSIONS = APM_SESSIONS;
    process.env.APM_CONVERSATIONS = APM_CONVERSATIONS;
  });

  // Parse and execute
  try {
    await cli.parse();
  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export default main;