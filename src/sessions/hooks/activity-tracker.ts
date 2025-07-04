/**
 * Activity Tracker - Automatic session activity updates
 * 
 * Integrates with agent workflow to automatically track:
 * - Agent responses (agent_last_seen)
 * - Task completions (most_recent_completed_task)
 * - Activity timestamps
 */

import { SessionFileManager } from '../management/session-file-manager';
import * as path from 'path';

export class ActivityTracker {
  private sessionManager: SessionFileManager;
  private currentSessionId: string | null = null;

  constructor() {
    const sessionsDir = process.env.APM_SESSIONS || path.join(process.cwd(), 'apm', 'sessions');
    this.sessionManager = new SessionFileManager(sessionsDir);
    
    // Try to get current session ID from environment
    this.currentSessionId = process.env.APM_SESSION_ID || null;
  }

  /**
   * Called when agent sends a response
   */
  recordAgentActivity(sessionId?: string): boolean {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return false;

    return this.sessionManager.updateActivityTimestamps(targetSessionId, true, false);
  }

  /**
   * Called when user sends a message
   */
  recordUserActivity(sessionId?: string): boolean {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return false;

    return this.sessionManager.updateActivityTimestamps(targetSessionId, false, true);
  }

  /**
   * Called when a task is completed
   */
  recordTaskCompletion(taskDescription: string, sessionId?: string): boolean {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return false;

    return this.sessionManager.updateCompletedTask(targetSessionId, taskDescription);
  }

  /**
   * Set the current session ID for this tracker
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
}

// Global singleton instance
export const activityTracker = new ActivityTracker();