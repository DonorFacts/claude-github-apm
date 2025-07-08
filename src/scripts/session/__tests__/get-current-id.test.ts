import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('get-current-id script', () => {
  const scriptPath = join(__dirname, '../get-current-id.ts');
  const conversationsDir = '.claude/conversations';
  
  beforeEach(() => {
    // Clean up conversations directory
    if (existsSync(conversationsDir)) {
      rmSync(conversationsDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up
    if (existsSync(conversationsDir)) {
      rmSync(conversationsDir, { recursive: true });
    }
  });

  describe('when no conversations exist', () => {
    it('should display helpful message when directory does not exist', () => {
      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain('No session data found');
      expect(result).toContain('Session ID will be captured on first tool use');
    });

    it('should display helpful message when directory is empty', () => {
      // Arrange
      mkdirSync(conversationsDir, { recursive: true });

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain('No session data found');
    });
  });

  describe('when single conversation exists', () => {
    it('should display session information', () => {
      // Arrange
      const sessionId = 'single-session-123';
      const sessionData = {
        sessionId,
        transcriptPath: '~/.claude/projects/test/transcript.jsonl',
        capturedAt: '2025-01-07T10:30:00Z',
        firstToolUse: 'Read'
      };
      
      const sessionDir = join(conversationsDir, sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'conversation.json'),
        JSON.stringify(sessionData, null, 2)
      );

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain(`Current Session ID: ${sessionId}`);
      expect(result).toContain(`Transcript Path: ${sessionData.transcriptPath}`);
      expect(result).toContain(`Captured: ${sessionData.capturedAt}`);
    });
  });

  describe('when multiple conversations exist', () => {
    it('should display most recently modified session', async () => {
      // Arrange
      const olderSession = {
        sessionId: 'older-session-456',
        transcriptPath: '~/.claude/projects/old/transcript.jsonl',
        capturedAt: '2025-01-06T10:00:00Z'
      };
      
      const newerSession = {
        sessionId: 'newer-session-789',
        transcriptPath: '~/.claude/projects/new/transcript.jsonl',
        capturedAt: '2025-01-07T15:00:00Z'
      };

      // Create older session
      const olderDir = join(conversationsDir, olderSession.sessionId);
      mkdirSync(olderDir, { recursive: true });
      writeFileSync(
        join(olderDir, 'conversation.json'),
        JSON.stringify(olderSession, null, 2)
      );

      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Create newer session
      const newerDir = join(conversationsDir, newerSession.sessionId);
      mkdirSync(newerDir, { recursive: true });
      writeFileSync(
        join(newerDir, 'conversation.json'),
        JSON.stringify(newerSession, null, 2)
      );

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert - should show newer session
      expect(result).toContain(`Current Session ID: ${newerSession.sessionId}`);
      expect(result).toContain(`Transcript Path: ${newerSession.transcriptPath}`);
      expect(result).not.toContain(olderSession.sessionId);
    });
  });

  describe('when session directories exist without conversation.json', () => {
    it('should ignore directories without conversation.json', () => {
      // Arrange
      const emptySessionDir = join(conversationsDir, 'empty-session');
      mkdirSync(emptySessionDir, { recursive: true });
      
      const validSession = {
        sessionId: 'valid-session-123',
        transcriptPath: '~/.claude/projects/valid/transcript.jsonl',
        capturedAt: '2025-01-07T12:00:00Z'
      };
      
      const validDir = join(conversationsDir, validSession.sessionId);
      mkdirSync(validDir, { recursive: true });
      writeFileSync(
        join(validDir, 'conversation.json'),
        JSON.stringify(validSession, null, 2)
      );

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain(`Current Session ID: ${validSession.sessionId}`);
      expect(result).not.toContain('empty-session');
    });
  });

  describe('error handling', () => {
    it('should handle malformed conversation.json gracefully', () => {
      // Arrange
      const sessionDir = join(conversationsDir, 'malformed-session');
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'conversation.json'),
        'not-valid-json'
      );

      // Act
      const result = execSync(`tsx ${scriptPath} 2>&1`, { encoding: 'utf8' });

      // Assert - should skip malformed file and continue
      expect(result).toContain('Warning: Invalid JSON');
      expect(result).toContain('No session data found');
    });
  });
});