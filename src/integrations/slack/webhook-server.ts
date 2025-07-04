#!/usr/bin/env tsx

/**
 * APM Slack Webhook Server
 * Receives status updates from Claude Code instances and routes to Slack
 */

import express from 'express';
import crypto from 'crypto';
import { WebClient } from '@slack/web-api';
import fs from 'fs/promises';
import path from 'path';

interface CCStatusUpdate {
  agent_id: string;
  agent_role: string;
  project: string;
  branch: string;
  container: string;
  status: 'in_progress' | 'completed' | 'blocked' | 'review_ready';
  task_context: string;
  github_issues?: string[];
  next_steps?: string;
  blocked_reason?: string;
  timestamp: string;
}

interface SlackConfig {
  bot_token: string;
  signing_secret: string;
  port: number;
  webhook_path: string;
}

class SlackWebhookServer {
  private app: express.Application;
  private slack: WebClient;
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
    this.app = express();
    this.slack = new WebClient(config.bot_token);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Raw body parser for Slack signature verification
    this.app.use(express.raw({ type: 'application/json' }));
    
    // CORS for local development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // CC instance status update webhook
    this.app.post(this.config.webhook_path, async (req, res) => {
      try {
        // Verify Slack signature (optional for development)
        // const isValid = this.verifySlackSignature(req);
        // if (!isValid) {
        //   return res.status(401).json({ error: 'Invalid signature' });
        // }

        const update: CCStatusUpdate = JSON.parse(req.body.toString());
        await this.handleStatusUpdate(update);
        
        res.json({ success: true });
      } catch (error) {
        console.error('Error handling status update:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Context handover webhook
    this.app.post('/webhook/handover', async (req, res) => {
      try {
        const handover = JSON.parse(req.body.toString());
        await this.handleContextHandover(handover);
        res.json({ success: true });
      } catch (error) {
        console.error('Error handling handover:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  private async handleStatusUpdate(update: CCStatusUpdate) {
    const message = this.formatStatusMessage(update);
    
    // Determine target channels
    const channels = await this.getTargetChannels(update.project, update.agent_role);
    
    // Post to appropriate channels
    for (const channel of channels) {
      try {
        await this.slack.chat.postMessage({
          channel,
          text: message,
          parse: 'none'
        });
      } catch (error) {
        console.error(`Failed to post to channel ${channel}:`, error);
      }
    }

    // Log the update for debugging
    await this.logUpdate(update);
  }

  private formatStatusMessage(update: CCStatusUpdate): string {
    const statusEmoji = {
      'in_progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
      'review_ready': '👀'
    };

    const emoji = statusEmoji[update.status] || '📝';
    
    let message = `${emoji} [${update.agent_role}] ${update.task_context}\n`;
    message += `├── Project: ${update.project}\n`;
    message += `├── Branch: ${update.branch}\n`;
    message += `├── Container: ${update.container}\n`;
    message += `├── Status: ${update.status.replace('_', ' ')}\n`;
    
    if (update.github_issues && update.github_issues.length > 0) {
      message += `├── Issues: ${update.github_issues.join(', ')}\n`;
    }
    
    if (update.blocked_reason) {
      message += `├── Blocked: ${update.blocked_reason}\n`;
    }
    
    if (update.next_steps) {
      message += `└── Next: ${update.next_steps}`;
    } else {
      message += `└── Time: ${new Date(update.timestamp).toLocaleTimeString()}`;
    }

    return message;
  }

  private async getTargetChannels(project: string, agentRole: string): Promise<string[]> {
    const channels = [];
    
    // Always post to project dashboard
    channels.push(`#proj-${project}-dashboard`);
    
    // Post to role-specific channel
    const roleChannel = `#proj-${project}-${agentRole.toLowerCase()}`;
    channels.push(roleChannel);
    
    return channels;
  }

  private async handleContextHandover(handover: any) {
    const message = `🔄 [${handover.source_agent}] Context handover initiated\n` +
                   `├── Project: ${handover.project}\n` +
                   `├── Transferring to: ${handover.target_agent}\n` +
                   `├── Work completed: ${handover.work_completed}\n` +
                   `├── Context saved: ${handover.context_file}\n` +
                   `└── Next agent: ${handover.next_steps}`;

    // Post to coordination channel
    await this.slack.chat.postMessage({
      channel: '#apm-coordination',
      text: message,
      parse: 'none'
    });
  }

  private async logUpdate(update: CCStatusUpdate) {
    const logDir = path.join(process.cwd(), 'apm', 'logs', 'slack');
    await fs.mkdir(logDir, { recursive: true });
    
    const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.jsonl`);
    const logEntry = JSON.stringify({ ...update, logged_at: new Date().toISOString() }) + '\n';
    
    await fs.appendFile(logFile, logEntry);
  }

  private verifySlackSignature(req: express.Request): boolean {
    const signature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const body = req.body;

    if (!signature || !timestamp) return false;

    const time = Math.floor(new Date().getTime() / 1000);
    if (Math.abs(time - parseInt(timestamp)) > 300) return false;

    const sigBasestring = 'v0:' + timestamp + ':' + body;
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.config.signing_secret)
      .update(sigBasestring, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`Slack webhook server running on port ${this.config.port}`);
        resolve();
      });
    });
  }
}

// Main execution
async function main() {
  try {
    // Load configuration
    const configPath = path.join(process.cwd(), '.slack-config.json');
    let config: SlackConfig;
    
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      // Create default config
      config = {
        bot_token: process.env.SLACK_BOT_TOKEN || '',
        signing_secret: process.env.SLACK_SIGNING_SECRET || '',
        port: parseInt(process.env.SLACK_WEBHOOK_PORT || '3000'),
        webhook_path: '/webhook/status'
      };
      
      console.log('Created default config at .slack-config.json');
      console.log('Please update with your Slack bot credentials');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }

    if (!config.bot_token) {
      console.error('SLACK_BOT_TOKEN not configured');
      process.exit(1);
    }

    const server = new SlackWebhookServer(config);
    await server.start();
    
  } catch (error) {
    console.error('Failed to start webhook server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SlackWebhookServer, CCStatusUpdate, SlackConfig };