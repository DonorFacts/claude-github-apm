#!/usr/bin/env tsx

/**
 * Slack Channel Manager
 * Creates and manages project-based channel organization
 */

import { WebClient } from '@slack/web-api';
import fs from 'fs/promises';
import path from 'path';

interface ChannelConfig {
  name: string;
  purpose: string;
  topic?: string;
  private?: boolean;
}

class SlackChannelManager {
  private slack: WebClient;

  constructor(botToken: string) {
    this.slack = new WebClient(botToken);
  }

  /**
   * Set up channels for a new project
   */
  async setupProjectChannels(projectName: string, inviteUsers: string[] = []): Promise<void> {
    const channels: ChannelConfig[] = [
      {
        name: `proj-${projectName}-dashboard`,
        purpose: `Main coordination channel for ${projectName} project`,
        topic: `📊 Project status and coordination`
      },
      {
        name: `proj-${projectName}-frontend`,
        purpose: `Frontend development updates for ${projectName}`,
        topic: `🎨 Frontend work and UI development`
      },
      {
        name: `proj-${projectName}-backend`,
        purpose: `Backend development updates for ${projectName}`,
        topic: `⚙️ Backend APIs and services`
      },
      {
        name: `proj-${projectName}-testing`,
        purpose: `QA and testing activities for ${projectName}`,
        topic: `🧪 Quality assurance and testing`
      },
      {
        name: `proj-${projectName}-devops`,
        purpose: `DevOps and deployment work for ${projectName}`,
        topic: `🚀 Deployment and infrastructure`
      }
    ];

    console.log(`Setting up channels for project: ${projectName}`);

    for (const channel of channels) {
      const result = await this.createChannelIfNeeded(channel);
      
      // Invite users to the channel if specified and channel was created/exists
      if (inviteUsers.length > 0 && result?.channelId) {
        await this.inviteUsersToChannel(result.channelId, inviteUsers);
      }
    }

    console.log(`✅ Project channels ready for ${projectName}`);
  }

  /**
   * Set up meta coordination channels
   */
  async setupMetaChannels(inviteUsers: string[] = []): Promise<void> {
    const metaChannels: ChannelConfig[] = [
      {
        name: 'apm-coordination',
        purpose: 'Cross-project agent handoffs and coordination',
        topic: '🔄 Multi-project coordination hub'
      },
      {
        name: 'apm-implementation',
        purpose: 'Implementation Plan updates and progress tracking',
        topic: '📋 Implementation Plan progress'
      },
      {
        name: 'apm-github-sync',
        purpose: 'GitHub issue and PR notifications',
        topic: '🔗 GitHub workflow integration'
      },
      {
        name: 'apm-alerts',
        purpose: 'System alerts and error notifications',
        topic: '⚠️ System health and alerts'
      }
    ];

    console.log('Setting up APM meta channels...');

    for (const channel of metaChannels) {
      const result = await this.createChannelIfNeeded(channel);
      
      // Invite users to the channel if specified and channel was created/exists
      if (inviteUsers.length > 0 && result?.channelId) {
        await this.inviteUsersToChannel(result.channelId, inviteUsers);
      }
    }

    console.log('✅ Meta channels ready');
  }

  /**
   * Create a channel if it doesn't already exist
   */
  private async createChannelIfNeeded(config: ChannelConfig): Promise<{ channelId?: string }> {
    try {
      // Check if channel exists
      const existingChannels = await this.slack.conversations.list({
        types: 'public_channel,private_channel'
      });

      const channelExists = existingChannels.channels?.some(
        channel => channel.name === config.name
      );

      if (channelExists) {
        console.log(`  ✓ Channel #${config.name} already exists`);
        const existingChannel = existingChannels.channels?.find(ch => ch.name === config.name);
        return { channelId: existingChannel?.id };
      }

      // Create the channel
      const result = await this.slack.conversations.create({
        name: config.name,
        is_private: config.private || false
      });

      if (result.ok && result.channel) {
        console.log(`  ✅ Created channel #${config.name}`);

        // Set purpose and topic
        if (config.purpose) {
          await this.slack.conversations.setPurpose({
            channel: result.channel.id!,
            purpose: config.purpose
          });
        }

        if (config.topic) {
          await this.slack.conversations.setTopic({
            channel: result.channel.id!,
            topic: config.topic
          });
        }

        // Post welcome message
        await this.postWelcomeMessage(result.channel.id!, config);
        
        return { channelId: result.channel.id };
      }

    } catch (error: any) {
      if (error.data?.error === 'name_taken') {
        console.log(`  ✓ Channel #${config.name} already exists`);
        // Try to get the channel ID for existing channel
        try {
          const channels = await this.slack.conversations.list({ types: 'public_channel,private_channel' });
          const existingChannel = channels.channels?.find(ch => ch.name === config.name);
          return { channelId: existingChannel?.id };
        } catch (e) {
          return {};
        }
      } else {
        console.error(`  ❌ Failed to create channel #${config.name}:`, error.data?.error || error.message);
      }
    }
    
    return {};
  }

  /**
   * Invite users to a channel
   */
  private async inviteUsersToChannel(channelId: string, userIds: string[]): Promise<void> {
    try {
      await this.slack.conversations.invite({
        channel: channelId,
        users: userIds.join(',')
      });
      console.log(`  👥 Invited ${userIds.length} user(s) to channel`);
    } catch (error: any) {
      console.warn(`  ⚠️ Could not invite users to channel:`, error.data?.error || error.message);
    }
  }

  /**
   * Post welcome message to newly created channel
   */
  private async postWelcomeMessage(channelId: string, config: ChannelConfig): Promise<void> {
    const message = `🎉 Welcome to #${config.name}!

${config.purpose}

This channel is part of the Claude GitHub APM coordination system. Claude Code instances will automatically post updates here based on their work progress.

**Getting Started:**
• CC instances connect via \`/slack-connect\`
• Status updates appear automatically
• Use thread replies for discussions
• Check pinned messages for project info

Happy coding! 🚀`;

    try {
      await this.slack.chat.postMessage({
        channel: channelId,
        text: message,
        parse: 'none'
      });
    } catch (error) {
      console.warn(`Could not post welcome message to #${config.name}`);
    }
  }

  /**
   * Archive unused project channels
   */
  async archiveProjectChannels(projectName: string): Promise<void> {
    const channelPrefixes = [
      `proj-${projectName}-dashboard`,
      `proj-${projectName}-frontend`,
      `proj-${projectName}-backend`,
      `proj-${projectName}-testing`,
      `proj-${projectName}-devops`
    ];

    console.log(`Archiving channels for project: ${projectName}`);

    for (const channelName of channelPrefixes) {
      await this.archiveChannelIfExists(channelName);
    }

    console.log(`✅ Project channels archived for ${projectName}`);
  }

  private async archiveChannelIfExists(channelName: string): Promise<void> {
    try {
      const channels = await this.slack.conversations.list({
        types: 'public_channel,private_channel'
      });

      const channel = channels.channels?.find(ch => ch.name === channelName);
      
      if (channel && !channel.is_archived) {
        await this.slack.conversations.archive({
          channel: channel.id!
        });
        console.log(`  📦 Archived channel #${channelName}`);
      }
    } catch (error: any) {
      console.warn(`  ⚠️ Could not archive #${channelName}:`, error.data?.error || error.message);
    }
  }

  /**
   * Find user ID by name or email
   */
  async findUser(searchTerm: string): Promise<string | null> {
    try {
      const usersResult = await this.slack.users.list({});
      const user = usersResult.members?.find(u => 
        (u.real_name && u.real_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.profile?.display_name && u.profile.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.profile?.email && u.profile.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      return user?.id || null;
    } catch (error) {
      console.warn('Could not find user:', error);
      return null;
    }
  }

  /**
   * List all APM-related channels
   */
  async listAPMChannels(): Promise<void> {
    try {
      const channels = await this.slack.conversations.list({
        types: 'public_channel,private_channel'
      });

      const apmChannels = channels.channels?.filter(channel => 
        channel.name?.startsWith('proj-') || channel.name?.startsWith('apm-')
      ) || [];

      console.log('\n📋 APM Channels:');
      console.log('================');

      const projects = new Set<string>();
      const metaChannels: any[] = [];

      apmChannels.forEach(channel => {
        if (channel.name?.startsWith('proj-')) {
          const match = channel.name.match(/^proj-([^-]+)-/);
          if (match) {
            projects.add(match[1]);
          }
        } else if (channel.name?.startsWith('apm-')) {
          metaChannels.push(channel);
        }
      });

      // List by project
      for (const project of Array.from(projects).sort()) {
        console.log(`\n🎯 Project: ${project}`);
        const projectChannels = apmChannels
          .filter(ch => ch.name?.startsWith(`proj-${project}-`))
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        projectChannels.forEach(ch => {
          const status = ch.is_archived ? '📦' : '✅';
          console.log(`  ${status} #${ch.name}`);
        });
      }

      // List meta channels
      if (metaChannels.length > 0) {
        console.log('\n🔧 Meta Channels:');
        metaChannels
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          .forEach(ch => {
            const status = ch.is_archived ? '📦' : '✅';
            console.log(`  ${status} #${ch.name}`);
          });
      }

      console.log(`\nTotal APM channels: ${apmChannels.length}`);

    } catch (error) {
      console.error('Failed to list channels:', error);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`Usage: tsx channel-manager.ts <command> [options]

Commands:
  setup-project <name> [user]    Set up channels for a project (optionally invite user)
  setup-meta [user]              Set up APM meta channels (optionally invite user)
  list                           List all APM channels
  archive-project <name>         Archive project channels

Examples:
  tsx channel-manager.ts setup-project alpha
  tsx channel-manager.ts setup-project alpha jake
  tsx channel-manager.ts setup-meta jake
  tsx channel-manager.ts list
  tsx channel-manager.ts archive-project beta
`);
    process.exit(1);
  }

  try {
    const botToken = process.env.SLACK_BOT_TOKEN;
    if (!botToken) {
      console.error('SLACK_BOT_TOKEN environment variable not set');
      process.exit(1);
    }

    const manager = new SlackChannelManager(botToken);

    switch (command) {
      case 'setup-project':
        if (args.length < 2) {
          console.error('Usage: setup-project <project-name> [user-search-term]');
          process.exit(1);
        }
        
        let projectUsers: string[] = [];
        if (args[2]) {
          const userId = await manager.findUser(args[2]);
          if (userId) {
            projectUsers = [userId];
            console.log(`Found user for invitation: ${args[2]}`);
          } else {
            console.log(`Could not find user: ${args[2]}`);
          }
        }
        
        await manager.setupProjectChannels(args[1], projectUsers);
        break;

      case 'setup-meta':
        let metaUsers: string[] = [];
        if (args[1]) {
          const userId = await manager.findUser(args[1]);
          if (userId) {
            metaUsers = [userId];
            console.log(`Found user for invitation: ${args[1]}`);
          } else {
            console.log(`Could not find user: ${args[1]}`);
          }
        }
        
        await manager.setupMetaChannels(metaUsers);
        break;

      case 'list':
        await manager.listAPMChannels();
        break;

      case 'archive-project':
        if (args.length < 2) {
          console.error('Usage: archive-project <project-name>');
          process.exit(1);
        }
        await manager.archiveProjectChannels(args[1]);
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

export { SlackChannelManager };