/**
 * APM Restore Command - Resume any agent session using Claude Code's native --resume functionality
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionFileManager, SessionStatus } from '../../sessions/management/session-file-manager';
import { ClaudeCodeBridge, generateEnvironmentMismatchError } from '../../sessions/claude-code-bridge';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface RestoreOptions {
  sessionId?: string;
  force?: boolean;
  'view-only'?: boolean;
  'skip-env-check'?: boolean;
  interactive?: boolean;
}

export function restoreCommand(yargs: Argv) {
  return yargs.command(
    'restore [session-id]',
    'Restore/resume any agent session with smart conflict and environment handling',
    (yargs) => {
      return yargs
        .positional('session-id', {
          describe: 'Session ID to restore (interactive selection if omitted)',
          type: 'string'
        })
        .option('force', {
          alias: 'f',
          type: 'boolean',
          description: 'Force takeover if session is active elsewhere'
        })
        .option('view-only', {
          alias: 'v',
          type: 'boolean', 
          description: 'View session details without restoring'
        })
        .option('skip-env-check', {
          alias: 's',
          type: 'boolean',
          description: 'Skip environment validation (advanced users only)'
        })
        .option('interactive', {
          alias: 'i',
          type: 'boolean',
          description: 'Always show interactive session picker',
          default: false
        })
        .example('$0 restore', 'Interactive session selection')
        .example('$0 restore developer-auth-20250702', 'Restore specific session')
        .example('$0 restore --view-only developer-auth-20250702', 'View session info only')
        .example('$0 restore --force developer-auth-20250702', 'Force takeover if active elsewhere')
        .example('$0 restore --skip-env-check developer-auth-20250702', 'Skip branch/worktree validation');
    },
    async (argv) => {
      const sessionsDir = process.env.APM_SESSIONS!;
      const manager = new SessionFileManager(sessionsDir);
      const options = argv as RestoreOptions;

      try {
        if (!options.sessionId || options.interactive) {
          // Interactive session selection
          const sessionId = await selectSessionInteractively(manager);
          if (!sessionId) {
            console.log(chalk.blue('ℹ'), 'No session selected');
            return;
          }
          options.sessionId = sessionId;
        }

        await restoreSession(manager, options);

      } catch (error) {
        console.error(chalk.red('✗'), 'Restore failed:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }
  );
}

async function selectSessionInteractively(manager: SessionFileManager): Promise<string | null> {
  const allSessions = manager.listSessions();
  
  if (allSessions.length === 0) {
    console.log(chalk.blue('ℹ'), 'No sessions available to restore');
    return null;
  }

  console.log();
  console.log(chalk.bold('📋 Available Sessions'));
  console.log('='.repeat(60));
  console.log();

  // Group sessions by status for better UX
  const statusGroups = {
    active: allSessions.filter(s => s.session.status === 'active'),
    completed: allSessions.filter(s => s.session.status === 'completed'), 
    stale: allSessions.filter(s => s.session.status === 'stale')
  };

  let sessionIndex = 1;
  const sessionMap: { [key: number]: string } = {};

  // Display sessions grouped by status
  Object.entries(statusGroups).forEach(([status, sessions]) => {
    if (sessions.length > 0) {
      console.log(chalk.bold(`${status.toUpperCase()} SESSIONS:`));
      console.log();
      
      sessions.forEach(sessionInfo => {
        const s = sessionInfo.session;
        const envIcon = s.environment === 'container' ? '🐳 ' : '💻 ';
        const timeDiff = formatTimeDiff(s.agent_last_seen || s.last_activity);
        
        sessionMap[sessionIndex] = s.id;
        console.log(`  ${chalk.cyan(sessionIndex)}. ${envIcon}${chalk.bold(s.id)}`);
        console.log(`     ${chalk.dim('Role:')} ${s.role} ${chalk.dim('|')} ${chalk.dim('Topic:')} ${s.conversation_topic}`);
        console.log(`     ${chalk.dim('Last seen:')} ${timeDiff}`);
        console.log();
        sessionIndex++;
      });
    }
  });

  console.log(chalk.gray('Enter session number to restore, or press Enter to cancel:'));
  
  // For now, return the first session as a placeholder until we add proper CLI input
  // TODO: Add proper CLI input handling or inquirer dependency
  console.log(chalk.yellow('⚠️'), 'Interactive selection not yet implemented');
  console.log(chalk.blue('💡'), 'Use: pnpm cli restore <session-id> to restore a specific session');
  console.log();
  console.log('Available session IDs:');
  Object.values(sessionMap).forEach(id => {
    console.log(`  ${chalk.cyan(id)}`);
  });
  
  return null;
}

async function restoreSession(manager: SessionFileManager, options: RestoreOptions) {
  const sessionInfo = manager.getSession(options.sessionId!);
  
  if (!sessionInfo) {
    throw new Error(`Session not found: ${options.sessionId}`);
  }

  const session = sessionInfo.session;
  const envIcon = session.environment === 'container' ? '🐳 ' : '💻 ';
  const bridge = new ClaudeCodeBridge();

  console.log();
  console.log(chalk.bold(`📋 Session Analysis: ${envIcon}${session.id}`));
  console.log('='.repeat(60));
  console.log(`${chalk.dim('Role:')} ${session.role}${session.specialization ? ` (${session.specialization})` : ''}`);
  console.log(`${chalk.dim('Topic:')} ${session.conversation_topic}`);
  console.log(`${chalk.dim('Task:')} ${session.current_task}`);
  console.log(`${chalk.dim('Status:')} ${formatSessionStatus(session.status)}`);
  console.log(`${chalk.dim('Branch:')} ${session.branch}`);
  console.log(`${chalk.dim('Context:')} ${session.context_remaining_percent}% remaining | ${session.message_count} messages`);

  // Show activity information
  if (session.agent_last_seen && session.user_last_seen) {
    const agentTime = formatTimeDiff(session.agent_last_seen);
    const userTime = formatTimeDiff(session.user_last_seen);
    console.log(`${chalk.dim('Last seen:')} Agent ${getTimeColor(session.agent_last_seen)} ${agentTime}, User ${getTimeColor(session.user_last_seen)} ${userTime}`);
  }

  if (options['view-only']) {
    console.log();
    console.log(chalk.blue('👁'), 'View-only mode - session details displayed above');
    return;
  }

  // Step 1: Environment Validation (CRITICAL - no bypass without explicit flag)
  if (!options['skip-env-check']) {
    const isEnvironmentValid = await validateEnvironment(session, options);
    if (!isEnvironmentValid) {
      // validateEnvironment will have already shown the error and exited
      return;
    }
  }

  // Step 2: Find Claude Code Session UUID
  console.log();
  console.log(chalk.blue('🔍'), 'Looking up Claude Code conversation...');
  
  const claudeSessionUuid = await bridge.findClaudeSessionUuid(session.id);
  if (!claudeSessionUuid) {
    console.log(chalk.red('✗'), 'Unable to find corresponding Claude Code conversation');
    console.log();
    showManualRestorationInstructions(session);
    return;
  }

  const claudeSessionInfo = await bridge.getClaudeSessionInfo(claudeSessionUuid);
  if (claudeSessionInfo) {
    console.log(chalk.green('✓'), `Found Claude conversation: ${claudeSessionInfo.summary}`);
    console.log(chalk.dim(`   UUID: ${claudeSessionUuid}`));
    console.log(chalk.dim(`   Messages: ${claudeSessionInfo.messageCount}`));
  }

  // Step 3: Conflict Detection (simplified for now)
  await checkSessionConflicts(session, options);

  // Step 4: Perform Restoration using Claude Code
  await performClaudeCodeRestore(manager, session, claudeSessionUuid, options);
}

async function checkSessionConflicts(session: any, options: RestoreOptions) {
  // Simplified conflict detection - check if session was recently active
  const lastActivity = new Date(session.last_activity);
  const timeSinceActivity = Date.now() - lastActivity.getTime();
  const fiveMinutesMs = 5 * 60 * 1000;
  
  if (timeSinceActivity < fiveMinutesMs && session.status === 'active') {
    console.log();
    console.log(chalk.yellow('⚠️'), 'Session appears to be recently active (activity within last 5 minutes)');
    console.log(`   ${chalk.dim('Last activity:')} ${formatTimeDiff(session.last_activity)}`);
    console.log(`   ${chalk.dim('Status:')} ${session.status}`);
    
    if (options.force) {
      console.log(chalk.red('🔥'), 'Force flag detected - proceeding with restore');
      return;
    }
    
    console.log();
    console.log('This session may be active in another terminal.');
    console.log(chalk.blue('💡'), 'Use --force to proceed anyway, or --view-only to just view session info');
    console.log(chalk.blue('ℹ'), 'Operation cancelled - use explicit flags to proceed');
    process.exit(0);
  }
}

async function validateEnvironment(session: any, options: RestoreOptions): Promise<boolean> {
  const currentBranch = await getCurrentBranch();
  const currentDir = process.cwd();
  
  const branchMismatch = currentBranch !== session.branch;
  const dirMismatch = !currentDir.includes(path.basename(session.branch));
  
  if (branchMismatch || dirMismatch) {
    // Generate friendly error with specific commands
    const errorMessage = generateEnvironmentMismatchError(session);
    console.log(errorMessage);
    process.exit(1);
  }
  
  return true;
}

async function performClaudeCodeRestore(manager: SessionFileManager, session: any, claudeSessionUuid: string, options: RestoreOptions) {
  const envIcon = session.environment === 'container' ? '🐳 ' : '💻 ';
  
  console.log();
  console.log(chalk.green('🚀'), `Restoring session: ${envIcon}${session.id}`);
  
  // Move session to active status if it's not already
  if (session.status !== 'active') {
    console.log(chalk.blue('🔄'), `Moving session to active status...`);
    manager.moveSession(session.id, 'active');
  }
  
  // Update activity to mark restoration
  manager.updateActivity(session.id);
  
  // Store session ID for agent to use
  const sessionEnvFile = path.join(process.cwd(), '.apm_session');
  fs.writeFileSync(sessionEnvFile, `APM_SESSION_ID=${session.id}\n`);

  console.log(chalk.blue('📋'), 'Launching Claude Code with conversation restoration...');
  
  // Use Claude Code's native --resume functionality
  const claudeCommand = path.join('.local', 'bin', 'claude');
  
  console.log(chalk.gray(`Command: ${claudeCommand} --resume ${claudeSessionUuid}`));
  console.log(chalk.gray(`APM Session: ${session.id}`));
  console.log(chalk.gray(`Claude UUID: ${claudeSessionUuid}`));
  
  // Spawn Claude process with native resume
  const child = spawn(claudeCommand, ['--resume', claudeSessionUuid], {
    stdio: 'inherit',
    env: {
      ...process.env,
      APM_SESSION_ID: session.id,
      APM_AGENT_ROLE: session.role,
      APM_AGENT_SPECIALIZATION: session.specialization || '',
      APM_CONTAINERIZED: process.env.APM_CONTAINERIZED || 'false',
      APM_RESTORE_MODE: 'true'
    }
  });

  // Handle process events
  child.on('error', (error) => {
    console.error(chalk.red('✗'), 'Failed to start Claude Code:', error.message);
    console.log();
    console.log(chalk.yellow('💡'), 'Fallback: Manual restoration instructions');
    showManualRestorationInstructions(session, claudeSessionUuid);
  });

  child.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.log(chalk.yellow('⚠️'), `Claude Code exited with code ${code}`);
    }
  });

  console.log();
  console.log(chalk.green('✅'), 'Session restoration initiated!');
  console.log(chalk.dim('Claude Code is resuming your conversation...'));
}

// Helper functions
function formatTimeDiff(timestamp: string): string {
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
}

function getTimeColor(timestamp: string): string {
  const diffMs = new Date().getTime() - new Date(timestamp).getTime();
  if (diffMs < 2 * 60 * 1000) return '🟢'; // Green: < 2 minutes
  if (diffMs < 10 * 60 * 1000) return '🟡'; // Yellow: < 10 minutes  
  return '🔴'; // Red: > 10 minutes
}

function formatSessionStatus(status: SessionStatus): string {
  switch (status) {
    case 'active': return chalk.green('🟢 ACTIVE');
    case 'completed': return chalk.blue('🔵 COMPLETED');
    case 'stale': return chalk.gray('⚫ STALE');
    default: return status;
  }
}

async function checkProcessAlive(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0); // Signal 0 checks if process exists
    return true;
  } catch {
    return false;
  }
}

async function getCurrentBranch(): Promise<string> {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['branch', '--show-current'], { stdio: 'pipe' });
    let output = '';
    
    git.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    git.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error('Failed to get current branch'));
      }
    });
  });
}

async function switchBranch(branch: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const git = spawn('git', ['checkout', branch], { stdio: 'inherit' });
    
    git.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅'), `Switched to branch: ${branch}`);
        resolve();
      } else {
        reject(new Error(`Failed to switch to branch: ${branch}`));
      }
    });
  });
}

function showEnvironmentInstructions(session: any): void {
  console.log();
  console.log(chalk.bold('📖 Environment Setup Instructions'));
  console.log('='.repeat(50));
  console.log();
  console.log('To restore this session properly, run these commands:');
  console.log();
  console.log(chalk.cyan('# Switch to correct branch'));
  console.log(`git checkout ${session.branch}`);
  console.log();
  console.log(chalk.cyan('# If using worktrees, switch to correct worktree directory'));
  console.log(chalk.dim('# (adjust path as needed for your setup)'));
  console.log(`cd /path/to/worktrees/${session.branch}`);
  console.log();
  console.log(chalk.cyan('# Then retry the restore'));
  console.log(`pnpm cli restore ${session.id}`);
  console.log();
  console.log(chalk.dim('💡 Or use'), chalk.white('--skip-env-check'), chalk.dim('to proceed with current environment'));
}

function showManualRestorationInstructions(session: any, claudeSessionUuid?: string): void {
  console.log();
  console.log(chalk.bold('📖 Manual Restoration Instructions'));
  console.log('='.repeat(50));
  console.log();
  console.log('Claude Code automatic launch failed. Manual steps:');
  console.log();
  
  if (claudeSessionUuid) {
    console.log(chalk.cyan('1. Resume Claude Code conversation:'));
    console.log(`   ${chalk.white(`.local/bin/claude --resume ${claudeSessionUuid}`)}`);
    console.log();
    console.log(chalk.cyan('2. Session context will be automatically restored'));
  } else {
    console.log(chalk.cyan('1. Start Claude Code manually:'));
    console.log(`   ${chalk.white('.local/bin/claude')}`);
    console.log();
    console.log(chalk.cyan('2. Run agent initialization:'));
    console.log(`   ${chalk.white(`/agent-${session.role}-init`)}`);
    console.log();
    console.log(chalk.cyan('3. Agent will automatically load context from:'));
    console.log(`   ${chalk.white(`apm/agents/${session.role}/context/latest.md`)}`);
  }
  
  console.log();
  console.log(chalk.dim('APM Session ID:'), session.id);
  if (claudeSessionUuid) {
    console.log(chalk.dim('Claude UUID:'), claudeSessionUuid);
  }
  console.log(chalk.dim('Environment:'), `APM_SESSION_ID=${session.id}`);
}