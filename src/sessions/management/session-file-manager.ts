#!/usr/bin/env tsx
/**
 * Session File Manager - Directory-based session organization
 * 
 * Manages individual session YAML files organized by status in directories:
 * - apm/sessions/active/     - Currently running sessions  
 * - apm/sessions/paused/     - Temporarily stopped, resumable
 * - apm/sessions/completed/  - Finished work, archived
 * - apm/sessions/stale/      - Abandoned, cleanup candidates
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

export type SessionStatus = 'active' | 'completed' | 'stale';
export type TaskStatus = 'in_progress' | 'blocked' | 'completed' | 'review_needed';

export interface SessionFile {
  session: {
    id: string;
    status: SessionStatus;
    
    // Agent Identity
    role: string;
    specialization?: string;
    agent_prompt_version: string;
    
    // Work Context
    conversation_topic: string;
    current_task: string;
    task_status: TaskStatus;
    
    // Progress Summary
    work_completed: string[];
    most_recent_completed_task?: string; // Most recent task finished by agent
    work_in_progress: string[];
    next_actions: string[];
    blockers: string[];
    
    // Technical Context
    worktree: string;
    branch: string;
    context_file: string;  // timestamped file, not latest.md
    context_remaining_percent: number;
    estimated_tokens_remaining: number;
    
    // Timeline & Activity
    created: string;
    last_activity: string;
    agent_last_seen: string;  // When agent last sent a message
    user_last_seen: string;   // When user last sent a message
    last_context_save: string;
    message_count: number;
    session_duration_minutes: number;
    
    // Integration Links
    claude_conversation_id?: string;
    github_issues: string[];
    related_sessions: string[];
    
    // Environment
    environment: 'container' | 'host';
    container_id?: string;
    host_project_path: string;
    
    // Metadata
    created_by: string;
    last_moved?: string;
    auto_archive_after: string;
  };
}

export class SessionFileManager {
  private sessionsDir: string;
  private statusDirs: Record<SessionStatus, string>;

  constructor(sessionsDir: string) {
    this.sessionsDir = sessionsDir;
    this.statusDirs = {
      active: path.join(sessionsDir, 'active'),
      completed: path.join(sessionsDir, 'completed'),
      stale: path.join(sessionsDir, 'stale')
    } as Record<SessionStatus, string>;
    
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    Object.values(this.statusDirs).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Create a new session file in the active directory
   */
  createSession(sessionData: SessionFile): boolean {
    try {
      const filePath = path.join(this.statusDirs.active, `${sessionData.session.id}.yaml`);
      const yamlContent = yaml.dump(sessionData, { 
        indent: 2,
        lineWidth: 100,
        noRefs: true 
      });
      
      fs.writeFileSync(filePath, yamlContent);
      console.log(chalk.green('✓'), `Session created: ${sessionData.session.id}`);
      return true;
    } catch (error) {
      console.error(chalk.red('✗'), `Failed to create session: ${error}`);
      return false;
    }
  }

  /**
   * Move session between status directories
   */
  moveSession(sessionId: string, newStatus: SessionStatus): boolean {
    try {
      const currentFile = this.findSessionFile(sessionId);
      if (!currentFile) {
        console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
        return false;
      }

      const newPath = path.join(this.statusDirs[newStatus], `${sessionId}.yaml`);
      
      // Read, update status, and write to new location
      const sessionData = this.readSessionFile(currentFile.filePath);
      if (sessionData) {
        sessionData.session.status = newStatus;
        sessionData.session.last_moved = new Date().toISOString();
        
        const yamlContent = yaml.dump(sessionData, { 
          indent: 2,
          lineWidth: 100,
          noRefs: true 
        });
        
        fs.writeFileSync(newPath, yamlContent);
        fs.unlinkSync(currentFile.filePath);
        
        console.log(chalk.blue('→'), `Session moved to ${newStatus}: ${sessionId}`);
        return true;
      }
    } catch (error) {
      console.error(chalk.red('✗'), `Failed to move session: ${error}`);
      return false;
    }
    return false;
  }

  /**
   * Update session with new activity timestamp
   */
  updateActivity(sessionId: string): boolean {
    try {
      const currentFile = this.findSessionFile(sessionId);
      if (!currentFile) {
        console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
        return false;
      }

      const sessionData = this.readSessionFile(currentFile.filePath);
      if (sessionData) {
        sessionData.session.last_activity = new Date().toISOString();
        sessionData.session.message_count += 1;
        
        // Calculate session duration
        const created = new Date(sessionData.session.created);
        const now = new Date();
        sessionData.session.session_duration_minutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
        
        const yamlContent = yaml.dump(sessionData, { 
          indent: 2,
          lineWidth: 100,
          noRefs: true 
        });
        
        fs.writeFileSync(currentFile.filePath, yamlContent);
        return true;
      }
    } catch (error) {
      console.error(chalk.red('✗'), `Failed to update activity: ${error}`);
      return false;
    }
    return false;
  }

  /**
   * List sessions by status
   */
  listSessions(status?: SessionStatus): SessionFile[] {
    const sessions: SessionFile[] = [];
    
    const statusesToCheck = status ? [status] : Object.keys(this.statusDirs) as SessionStatus[];
    
    for (const statusToCheck of statusesToCheck) {
      const dir = this.statusDirs[statusToCheck];
      if (!fs.existsSync(dir)) continue;
      
      const files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'));
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const sessionData = this.readSessionFile(filePath);
        if (sessionData) {
          sessions.push(sessionData);
        }
      }
    }
    
    // Sort by last activity (most recent first)
    return sessions.sort((a, b) => 
      new Date(b.session.last_activity).getTime() - new Date(a.session.last_activity).getTime()
    );
  }

  /**
   * Get specific session by ID
   */
  getSession(sessionId: string): SessionFile | null {
    const file = this.findSessionFile(sessionId);
    return file ? this.readSessionFile(file.filePath) : null;
  }

  /**
   * Auto-organize sessions based on activity age and task status
   */
  autoOrganizeSessions(): void {
    const allSessions = this.listSessions();
    const now = new Date();
    
    for (const session of allSessions) {
      const lastActivity = new Date(session.session.last_activity);
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
      const daysSinceActivity = hoursSinceActivity / 24;
      
      let targetStatus: SessionStatus = session.session.status;
      
      // Smart auto-organization considering task status and time
      switch (session.session.status) {
        case 'active':
          // Only auto-stale after 24 hours, don't auto-pause (user should decide)
          if (hoursSinceActivity > 24) {
            targetStatus = 'stale';
          }
          break;
          
          
        case 'completed':
          // Completed sessions stay completed (no auto-archiving yet)
          break;
          
        case 'stale':
          // Stale sessions stay stale (manual cleanup required)
          break;
      }
      
      // Move if status should change
      if (targetStatus !== session.session.status) {
        this.moveSession(session.session.id, targetStatus);
      }
    }
  }


  /**
   * Mark a session as completed
   */
  completeSession(sessionId: string): boolean {
    const currentFile = this.findSessionFile(sessionId);
    if (!currentFile) {
      console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
      return false;
    }

    if (currentFile.status === 'completed') {
      console.log(chalk.yellow('⚠'), `Session ${sessionId} is already completed`);
      return true;
    }

    return this.moveSession(sessionId, 'completed');
  }

  /**
   * Update the most recent completed task for a session
   */
  updateCompletedTask(sessionId: string, taskDescription: string): boolean {
    const currentFile = this.findSessionFile(sessionId);
    if (!currentFile) {
      console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
      return false;
    }

    const sessionData = this.readSessionFile(currentFile.filePath);
    if (!sessionData) {
      return false;
    }

    // Update the most recent completed task and add to work_completed array
    sessionData.session.most_recent_completed_task = taskDescription;
    sessionData.session.work_completed.push(taskDescription);
    sessionData.session.last_activity = new Date().toISOString();
    sessionData.session.agent_last_seen = new Date().toISOString();

    try {
      const yamlContent = yaml.dump(sessionData, { 
        indent: 2,
        lineWidth: 100,
        noRefs: true 
      });
      
      fs.writeFileSync(currentFile.filePath, yamlContent);
      console.log(chalk.green('✓'), `Task completed: ${taskDescription}`);
      return true;
    } catch (error) {
      console.error(chalk.red('✗'), `Failed to update completed task: ${error}`);
      return false;
    }
  }

  /**
   * Update agent and user activity timestamps
   */
  updateActivityTimestamps(sessionId: string, agentActive: boolean = true, userActive: boolean = false): boolean {
    const currentFile = this.findSessionFile(sessionId);
    if (!currentFile) {
      return false;
    }

    const sessionData = this.readSessionFile(currentFile.filePath);
    if (!sessionData) {
      return false;
    }

    const now = new Date().toISOString();
    sessionData.session.last_activity = now;
    
    if (agentActive) {
      sessionData.session.agent_last_seen = now;
    }
    if (userActive) {
      sessionData.session.user_last_seen = now;
    }

    try {
      const yamlContent = yaml.dump(sessionData, { 
        indent: 2,
        lineWidth: 100,
        noRefs: true 
      });
      
      fs.writeFileSync(currentFile.filePath, yamlContent);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper: Find session file across all directories
   */
  private findSessionFile(sessionId: string): { filePath: string; status: SessionStatus } | null {
    for (const [status, dir] of Object.entries(this.statusDirs)) {
      const filePath = path.join(dir, `${sessionId}.yaml`);
      if (fs.existsSync(filePath)) {
        return { filePath, status: status as SessionStatus };
      }
    }
    return null;
  }

  /**
   * Helper: Read and parse session YAML file
   */
  private readSessionFile(filePath: string): SessionFile | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return yaml.load(content) as SessionFile;
    } catch (error) {
      console.error(chalk.yellow('Warning'), `Could not read session file ${filePath}: ${error}`);
      return null;
    }
  }
}