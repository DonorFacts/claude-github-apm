#!/usr/bin/env tsx

/**
 * APM Slack Coordinator Startup Script
 * Usage: tsx src/scripts/slack/start-coordinator.ts
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { logError, logInfo, logSuccess } from '../../lib/common';

interface SlackConfig {
  bot_token: string;
  channel_id?: string;
  webhook_url?: string;
}

function loadSlackConfig(): SlackConfig {
  const configPath = '.slack-config.json';
  
  if (!existsSync(configPath)) {
    logError('.slack-config.json not found');
    logInfo('Please update .slack-config.json with your Slack bot token');
    process.exit(1);
  }

  try {
    const configContent = readFileSync(configPath, 'utf8');
    const config: SlackConfig = JSON.parse(configContent);
    
    if (config.bot_token === 'your-slack-bot-token-here') {
      logError('Please update .slack-config.json with your actual Slack bot token');
      logInfo('Get your token from https://api.slack.com/apps');
      process.exit(1);
    }

    return config;
  } catch (error) {
    logError(`Failed to load .slack-config.json: ${error}`);
    process.exit(1);
  }
}

function main() {
  logInfo('🚀 Starting APM Slack Coordinator...');

  // Validate configuration
  const config = loadSlackConfig();
  logInfo('✅ Configuration loaded successfully');

  // Start webhook server
  logInfo('🔗 Starting webhook server...');
  
  const webhookServerPath = path.resolve(__dirname, 'webhook-server.ts');
  const webhookServer = spawn('tsx', [webhookServerPath], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  logSuccess('✅ Slack coordination system running');
  logInfo(`Webhook server PID: ${webhookServer.pid}`);
  logInfo('Use Ctrl+C to stop');

  // Handle cleanup
  process.on('SIGINT', () => {
    logInfo('\n🛑 Stopping Slack coordination system...');
    webhookServer.kill('SIGTERM');
    process.exit(0);
  });

  // Wait for webhook server and handle exit
  webhookServer.on('exit', (code) => {
    if (code !== 0) {
      logError(`Webhook server exited with code ${code}`);
      process.exit(code || 1);
    }
  });

  webhookServer.on('error', (error) => {
    logError(`Failed to start webhook server: ${error}`);
    process.exit(1);
  });
}

if (require.main === module) {
  main();
}

export { main as startSlackCoordinator };