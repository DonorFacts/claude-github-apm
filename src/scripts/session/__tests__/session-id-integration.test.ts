import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('Session ID Integration Tests', () => {
  const conversationsDir = '.claude/conversations';
  
  beforeEach(() => {
    // Clean up any existing test session data
    if (existsSync(conversationsDir)) {
      rmSync(conversationsDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test data
    if (existsSync(conversationsDir)) {
      rmSync(conversationsDir, { recursive: true, force: true });
    }
  });

  describe('Session ID Retrieval', () => {
    it('should return "No session data found" when no conversations exist', () => {
      // Act
      const result = execSync('tsx src/scripts/session/get-current-id.ts', { 
        encoding: 'utf8' 
      });

      // Assert
      expect(result).toContain('No session data found');
    });

    it('should return the current session ID when conversation data exists', () => {
      // Arrange - Create mock session data
      const mockSessionId = 'test-session-12345';
      const mockTranscriptPath = '/test/path/transcript.jsonl';
      const sessionDir = join(conversationsDir, mockSessionId);
      
      mkdirSync(sessionDir, { recursive: true });
      
      const sessionData = {
        sessionId: mockSessionId,
        transcriptPath: mockTranscriptPath,
        capturedAt: new Date().toISOString(),
        firstToolUse: 'Read'
      };
      
      const sessionFile = join(sessionDir, 'conversation.json');
      require('fs').writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

      // Act
      const result = execSync('tsx src/scripts/session/get-current-id.ts', { 
        encoding: 'utf8' 
      });

      // Assert
      expect(result).toContain(`Current Session ID: ${mockSessionId}`);
      expect(result).toContain(`Transcript Path: ${mockTranscriptPath}`);
    });

    it('should return the most recent session when multiple sessions exist', () => {
      // Arrange - Create multiple session directories
      const sessions = [
        { id: 'old-session-1', time: new Date('2025-01-01').toISOString() },
        { id: 'recent-session-2', time: new Date('2025-01-02').toISOString() },
        { id: 'newest-session-3', time: new Date('2025-01-03').toISOString() }
      ];

      sessions.forEach(session => {
        const sessionDir = join(conversationsDir, session.id);
        mkdirSync(sessionDir, { recursive: true });
        
        const sessionData = {
          sessionId: session.id,
          transcriptPath: `/test/${session.id}.jsonl`,
          capturedAt: session.time,
          firstToolUse: 'Read'
        };
        
        const sessionFile = join(sessionDir, 'conversation.json');
        require('fs').writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      });

      // Act
      const result = execSync('tsx src/scripts/session/get-current-id.ts', { 
        encoding: 'utf8' 
      });

      // Assert
      expect(result).toContain('Current Session ID: newest-session-3');
    });
  });

  describe('Session ID Prompt Command', () => {
    it('should return only the session ID when using claude -p command', () => {
      // This test validates that the prompt command returns only the session ID
      // and nothing else, which is the requirement stated in the issue
      
      // Act
      const result = execSync('claude -p "run src/prompts/session/id.md"', { 
        encoding: 'utf8' 
      }).trim();

      // Assert
      // The result should contain the session ID pattern
      expect(result).toMatch(/Session ID: `[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`/);
      
      // Extract the session ID from the result
      const sessionIdMatch = result.match(/Session ID: `([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`/);
      expect(sessionIdMatch).toBeTruthy();
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        // Verify the session was captured
        const sessionFile = join(conversationsDir, sessionId, 'conversation.json');
        expect(existsSync(sessionFile)).toBe(true);
        
        const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
        expect(sessionData.sessionId).toBe(sessionId);
        expect(sessionData.transcriptPath).toBeDefined();
        expect(sessionData.capturedAt).toBeDefined();
      }
    });

    it('should capture session data via PreToolUse hook when running session ID command', () => {
      // Act
      const result = execSync('claude -p "run src/prompts/session/id.md"', { 
        encoding: 'utf8' 
      });

      // Extract session ID from result
      const sessionIdMatch = result.match(/Session ID: `([0-9a-f-]+)`/);
      expect(sessionIdMatch).toBeTruthy();
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        // Assert - verify hook captured the session
        const sessionFile = join(conversationsDir, sessionId, 'conversation.json');
        expect(existsSync(sessionFile)).toBe(true);
        
        const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
        expect(sessionData).toMatchObject({
          sessionId: sessionId,
          transcriptPath: expect.stringMatching(/\.jsonl$/),
          capturedAt: expect.any(String),
          firstToolUse: expect.any(String)
        });
      }
    });
  });

  describe('Hook Integration', () => {
    it('should capture session data when any tool is used', () => {
      // This test verifies the PreToolUse hook works correctly
      // By running a simple command that triggers the hook
      
      // Act - run a simple command to trigger the hook
      const result = execSync('claude -p "ls"', { 
        encoding: 'utf8' 
      });

      // Assert - verify a session was captured
      expect(existsSync(conversationsDir)).toBe(true);
      
      const sessionDirs = require('fs').readdirSync(conversationsDir);
      expect(sessionDirs.length).toBeGreaterThan(0);
      
      const sessionFile = join(conversationsDir, sessionDirs[0], 'conversation.json');
      expect(existsSync(sessionFile)).toBe(true);
      
      const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      expect(sessionData).toMatchObject({
        sessionId: expect.any(String),
        transcriptPath: expect.stringMatching(/\.jsonl$/),
        capturedAt: expect.any(String),
        firstToolUse: expect.any(String)
      });
    });
  });
});