import { SessionManager, Session } from './manager';
import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';

// Mock fs to control file system operations
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock chalk to avoid ES module issues
jest.mock('chalk', () => ({
  default: {
    gray: (str: string) => str,
    yellow: (str: string) => str,
    blue: (str: string) => str,
    green: (str: string) => str,
    red: (str: string) => str,
  },
  gray: (str: string) => str,
  yellow: (str: string) => str,
  blue: (str: string) => str,
  green: (str: string) => str,
  red: (str: string) => str,
}));

describe('SessionManager', () => {
  let manager: SessionManager;
  const mockSessionsDir = '/test/sessions';

  beforeEach(() => {
    manager = new SessionManager(mockSessionsDir);
    jest.clearAllMocks();
  });

  describe('listSessions', () => {
    it('should return active sessions when they have recent heartbeats', () => {
      // Arrange: Mock registry with sessions that have recent heartbeats
      const now = new Date();
      const recentHeartbeat = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      
      const mockRegistry = {
        sessions: [
          {
            id: 'test-session-1',
            status: 'active',
            role: 'developer',
            specialization: 'test',
            worktree: 'test-branch',
            branch: 'test-branch',
            last_heartbeat: recentHeartbeat.toISOString(),
            created: recentHeartbeat.toISOString(),
            context_file: 'context/latest.md',
            environment: 'container'
          },
          {
            id: 'test-session-2', 
            status: 'active',
            role: 'developer',
            specialization: 'test2',
            worktree: 'test-branch',
            branch: 'test-branch', 
            last_heartbeat: recentHeartbeat.toISOString(),
            created: recentHeartbeat.toISOString(),
            context_file: 'context/latest.md',
            environment: 'container'
          }
        ]
      };

      // Mock file system operations
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yaml.dump(mockRegistry));

      // Act: Call listSessions with 'active' filter
      const sessions = manager.listSessions('active');

      // Assert: Should return 2 active sessions with recent heartbeats
      expect(sessions).toHaveLength(2);
      expect(sessions[0].status).toBe('active');
      expect(sessions[1].status).toBe('active');
    });

    it('should mark sessions as crashed when heartbeat is stale', () => {
      // Arrange: Mock registry with sessions that have stale heartbeats
      const now = new Date();
      const staleHeartbeat = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago (stale with 15min threshold)
      
      const mockRegistry = {
        sessions: [
          {
            id: 'stale-session',
            status: 'active',
            role: 'developer', 
            specialization: 'test',
            worktree: 'test-branch',
            branch: 'test-branch',
            last_heartbeat: staleHeartbeat.toISOString(),
            created: staleHeartbeat.toISOString(),
            context_file: 'context/latest.md',
            environment: 'container'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yaml.dump(mockRegistry));

      // Act: Call listSessions with 'active' filter
      const activeSessions = manager.listSessions('active');
      const crashedSessions = manager.listSessions('crashed');

      // Assert: Should mark as crashed and filter accordingly
      expect(activeSessions).toHaveLength(0);
      expect(crashedSessions).toHaveLength(1);
      expect(crashedSessions[0].status).toBe('crashed');
    });

    it('should return sessions with recent heartbeats (within 15 minutes)', () => {
      // Arrange: Use sessions with heartbeats within the new 15-minute threshold
      const now = new Date();
      const recentHeartbeat = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago (within 15min threshold)
      
      const mockRegistry = {
        sessions: [
          {
            id: 'recent-session-1',
            status: 'active',
            role: 'developer',
            specialization: 'ui-components',
            worktree: 'feature-multi-agent-memory-architecture',
            branch: 'feature-multi-agent-memory-architecture',
            last_heartbeat: recentHeartbeat.toISOString(),
            created: recentHeartbeat.toISOString(),
            context_file: 'context/latest.md',
            environment: 'container'
          },
          {
            id: 'recent-session-2',
            status: 'active',
            role: 'developer',
            specialization: 'api-backend', 
            worktree: 'feature-multi-agent-memory-architecture',
            branch: 'feature-multi-agent-memory-architecture',
            last_heartbeat: recentHeartbeat.toISOString(),
            created: recentHeartbeat.toISOString(),
            context_file: 'context/latest.md',
            environment: 'container'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yaml.dump(mockRegistry));

      // Act: Should return sessions within threshold
      const sessions = manager.listSessions('active');

      // Assert: Should return 2 active sessions within threshold
      expect(sessions.length).toBe(2);
      expect(sessions[0].status).toBe('active');
      expect(sessions[1].status).toBe('active');
    });
  });
});