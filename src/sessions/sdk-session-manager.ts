/**
 * SDK Session Manager - Claude Code SDK integration for session management
 * 
 * Provides high-level abstractions for managing Claude conversations through the SDK
 */

import chalk from 'chalk';
import { ClaudeCodeBridge } from './claude-code-bridge';

import { query, type SDKMessage } from "@anthropic-ai/claude-code";

interface SDKSessionConfig {
  apmSessionId: string;
  role: string;
  specialization?: string;
  cwd?: string;
  maxTurns?: number;
}

interface ConversationState {
  claudeSessionId: string;
  messageCount: number;
  lastActivity: string;
  status: 'active' | 'completed' | 'error';
}

export class SDKSessionManager {
  private bridge: ClaudeCodeBridge;
  private activeConversations: Map<string, ConversationState> = new Map();

  constructor() {
    this.bridge = new ClaudeCodeBridge();
  }

  /**
   * Start a new Claude conversation for an APM session
   */
  async startConversation(config: SDKSessionConfig, initialPrompt: string): Promise<string | null> {
    try {
      console.log(chalk.blue('🚀'), `Starting Claude conversation for ${config.apmSessionId}...`);
      
      // Actual SDK implementation
      // SDK already imported at top of file
      
      const messages = [];
      const abortController = new AbortController();
      
      for await (const message of query({
        prompt: initialPrompt,
        abortController,
        options: {
          cwd: config.cwd || process.cwd(),
          maxTurns: config.maxTurns || 1
        }
      })) {
        messages.push(message);
        
        // Capture Claude session ID from first message
        if (messages.length === 1 && message.session_id) {
          const claudeSessionId = message.session_id;
          
          // Create bridge mapping
          const projectPath = this.bridge.getCurrentProjectPath();
          this.bridge.createBridgeMapping(config.apmSessionId, claudeSessionId, projectPath);
          
          // Track conversation state
          this.activeConversations.set(config.apmSessionId, {
            claudeSessionId,
            messageCount: 1,
            lastActivity: new Date().toISOString(),
            status: 'active'
          });
          
          console.log(chalk.green('✓'), `Conversation started: ${claudeSessionId.substring(0, 8)}...`);
          console.log(chalk.dim(`   Bridge: ${config.apmSessionId} → ${claudeSessionId}`));
          
          return claudeSessionId;
        }
      }
      
      // If we reach here, no session ID was captured
      console.warn(chalk.yellow('⚠️'), 'No session ID captured from SDK response');
      return null;
      
    } catch (error) {
      console.error(chalk.red('✗'), 'Failed to start conversation:', error);
      return null;
    }
  }

  /**
   * Resume an existing Claude conversation
   */
  async resumeConversation(apmSessionId: string, continuationPrompt?: string): Promise<boolean> {
    try {
      // Find Claude session UUID
      const claudeSessionId = await this.bridge.findClaudeSessionUuid(apmSessionId);
      if (!claudeSessionId) {
        console.error(chalk.red('✗'), `No Claude session found for APM session: ${apmSessionId}`);
        return false;
      }

      console.log(chalk.blue('🔄'), `Resuming Claude conversation ${claudeSessionId.substring(0, 8)}...`);
      
      // Actual SDK implementation
      // SDK already imported at top of file
      
      const resumePrompt = continuationPrompt || `Resuming APM session ${apmSessionId}`;
      const messages = [];
      const abortController = new AbortController();
      
      for await (const message of query({
        prompt: resumePrompt,
        abortController,
        options: {
          resume: claudeSessionId, // Resume specific conversation
          maxTurns: -1 // Interactive mode
        }
      })) {
        messages.push(message);
        
        // Update conversation state
        const state = this.activeConversations.get(apmSessionId);
        if (state) {
          state.messageCount += 1;
          state.lastActivity = new Date().toISOString();
          state.status = 'active';
        }
        
        // Handle interactive mode
        if (message.type === 'assistant') {
          console.log(chalk.blue('Claude:'), (message as any).content || 'Response received');
        } else if (message.type === 'user') {
          console.log(chalk.green('User:'), (message as any).content || 'User input');
        }
      }
      
      return true;
      
    } catch (error) {
      console.error(chalk.red('✗'), 'Failed to resume conversation:', error);
      return false;
    }
  }

  /**
   * Get conversation state for an APM session
   */
  async getConversationState(apmSessionId: string): Promise<ConversationState | null> {
    // Check in-memory state first
    if (this.activeConversations.has(apmSessionId)) {
      return this.activeConversations.get(apmSessionId)!;
    }

    // Try to find via bridge mapping
    const claudeSessionId = await this.bridge.findClaudeSessionUuid(apmSessionId);
    if (!claudeSessionId) {
      return null;
    }

    // Get Claude session info
    const claudeSessionInfo = await this.bridge.getClaudeSessionInfo(claudeSessionId);
    if (!claudeSessionInfo) {
      return null;
    }

    return {
      claudeSessionId,
      messageCount: claudeSessionInfo.messageCount,
      lastActivity: claudeSessionInfo.lastActivity,
      status: 'active' // Default assumption
    };
  }

  /**
   * List all conversations for current project
   */
  async listConversations(): Promise<{ apmSessionId: string; state: ConversationState }[]> {
    const result: { apmSessionId: string; state: ConversationState }[] = [];

    // Get all bridge mappings
    // TODO: Implement bridge.getAllMappings() method
    console.log(chalk.blue('📋'), 'Listing SDK-managed conversations...');
    console.log(chalk.yellow('⚠️'), 'Full implementation pending SDK installation');

    return result;
  }

  /**
   * Cleanup completed or stale conversations
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    console.log(chalk.blue('🧹'), `Cleaning up conversations older than ${olderThanDays} days...`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    
    for (const [apmSessionId, state] of this.activeConversations) {
      const lastActivity = new Date(state.lastActivity);
      if (lastActivity < cutoffDate) {
        this.activeConversations.delete(apmSessionId);
        cleanedCount++;
        console.log(chalk.gray(`   Cleaned: ${apmSessionId}`));
      }
    }
    
    console.log(chalk.green('✓'), `Cleaned ${cleanedCount} stale conversations`);
    return cleanedCount;
  }
}

/**
 * Helper function to build agent initialization prompts
 */
export function buildAgentPrompt(role: string, specialization?: string): string {
  const basePrompt = `/agent-${role}-init`;
  
  if (specialization) {
    return `${basePrompt} ${specialization}`;
  }
  
  return basePrompt;
}

/**
 * Helper function to check if SDK is available
 */
export function isSDKAvailable(): boolean {
  try {
    require.resolve('@anthropic-ai/claude-code');
    return true;
  } catch {
    return false;
  }
}