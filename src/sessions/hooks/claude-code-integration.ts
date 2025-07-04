/**
 * Claude Code Integration - Automatic session tracking hooks
 * 
 * Integrates session activity tracking into Claude Code's native tools and workflows
 */

import { activityTracker } from './activity-tracker';

interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
}

let previousTodos: TodoItem[] = [];

/**
 * Hook for TodoWrite tool - automatically tracks completed tasks
 */
export function hookTodoWrite(newTodos: TodoItem[]): void {
  // Find newly completed tasks by comparing with previous state
  const newlyCompleted = newTodos.filter(todo => {
    const wasCompleted = previousTodos.some(prev => 
      prev.id === todo.id && prev.status === 'completed'
    );
    return todo.status === 'completed' && !wasCompleted;
  });

  // Record each newly completed task
  newlyCompleted.forEach(task => {
    activityTracker.recordTaskCompletion(task.content);
  });

  // Update previous state
  previousTodos = [...newTodos];
  
  // Record agent activity (agent updated todos)
  activityTracker.recordAgentActivity();
}

/**
 * Initialize session tracking for current agent session
 */
export function initializeAgentSession(): void {
  // Try to get session ID from environment or current session files
  const sessionId = process.env.APM_SESSION_ID || discoverCurrentSession();
  
  if (sessionId) {
    activityTracker.setCurrentSession(sessionId);
    activityTracker.recordAgentActivity(); // Mark agent as starting
  }
}

/**
 * Discover current session ID from active sessions
 */
function discoverCurrentSession(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const sessionsDir = path.join(process.cwd(), 'apm', 'sessions', 'active');
    if (!fs.existsSync(sessionsDir)) return null;
    
    const sessionFiles = fs.readdirSync(sessionsDir)
      .filter((file: string) => file.endsWith('.yaml'))
      .map((file: string) => file.replace('.yaml', ''));
    
    // Return the most recent session (could be enhanced with better logic)
    return sessionFiles.length > 0 ? sessionFiles[0] : null;
  } catch {
    return null;
  }
}

/**
 * Hook for agent response completion
 */
export function onAgentResponseComplete(): void {
  activityTracker.recordAgentActivity();
}

/**
 * Hook for tool usage (Read, Edit, Bash, etc.)
 */
export function onToolUsage(): void {
  activityTracker.recordAgentActivity();
}

// Auto-initialize when module is loaded
initializeAgentSession();

/**
 * Capture Claude Code session UUID for restoration bridge
 */
function captureClaudeUuid(): void {
  // Import the capture function dynamically to avoid circular dependencies
  try {
    const { captureClaudeSessionUuid } = require('../uuid-capture');
    
    // Capture UUID after a brief delay to ensure Claude session is established
    setTimeout(() => {
      captureClaudeSessionUuid();
    }, 3000);
  } catch (error) {
    console.error('Error setting up Claude UUID capture:', error);
  }
}

// Auto-capture UUID when module loads (if in Claude environment)
if (process.env.APM_SESSION_ID) {
  captureClaudeUuid();
}