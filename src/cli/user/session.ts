/**
 * APM Session Command - Get current Claude conversation info
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export function sessionCommand(yargs: Argv) {
  return yargs.command(
    'session <subcommand>',
    'Session management utilities',
    (yargs) => {
      return yargs
        .command(
          'jsonl',
          'Find and output the absolute path to current conversation JSONL file',
          (yargs) => yargs
            .option('host-path', {
              type: 'boolean',
              description: 'Output host path instead of container path',
              default: false
            })
            .option('verbose', {
              alias: 'v',
              type: 'boolean',
              description: 'Show search details',
              default: false
            }),
          async (argv) => {
            try {
              // This command requires container environment for proper Claude file access
              if (process.env.APM_CONTAINERIZED !== 'true') {
                console.error(chalk.red('Error: This command must be run from within the APM container'));
                console.error(chalk.yellow('The session detection requires access to mounted Claude files.'));
                console.error(chalk.gray('Run this command from inside the container where the agent is running.'));
                process.exit(1);
              }
              
              const jsonlPath = await findCurrentConversationJsonl(argv.verbose as boolean);
              if (jsonlPath) {
                // Extract just the UUID and construct a universal path
                const uuid = path.basename(jsonlPath, '.jsonl');
                const projectDirName = path.basename(path.dirname(jsonlPath));
                
                // Output a path that works from both host and container
                // User can prepend their own ~/.claude/projects/ path
                console.log(`~/.claude/projects/${projectDirName}/${uuid}.jsonl`);
              } else {
                console.error(chalk.red('Error: Could not find current conversation JSONL file'));
                process.exit(1);
              }
            } catch (error) {
              console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
              process.exit(1);
            }
          }
        )
        .command(
          'uuid',
          'Get the UUID of the current conversation',
          (yargs) => yargs,
          async (argv) => {
            try {
              // This command requires container environment for proper Claude file access
              if (process.env.APM_CONTAINERIZED !== 'true') {
                console.error(chalk.red('Error: This command must be run from within the APM container'));
                console.error(chalk.yellow('The session detection requires access to mounted Claude files.'));
                console.error(chalk.gray('Run this command from inside the container where the agent is running.'));
                process.exit(1);
              }
              
              const jsonlPath = await findCurrentConversationJsonl();
              if (jsonlPath) {
                const uuid = path.basename(jsonlPath, '.jsonl');
                console.log(uuid);
              } else {
                console.error(chalk.red('Error: Could not find current conversation'));
                process.exit(1);
              }
            } catch (error) {
              console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
              process.exit(1);
            }
          }
        )
        .demandCommand(1, 'Please specify a subcommand');
    },
    () => {}
  );
}

async function findCurrentConversationJsonl(verbose: boolean = false): Promise<string | null> {
  // Get Claude project directory for current working directory
  const cwd = process.cwd();
  const projectName = cwd.replace(/\//g, '-');
  
  // Claude config is always at ~/.claude (mounted in container)
  const claudeHome = path.join(require('os').homedir(), '.claude');
    
  const projectDir = path.join(claudeHome, 'projects', projectName);

  if (!fs.existsSync(projectDir)) {
    throw new Error(`Claude project directory not found: ${projectDir}`);
  }

  // Strategy 1: Try to find a unique string from recent output
  // We'll search for something we just said in the last few minutes
  const recentUniqueStrings = [
    'pnpm cli session jsonl --verbose', // Command you just ran
    'I just ran the command.  Is the above expected?', // Your exact question
    'pnpm cli session jsonl',  // The command we're creating
    'UUID as primary keys',     // From our recent discussion
    'flawed for concurrent usage', // From earlier discussion
    'user-friendly session tracking', // Recent topic
    'tilde expansion', // Just mentioned
    process.env.APM_SESSION_ID || '', // Current APM session if available
  ].filter(s => s.length > 0);

  if (verbose) {
    console.error(chalk.gray(`Searching in: ${projectDir}`));
    console.error(chalk.gray(`Search strings: ${recentUniqueStrings.join(', ')}`));
  }

  for (const searchString of recentUniqueStrings) {
    if (verbose) {
      console.error(chalk.gray(`Searching for: "${searchString}"...`));
    }
    const result = searchJsonlFiles(projectDir, searchString);
    if (result) {
      if (verbose) {
        console.error(chalk.green(`✓ Found in: ${path.basename(result)}`));
      }
      return result;
    }
  }

  // Strategy 2: If no unique string found, fall back to most recent
  // (This is less reliable with multiple concurrent sessions)
  console.warn(chalk.yellow('Warning: Using fallback strategy (most recent file)'));
  const mostRecent = getMostRecentJsonl(projectDir);
  if (verbose && mostRecent) {
    console.error(chalk.gray(`Most recent file: ${path.basename(mostRecent)}`));
    const stats = fs.statSync(mostRecent);
    console.error(chalk.gray(`Last modified: ${stats.mtime.toISOString()}`));
  }
  return mostRecent;
}

function searchJsonlFiles(projectDir: string, searchString: string): string | null {
  try {
    // Use grep to efficiently search all JSONL files
    const command = `grep -l "${searchString}" "${projectDir}"/*.jsonl 2>/dev/null | head -1`;
    const result = execSync(command, { encoding: 'utf8' }).trim();
    
    if (result) {
      return result;
    }
  } catch {
    // Grep returns non-zero if no match found
  }
  
  return null;
}

function getMostRecentJsonl(projectDir: string): string | null {
  try {
    const files = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({
        path: path.join(projectDir, f),
        mtime: fs.statSync(path.join(projectDir, f)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return files.length > 0 ? files[0].path : null;
  } catch (error) {
    return null;
  }
}