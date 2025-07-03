/**
 * APM Restore Command - SDK-based session restoration
 * 
 * Uses Claude Code SDK to resume conversations programmatically
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import { SessionFileManager, SessionStatus } from '../../sessions/management/session-file-manager';
import { ClaudeCodeBridge, generateEnvironmentMismatchError } from '../../sessions/claude-code-bridge';

import { query, type SDKMessage } from "@anthropic-ai/claude-code";

interface RestoreSDKOptions {
  sessionId?: string;
  force?: boolean;
  'view-only'?: boolean;
  'skip-env-check'?: boolean;
  interactive?: boolean;
}

export function restoreSDKCommand(yargs: Argv) {
  return yargs.command(
    'restore-sdk [session-id]',
    'Restore/resume any agent session using Claude Code SDK',
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
        .example('$0 restore-sdk', 'Interactive session selection')
        .example('$0 restore-sdk developer-auth-20250702', 'Restore specific session')
        .example('$0 restore-sdk --view-only developer-auth-20250702', 'View session info only')
        .example('$0 restore-sdk --force developer-auth-20250702', 'Force takeover if active elsewhere');
    },
    async (argv) => {
      const options = argv as RestoreSDKOptions;
      await restoreSessionWithSDK(options);
    }
  );
}

async function restoreSessionWithSDK(options: RestoreSDKOptions) {
  const sessionsDir = process.env.APM_SESSIONS!;
  const manager = new SessionFileManager(sessionsDir);
  const bridge = new ClaudeCodeBridge();

  try {
    if (!options.sessionId || options.interactive) {
      // Interactive session selection (simplified for now)
      console.log(chalk.blue('ℹ'), 'Interactive selection not yet implemented for SDK version');
      console.log(chalk.blue('💡'), 'Use: pnpm cli restore-sdk <session-id> to restore a specific session');
      return;
    }

    const sessionInfo = manager.getSession(options.sessionId);
    if (!sessionInfo) {
      throw new Error(`Session not found: ${options.sessionId}`);
    }

    const session = sessionInfo.session;
    const envIcon = session.environment === 'container' ? '🐳 ' : '💻 ';

    console.log();
    console.log(chalk.bold(`📋 Session Analysis: ${envIcon}${session.id}`));
    console.log('='.repeat(60));
    console.log(`${chalk.dim('Role:')} ${session.role}${session.specialization ? ` (${session.specialization})` : ''}`);
    console.log(`${chalk.dim('Topic:')} ${session.conversation_topic}`);
    console.log(`${chalk.dim('Task:')} ${session.current_task}`);
    console.log(`${chalk.dim('Status:')} ${formatSessionStatus(session.status)}`);
    console.log(`${chalk.dim('Branch:')} ${session.branch}`);
    console.log(`${chalk.dim('Context:')} ${session.context_remaining_percent}% remaining | ${session.message_count} messages`);

    if (options['view-only']) {
      console.log();
      console.log(chalk.blue('👁'), 'View-only mode - session details displayed above');
      return;
    }

    // Step 1: Environment Validation
    if (!options['skip-env-check']) {
      const isEnvironmentValid = await validateEnvironment(session);
      if (!isEnvironmentValid) {
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
      showSDKManualInstructions(session);
      return;
    }

    const claudeSessionInfo = await bridge.getClaudeSessionInfo(claudeSessionUuid);
    if (claudeSessionInfo) {
      console.log(chalk.green('✓'), `Found Claude conversation: ${claudeSessionInfo.summary}`);
      console.log(chalk.dim(`   UUID: ${claudeSessionUuid}`));
      console.log(chalk.dim(`   Messages: ${claudeSessionInfo.messageCount}`));
    }

    // Step 3: Perform SDK-based Restoration
    await performSDKRestore(manager, session, claudeSessionUuid, options);

  } catch (error) {
    console.error(chalk.red('✗'), 'Restore failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function performSDKRestore(
  manager: SessionFileManager, 
  session: any, 
  claudeSessionUuid: string, 
  options: RestoreSDKOptions
) {
  const envIcon = session.environment === 'container' ? '🐳 ' : '💻 ';
  
  console.log();
  console.log(chalk.green('🚀'), `Restoring session: ${envIcon}${session.id}`);
  
  // Update session metadata
  if (session.status !== 'active') {
    console.log(chalk.blue('🔄'), `Moving session to active status...`);
    manager.moveSession(session.id, 'active');
  }
  
  manager.updateActivity(session.id);
  
  // Store session ID for environment
  const path = require('path');
  const fs = require('fs');
  const sessionEnvFile = path.join(process.cwd(), '.apm_session');
  fs.writeFileSync(sessionEnvFile, `APM_SESSION_ID=${session.id}\n`);

  console.log(chalk.blue('📋'), 'Resuming Claude conversation with SDK...');
  
  try {
    // Phase 1: Use SDK to resume conversation
    console.log(chalk.blue('🔮'), 'Phase 1: SDK-based resume...');
    
    const messages = [];
    const abortController = new AbortController();
    
    // Resume conversation with continuation prompt
    const resumePrompt = `Resuming APM session ${session.id}. Previous context available.`;
    
    for await (const message of query({
      prompt: resumePrompt,
      abortController,
      options: {
        cwd: process.cwd(),
        resume: claudeSessionUuid, // Resume specific conversation
        maxTurns: 1 // Just get initial response
      }
    })) {
      messages.push(message);
      
      // Show initial response from resume
      if (message.type === 'assistant') {
        console.log(chalk.green('✓'), 'SDK resume successful - agent reconnected');
        console.log(chalk.gray(`   Initial response: ${(message as any).content?.substring(0, 80) || 'No content'}...`));
      }
    }
    
    console.log(chalk.green('✅'), 'Phase 1 complete - Session resumed with SDK!');
    console.log(chalk.dim(`APM Session: ${session.id}`));
    console.log(chalk.dim(`Claude UUID: ${claudeSessionUuid}`));
    console.log(chalk.dim(`Messages exchanged: ${messages.length}`));
    
    // Phase 2: Hand off to CLI for interactive continuation  
    console.log('');
    console.log(chalk.blue('🚀'), 'Phase 2: Handing off to Claude CLI for interactive experience...');
    
    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--resume', claudeSessionUuid], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    claudeProcess.on('exit', (code: number | null) => {
      if (code === 0) {
        console.log(chalk.green('✅'), 'Interactive session completed successfully');
      } else {
        console.log(chalk.yellow('⚠️'), `Interactive session ended with code: ${code}`);
      }
    });
    
    claudeProcess.on('error', (error: Error) => {
      console.error(chalk.red('✗'), 'Failed to start Claude CLI:', error.message);
      
      // Fallback instructions
      console.log('');
      console.log(chalk.blue('💡'), 'Manual continuation:');
      console.log(`   Run: ${chalk.white(`claude --resume ${claudeSessionUuid}`)}`);
    });
    
  } catch (error) {
    console.error(chalk.red('✗'), 'SDK restoration failed:', error);
    console.log();
    showSDKManualInstructions(session, claudeSessionUuid);
  }
}

async function validateEnvironment(session: any): Promise<boolean> {
  const getCurrentBranchSync = () => {
    try {
      const { execSync } = require('child_process');
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  };

  const currentBranch = getCurrentBranchSync();
  const currentDir = process.cwd();
  const path = require('path');
  
  const branchMismatch = currentBranch !== session.branch;
  const dirMismatch = !currentDir.includes(path.basename(session.branch));
  
  if (branchMismatch || dirMismatch) {
    const errorMessage = generateEnvironmentMismatchError(session);
    console.log(errorMessage);
    process.exit(1);
  }
  
  return true;
}

function formatSessionStatus(status: SessionStatus): string {
  switch (status) {
    case 'active': return chalk.green('🟢 ACTIVE');
    case 'completed': return chalk.blue('🔵 COMPLETED');
    case 'stale': return chalk.gray('⚫ STALE');
    default: return status;
  }
}

function showSDKManualInstructions(session: any, claudeSessionUuid?: string): void {
  console.log();
  console.log(chalk.bold('📖 SDK Restoration Instructions'));
  console.log('='.repeat(50));
  console.log();
  
  if (claudeSessionUuid) {
    console.log('SDK-based restoration failed. Alternative approaches:');
    console.log();
    console.log(chalk.cyan('1. CLI Resume:'));
    console.log(`   ${chalk.white(`claude --resume ${claudeSessionUuid}`)}`);
    console.log();
    console.log(chalk.cyan('2. SDK Resume (manual):'));
    console.log(`   ${chalk.white('query({ resume: "' + claudeSessionUuid + '" })')}`);
  } else {
    console.log('No Claude session UUID found. Manual startup:');
    console.log();
    console.log(chalk.cyan('1. Start new conversation:'));
    console.log(`   ${chalk.white('claude')}`);
    console.log();
    console.log(chalk.cyan('2. Initialize agent:'));
    console.log(`   ${chalk.white(`/agent-${session.role}-init`)}`);
  }
  
  console.log();
  console.log(chalk.dim('APM Session ID:'), session.id);
  if (claudeSessionUuid) {
    console.log(chalk.dim('Claude UUID:'), claudeSessionUuid);
  }
}