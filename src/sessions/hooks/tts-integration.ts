/**
 * TTS Hook Integration - Automatic speech synthesis for Claude Code events
 * 
 * Integrates TTS system with Claude Code workflow events for automatic speech feedback
 */

import { TTSHookEvent } from '../../config/schemas/voice-settings-schema';
import { HookHandler } from '../../tts/hooks/hook-handler';
import { activityTracker } from './activity-tracker';

export class TTSHookIntegration {
  private hookHandler: HookHandler;
  private currentSessionId: string | null = null;

  constructor() {
    this.hookHandler = new HookHandler();
    
    // Try to get current session ID from environment
    this.currentSessionId = process.env.APM_SESSION_ID || null;
  }

  /**
   * Called when agent sends a response
   */
  async onAgentResponse(content: string, metadata?: Partial<TTSHookEvent['metadata']>): Promise<void> {
    const event: TTSHookEvent = {
      type: 'agent_response',
      content,
      metadata: {
        sessionId: this.currentSessionId || 'unknown',
        timestamp: Date.now(),
        ...metadata
      }
    };

    // Fire-and-forget pattern to avoid blocking agent response
    this.handleEventAsync(event);
  }

  /**
   * Called when a task is completed
   */
  async onTaskCompletion(content: string, metadata?: Partial<TTSHookEvent['metadata']>): Promise<void> {
    const event: TTSHookEvent = {
      type: 'task_completion',
      content,
      metadata: {
        sessionId: this.currentSessionId || 'unknown',
        timestamp: Date.now(),
        priority: 'medium',
        ...metadata
      }
    };

    // Fire-and-forget pattern
    this.handleEventAsync(event);
  }

  /**
   * Called when an error occurs
   */
  async onError(content: string, metadata?: Partial<TTSHookEvent['metadata']>): Promise<void> {
    const event: TTSHookEvent = {
      type: 'error',
      content,
      metadata: {
        sessionId: this.currentSessionId || 'unknown',
        timestamp: Date.now(),
        priority: 'high',
        ...metadata
      }
    };

    // Fire-and-forget pattern
    this.handleEventAsync(event);
  }

  /**
   * Called for progress updates
   */
  async onProgress(content: string, metadata?: Partial<TTSHookEvent['metadata']>): Promise<void> {
    const event: TTSHookEvent = {
      type: 'progress',
      content,
      metadata: {
        sessionId: this.currentSessionId || 'unknown',
        timestamp: Date.now(),
        priority: 'low',
        ...metadata
      }
    };

    // Fire-and-forget pattern
    this.handleEventAsync(event);
  }

  /**
   * Generic hook event handler
   */
  async onHookEvent(event: TTSHookEvent): Promise<void> {
    // Ensure session ID is set
    if (!event.metadata.sessionId && this.currentSessionId) {
      event.metadata.sessionId = this.currentSessionId;
    }

    // Fire-and-forget pattern
    this.handleEventAsync(event);
  }

  /**
   * Set the current session ID for this integration
   */
  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Get the current session ID
   */
  getCurrentSession(): string | null {
    return this.currentSessionId;
  }

  /**
   * Check if TTS integration is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      return await this.hookHandler.isEnabled();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get integration status for debugging
   */
  async getStatus(): Promise<{
    enabled: boolean;
    currentSession: string | null;
    hookHandlerStatus: any;
  }> {
    return {
      enabled: await this.isEnabled(),
      currentSession: this.currentSessionId,
      hookHandlerStatus: await this.hookHandler.getStatus()
    };
  }

  /**
   * Handle event asynchronously without blocking
   */
  private handleEventAsync(event: TTSHookEvent): void {
    // Use setTimeout to ensure completely non-blocking execution
    setTimeout(async () => {
      try {
        await this.hookHandler.handleHookEvent(event);
      } catch (error) {
        // Log error but don't throw - hooks should never break the main flow
        console.error('[TTS Hook Integration] Error handling event:', error);
      }
    }, 0);
  }

  /**
   * Build context information for the hook event
   */
  private buildContext(): TTSHookEvent['context'] {
    try {
      // Get recent activity from activity tracker
      const recentActivity: string[] = [];
      
      // Try to get current branch (basic implementation)
      let currentBranch: string | undefined;
      try {
        const { execSync } = require('child_process');
        currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { 
          encoding: 'utf8', 
          timeout: 1000,
          stdio: 'pipe'
        }).trim();
      } catch {
        // Ignore git errors
      }

      return {
        recentActivity,
        currentBranch,
        activeFiles: [] // TODO: Could be enhanced with file system monitoring
      };
    } catch (error) {
      // Return minimal context on any error
      return {
        recentActivity: [],
        activeFiles: []
      };
    }
  }
}

// Export a singleton instance for convenience
export const ttsHookIntegration = new TTSHookIntegration();