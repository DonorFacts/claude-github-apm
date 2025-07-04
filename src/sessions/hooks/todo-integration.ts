/**
 * Todo Integration - Automatic task completion tracking
 * 
 * Hooks into TodoWrite to automatically update session data when tasks are completed
 */

import { activityTracker } from './activity-tracker';

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

/**
 * Enhanced TodoWrite that automatically tracks completed tasks
 */
export function trackingTodoWrite(todos: TodoItem[]): void {
  // Find newly completed tasks (comparing against previous state would require storage)
  const completedTasks = todos.filter(todo => todo.status === 'completed');
  
  // Record the most recent completed task
  if (completedTasks.length > 0) {
    // Get the most recently completed task (assuming last in array is most recent)
    const latestCompleted = completedTasks[completedTasks.length - 1];
    activityTracker.recordTaskCompletion(latestCompleted.content);
  }

  // Always record agent activity when todos are updated
  activityTracker.recordAgentActivity();
}

/**
 * Hook for agent response completion
 */
export function onAgentResponse(): void {
  activityTracker.recordAgentActivity();
}

/**
 * Hook for user message received
 */
export function onUserMessage(): void {
  activityTracker.recordUserActivity();
}

/**
 * Initialize session tracking
 */
export function initializeSessionTracking(sessionId: string): void {
  activityTracker.setCurrentSession(sessionId);
  activityTracker.recordAgentActivity(); // Mark agent as active when starting
}