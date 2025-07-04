/**
 * Tests for SessionFileManager - Directory-based session organization
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SessionFileManager, SessionFile, SessionStatus } from './session-file-manager';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock yaml module  
jest.mock('js-yaml');
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('SessionFileManager', () => {
  let manager: SessionFileManager;
  const mockSessionsDir = '/test/sessions';

  beforeEach(() => {
    manager = new SessionFileManager(mockSessionsDir);
    jest.clearAllMocks();
  });

  const createMockSession = (id: string, status: SessionStatus): SessionFile => ({
    session: {
      id,
      status,
      role: 'developer',
      specialization: 'test',
      agent_prompt_version: 'v1.0.0',
      conversation_topic: 'Test topic',
      current_task: 'Test task',
      task_status: 'in_progress',
      work_completed: [],
      most_recent_completed_task: undefined,
      work_in_progress: [],
      next_actions: [],
      blockers: [],
      worktree: 'test-branch',
      branch: 'test-branch',
      context_file: 'context/latest.md',
      context_remaining_percent: 80,
      estimated_tokens_remaining: 100000,
      created: '2025-07-02T19:00:00Z',
      last_activity: '2025-07-02T19:00:00Z',
      agent_last_seen: '2025-07-02T19:00:00Z',
      user_last_seen: '2025-07-02T19:00:00Z',
      last_context_save: '2025-07-02T19:00:00Z',
      message_count: 10,
      session_duration_minutes: 30,
      github_issues: [],
      related_sessions: [],
      environment: 'container',
      host_project_path: '/test/project',
      created_by: 'test-user',
      auto_archive_after: '2025-07-09T19:00:00Z'
    }
  });

  describe('createSession', () => {
    it('should create a new session file in active directory', () => {
      // Arrange
      const sessionData = createMockSession('test-session-1', 'active');
      mockFs.writeFileSync.mockImplementation(() => {});
      mockYaml.dump.mockReturnValue('yaml content');

      // Act
      const result = manager.createSession(sessionData);

      // Assert
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.join(mockSessionsDir, 'active', 'test-session-1.yaml'),
        'yaml content'
      );
    });
  });

  describe('completeSession', () => {
    it('should complete an active session', () => {
      // Arrange: Mock active session exists
      const session = createMockSession('test-session-1', 'active');
      mockFs.existsSync.mockImplementation((path: any) => 
        path.includes('active/test-session-1.yaml')
      );
      mockFs.readFileSync.mockReturnValue(yaml.dump(session));
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.unlinkSync.mockImplementation(() => {});

      // Act: Complete the session
      const result = manager.completeSession('test-session-1');

      // Assert: Should succeed and move file to completed
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('completed/test-session-1.yaml'),
        expect.any(String)
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('active/test-session-1.yaml')
      );
    });

    it('should not complete a non-existent session', () => {
      // Arrange: No session exists
      mockFs.existsSync.mockReturnValue(false);

      // Mock console.error to capture output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act: Try to complete non-existent session
      const result = manager.completeSession('non-existent');

      // Assert: Should fail with error message
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Session not found')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('listSessions', () => {
    it('should list sessions by status', () => {
      // Arrange: Mock directory contents
      (mockFs.readdirSync as jest.Mock).mockImplementation((dir: any) => {
        if (dir.includes('active')) return ['session1.yaml', 'session2.yaml'];
        if (dir.includes('completed')) return ['session3.yaml'];
        if (dir.includes('stale')) return [];
        return [];
      });

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('session1.yaml')) {
          return yaml.dump(createMockSession('session1', 'active'));
        }
        if (filePath.includes('session2.yaml')) {
          return yaml.dump(createMockSession('session2', 'active'));
        }
        if (filePath.includes('session3.yaml')) {
          return yaml.dump(createMockSession('session3', 'completed'));
        }
        return '';
      });

      // Act: List active sessions
      const activeSessions = manager.listSessions('active');

      // Assert: Should return active sessions
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions[0].session.id).toBe('session1');
      expect(activeSessions[1].session.id).toBe('session2');
    });

    it('should list all sessions when no filter provided', () => {
      // Arrange: Mock directory contents
      (mockFs.readdirSync as jest.Mock).mockImplementation((dir: any) => {
        if (dir.includes('active')) return ['session1.yaml'];
        if (dir.includes('completed')) return ['session2.yaml'];  
        if (dir.includes('stale')) return ['session3.yaml'];
        return [];
      });

      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('session1.yaml')) {
          return yaml.dump(createMockSession('session1', 'active'));
        }
        if (filePath.includes('session2.yaml')) {
          return yaml.dump(createMockSession('session2', 'completed'));
        }
        if (filePath.includes('session3.yaml')) {
          return yaml.dump(createMockSession('session3', 'stale'));
        }
        return '';
      });

      // Act: List all sessions
      const allSessions = manager.listSessions();

      // Assert: Should return all sessions
      expect(allSessions).toHaveLength(3);
    });
  });

  describe('updateActivity', () => {
    it('should update activity timestamp for existing session', () => {
      // Arrange: Mock session exists
      const session = createMockSession('test-session-1', 'active');
      mockFs.existsSync.mockImplementation((path: any) => 
        path.includes('active/test-session-1.yaml')
      );
      mockFs.readFileSync.mockReturnValue(yaml.dump(session));
      mockFs.writeFileSync.mockImplementation(() => {});

      // Act: Update activity
      const result = manager.updateActivity('test-session-1');

      // Assert: Should succeed
      expect(result).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('active/test-session-1.yaml'),
        expect.any(String)
      );
    });
  });
});