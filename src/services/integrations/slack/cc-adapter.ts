#!/usr/bin/env tsx

/**
 * Claude Code Instance Slack Adapter
 * Enables CC instances to communicate with Slack coordinator
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface CCAdapterConfig {
  instance_id: string;
  agent_role: string;
  project: string;
  webhook_url: string;
  git_branch?: string;
  container_name?: string;
}

interface StatusUpdate {
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

class CCSlackAdapter {
  private config: CCAdapterConfig;
  private isConnected: boolean = false;

  constructor(config: CCAdapterConfig) {
    this.config = config;
  }

  /**
   * Connect this CC instance to Slack coordination
   */
  async connect(): Promise<void> {
    try {
      // Verify webhook connectivity
      const response = await fetch(`${this.config.webhook_url.replace('/webhook/status', '/health')}`);
      if (!response.ok) {
        throw new Error(`Webhook server not available: ${response.status}`);
      }

      this.isConnected = true;
      
      // Send connection notification
      await this.postStatus({
        status: 'in_progress',
        task_context: 'Connected to Slack coordination',
        next_steps: 'Ready for task assignment'
      });

      console.log(`✅ Connected to Slack coordination as ${this.config.agent_role}`);
      
    } catch (error) {
      console.error('Failed to connect to Slack coordinator:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Slack coordination
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.postStatus({
        status: 'completed',
        task_context: 'Disconnecting from Slack coordination',
        next_steps: 'Instance going offline'
      });
    }
    
    this.isConnected = false;
    console.log('Disconnected from Slack coordination');
  }

  /**
   * Post a status update to Slack
   */
  async postStatus(update: Partial<StatusUpdate>): Promise<void> {
    if (!this.isConnected) {
      console.warn('Not connected to Slack - status update skipped');
      return;
    }

    const fullUpdate: StatusUpdate = {
      agent_id: this.config.instance_id,
      agent_role: this.config.agent_role,
      project: this.config.project,
      branch: this.getCurrentBranch(),
      container: this.config.container_name || this.getContainerName(),
      timestamp: new Date().toISOString(),
      ...update
    } as StatusUpdate;

    try {
      const response = await fetch(this.config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullUpdate)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Failed to post status update:', error);
      // Don't throw - allow CC instance to continue working
    }
  }

  /**
   * Initiate context handover to another agent
   */
  async initiateHandover(targetAgent: string, workCompleted: string, nextSteps: string): Promise<void> {
    if (!this.isConnected) {
      console.warn('Not connected to Slack - handover notification skipped');
      return;
    }

    // Save current context
    const contextFile = await this.saveContext();

    const handover = {
      source_agent: this.config.agent_role,
      target_agent: targetAgent,
      project: this.config.project,
      work_completed: workCompleted,
      context_file: contextFile,
      next_steps: nextSteps,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(`${this.config.webhook_url.replace('/status', '/handover')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(handover)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Handover initiated to ${targetAgent}`);

    } catch (error) {
      console.error('Failed to initiate handover:', error);
      throw error;
    }
  }

  private getCurrentBranch(): string {
    if (this.config.git_branch) {
      return this.config.git_branch;
    }

    try {
      return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  private getContainerName(): string {
    if (this.config.container_name) {
      return this.config.container_name;
    }

    // Try to detect container environment
    try {
      const hostname = execSync('hostname', { encoding: 'utf-8' }).trim();
      if (hostname.includes('docker') || hostname.includes('container')) {
        return hostname;
      }
    } catch (error) {
      // Ignore
    }

    // Default to terminal session identifier
    return `cc-${this.config.agent_role}-${Date.now().toString().slice(-4)}`;
  }

  private async saveContext(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const contextDir = path.join(process.cwd(), 'apm', 'agents', this.config.agent_role.toLowerCase(), 'context');
    
    await fs.mkdir(contextDir, { recursive: true });
    
    const contextFile = path.join(contextDir, `${timestamp}_handover.md`);
    const context = `# Context Handover - ${this.config.agent_role}

Generated: ${new Date().toISOString()}
Project: ${this.config.project}
Branch: ${this.getCurrentBranch()}
Container: ${this.getContainerName()}

## Current State

_Context saved during handover to another agent_

## Work Completed

_To be filled by agent during handover_

## Next Steps

_To be filled by agent during handover_
`;

    await fs.writeFile(contextFile, context);
    return contextFile;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`Usage: tsx cc-adapter.ts <command> [options]

Commands:
  connect <project> <role>     Connect to Slack coordination
  status <message>             Post status update
  handover <target> <work>     Initiate handover
  disconnect                   Disconnect from coordination

Examples:
  tsx cc-adapter.ts connect proj-alpha frontend
  tsx cc-adapter.ts status "Completed user authentication feature"
  tsx cc-adapter.ts handover backend "Frontend auth complete"
  tsx cc-adapter.ts disconnect
`);
    process.exit(1);
  }

  try {
    const configPath = path.join(process.cwd(), '.cc-slack-config.json');
    let config: CCAdapterConfig;

    // Load or create config
    try {
      const configData = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      config = {
        instance_id: `cc-${Date.now()}`,
        agent_role: 'general',
        project: 'default',
        webhook_url: 'http://localhost:3000/webhook/status'
      };
    }

    const adapter = new CCSlackAdapter(config);

    switch (command) {
      case 'connect':
        if (args.length < 3) {
          console.error('Usage: connect <project> <role>');
          process.exit(1);
        }
        config.project = args[1];
        config.agent_role = args[2];
        config.instance_id = `${args[2]}-${Date.now().toString().slice(-6)}`;
        
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        await adapter.connect();
        break;

      case 'status':
        if (args.length < 2) {
          console.error('Usage: status <message>');
          process.exit(1);
        }
        await adapter.postStatus({
          status: 'in_progress',
          task_context: args.slice(1).join(' ')
        });
        break;

      case 'handover':
        if (args.length < 3) {
          console.error('Usage: handover <target-agent> <work-completed>');
          process.exit(1);
        }
        const target = args[1];
        const work = args.slice(2).join(' ');
        await adapter.initiateHandover(target, work, 'Continue with next phase');
        break;

      case 'disconnect':
        await adapter.disconnect();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { CCSlackAdapter, CCAdapterConfig };