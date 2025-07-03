/**
 * APM Init Command - SDK-based agent session initialization
 * 
 * Uses Claude Code SDK instead of CLI spawning for cleaner integration
 */

import { Argv } from 'yargs';
import chalk from 'chalk';
import * as path from 'path';
import { SessionFileManager, SessionFile } from '../../sessions/management/session-file-manager';
import { ClaudeCodeBridge } from '../../sessions/claude-code-bridge';

import { query, type SDKMessage } from "@anthropic-ai/claude-code";

interface InitOptions {
  role: string;
  specialization?: string;
  worktree?: string;
  branch?: string;
  'register-only'?: boolean;
}

export function initSDKCommand(yargs: Argv) {
  return yargs.command(
    'init-sdk <role> [specialization]',
    'Initialize a new agent session using Claude Code SDK',
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
          description: 'Only register session, don\'t start Claude conversation'
        })
        .example('$0 init-sdk developer', 'Initialize a developer agent with SDK')
        .example('$0 init-sdk developer ui-components', 'Initialize a UI-focused developer')
        .example('$0 init-sdk prompt-engineer --register-only', 'Register session without starting conversation');
    },
    async (argv) => {
      const options = argv as InitOptions;
      await initializeAgentWithSDK(options);
    }
  );
}

async function initializeAgentWithSDK(options: InitOptions) {
  const sessionsDir = process.env.APM_SESSIONS!;
  const manager = new SessionFileManager(sessionsDir);
  const bridge = new ClaudeCodeBridge();

  // Get current context
  const worktree = options.worktree || path.basename(process.cwd());
  let branch: string = options.branch || '';
  
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
  const sessionId = `${options.role}${options.specialization ? `-${options.specialization}` : ''}-${timestamp.substring(0, 15)}`;

  console.log(chalk.blue('🔄'), `Initializing ${options.role} agent with SDK...`);
  
  // Create session data
  const sessionData: SessionFile = {
    session: {
      id: sessionId,
      status: 'active',
      role: options.role,
      specialization: options.specialization,
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
      auto_archive_after: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  };

  const success = manager.createSession(sessionData);
  if (!success) {
    console.error(chalk.red('✗'), 'Failed to create session');
    process.exit(1);
  }

  // Store session ID for environment
  const sessionEnvFile = path.join(process.cwd(), '.apm_session');
  require('fs').writeFileSync(sessionEnvFile, `APM_SESSION_ID=${sessionId}\n`);

  if (options['register-only']) {
    console.log(chalk.green('✓'), 'Session registered. Use SDK integration for conversation.');
    console.log(chalk.gray(`Session ID: ${sessionId}`));
    return;
  }

  // Start Claude conversation using SDK
  await startClaudeConversationWithSDK(sessionId, options.role, options.specialization, bridge);
}

async function startClaudeConversationWithSDK(
  sessionId: string, 
  role: string, 
  specialization?: string,
  bridge?: ClaudeCodeBridge
) {
  console.log(chalk.blue('🚀'), 'Starting Claude conversation with SDK...');
  
  try {
    // Build agent initialization prompt
    const agentPrompt = await buildAgentInitializationPrompt(role, specialization);
    
    console.log(chalk.gray('Starting conversation with agent initialization prompt...'));
    
    // Phase 1: Use SDK to initialize conversation and capture session ID
    const messages = [];
    const abortController = new AbortController();
    let claudeSessionId: string | null = null;
    
    console.log(chalk.blue('🔮'), 'Phase 1: SDK session initialization...');
    
    for await (const message of query({
      prompt: agentPrompt,
      abortController,
      options: {
        cwd: process.cwd(),
        maxTurns: 1
      }
    })) {
      messages.push(message);
      
      // Capture Claude session ID from first message
      if (messages.length === 1 && message.session_id && bridge) {
        claudeSessionId = message.session_id;
        const projectPath = bridge.getCurrentProjectPath();
        
        console.log(chalk.green('✓'), `Captured Claude session: ${claudeSessionId.substring(0, 8)}...`);
        bridge.createBridgeMapping(sessionId, claudeSessionId, projectPath);
        
        console.log(chalk.blue('🔗'), 'Bridge mapping created successfully');
      }
    }
    
    if (!claudeSessionId) {
      throw new Error('Failed to capture Claude session ID from SDK');
    }
    
    console.log(chalk.green('✅'), 'Phase 1 complete - Session initialized with SDK!');
    console.log(chalk.gray(`   APM Session: ${sessionId}`));
    console.log(chalk.gray(`   Claude Session: ${claudeSessionId}`));
    console.log(chalk.gray(`   Messages exchanged: ${messages.length}`));
    
    // Phase 2: Hand off to CLI for superior interactive experience
    console.log('');
    console.log(chalk.blue('🚀'), 'Phase 2: Handing off to Claude CLI for interactive experience...');
    
    const { spawn } = require('child_process');
    const claudeProcess = spawn('claude', ['--resume', claudeSessionId], {
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
      console.log(`   Run: ${chalk.white(`claude --resume ${claudeSessionId}`)}`);
    });
    
  } catch (error) {
    console.error(chalk.red('✗'), 'Failed to start SDK conversation:', error);
    
    // Fallback to manual instructions
    console.log();
    console.log(chalk.yellow('💡'), 'Manual startup instructions:');
    console.log(`   1. Run: ${chalk.white('claude')}`);
    console.log(`   2. Send: ${chalk.white(`/agent-${role}-init`)}`);
    console.log(`   3. Session: ${chalk.white(sessionId)}`);
  }
}

async function buildAgentInitializationPrompt(role: string, specialization?: string): Promise<string> {
  try {
    // Read the agent initialization command file
    const fs = require('fs');
    const agentCommandPath = `.claude/commands/agent-${role}-init.md`;
    
    if (fs.existsSync(agentCommandPath)) {
      const commandContent = fs.readFileSync(agentCommandPath, 'utf8');
      return commandContent;
    }
    
    // Fallback to basic initialization
    return `/agent-${role}-init${specialization ? ` ${specialization}` : ''}`;
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not load agent command file'));
    return `/agent-${role}-init${specialization ? ` ${specialization}` : ''}`;
  }
}