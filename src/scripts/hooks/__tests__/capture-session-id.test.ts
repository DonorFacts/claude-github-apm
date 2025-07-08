import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('capture-session-id hook', () => {
  const hookPath = join(__dirname, '../capture-session-id.ts');
  const conversationsDir = '.claude/conversations';
  const testSessionId = 'test-session-12345';
  const testTranscriptPath = '~/.claude/projects/test/transcript.jsonl';
  
  beforeEach(() => {
    // Clean up any existing test data
    if (existsSync(join(conversationsDir, testSessionId))) {
      rmSync(join(conversationsDir, testSessionId), { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test data
    if (existsSync(join(conversationsDir, testSessionId))) {
      rmSync(join(conversationsDir, testSessionId), { recursive: true });
    }
  });

  describe('when receiving valid hook input', () => {
    it('should capture session data on first tool use', () => {
      // Arrange
      const hookInput = {
        session_id: testSessionId,
        transcript_path: testTranscriptPath,
        hook_event_name: 'PreToolUse',
        tool_name: 'Read',
        tool_input: { file_path: '/test/file.txt' }
      };

      // Act
      const result = execSync(
        `tsx ${hookPath} '${JSON.stringify(hookInput)}'`,
        { encoding: 'utf8' }
      );

      // Assert
      const sessionFile = join(conversationsDir, testSessionId, 'conversation.json');
      expect(existsSync(sessionFile)).toBe(true);
      
      const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      expect(sessionData).toMatchObject({
        sessionId: testSessionId,
        transcriptPath: testTranscriptPath,
        firstToolUse: 'Read'
      });
      expect(sessionData.capturedAt).toBeDefined();
      expect(new Date(sessionData.capturedAt).getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should not overwrite existing session data', () => {
      // Arrange - create existing session
      const sessionDir = join(conversationsDir, testSessionId);
      mkdirSync(sessionDir, { recursive: true });
      const existingData = {
        sessionId: testSessionId,
        transcriptPath: '/old/path.jsonl',
        capturedAt: '2024-01-01T00:00:00Z',
        firstToolUse: 'Write'
      };
      const sessionFile = join(sessionDir, 'conversation.json');
      writeFileSync(sessionFile, JSON.stringify(existingData, null, 2));

      const hookInput = {
        session_id: testSessionId,
        transcript_path: testTranscriptPath,
        hook_event_name: 'PreToolUse',
        tool_name: 'Read'
      };

      // Act
      execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);

      // Assert - should not overwrite
      const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      expect(sessionData).toEqual(existingData);
    });

    it('should always exit with code 0 to approve tool use', () => {
      // Arrange
      const hookInput = {
        session_id: testSessionId,
        transcript_path: testTranscriptPath,
        tool_name: 'Bash'
      };

      // Act & Assert
      expect(() => {
        execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);
      }).not.toThrow();
    });
  });

  describe('when receiving invalid hook input', () => {
    it('should handle missing session_id gracefully', () => {
      // Arrange
      const hookInput = {
        transcript_path: testTranscriptPath,
        tool_name: 'Read'
      };

      // Act & Assert
      expect(() => {
        execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);
      }).not.toThrow();
      
      // Should not create any directories
      expect(existsSync(join(conversationsDir, 'undefined'))).toBe(false);
    });

    it('should handle missing transcript_path gracefully', () => {
      // Arrange
      const hookInput = {
        session_id: testSessionId,
        tool_name: 'Read'
      };

      // Act & Assert
      expect(() => {
        execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);
      }).not.toThrow();
      
      // Should not create session file without transcript path
      const sessionFile = join(conversationsDir, testSessionId, 'conversation.json');
      expect(existsSync(sessionFile)).toBe(false);
    });

    it('should handle malformed JSON input', () => {
      // Act & Assert
      expect(() => {
        execSync(`tsx ${hookPath} 'not-valid-json'`);
      }).not.toThrow();
    });

    it('should handle missing input entirely', () => {
      // Act & Assert
      expect(() => {
        execSync(`tsx ${hookPath}`);
      }).not.toThrow();
    });
  });

  describe('console output', () => {
    it('should log success message when capturing', () => {
      // Arrange
      const hookInput = {
        session_id: testSessionId,
        transcript_path: testTranscriptPath,
        tool_name: 'Read'
      };

      // Act
      const result = execSync(
        `tsx ${hookPath} '${JSON.stringify(hookInput)}' 2>&1`,
        { encoding: 'utf8' }
      );

      // Assert
      expect(result).toContain(`✓ Session data captured: ${testSessionId}`);
    });

    it('should log already captured message on subsequent calls', () => {
      // Arrange - create session first
      const hookInput = {
        session_id: testSessionId,
        transcript_path: testTranscriptPath,
        tool_name: 'Read'
      };
      execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);

      // Act - second call
      const result = execSync(
        `tsx ${hookPath} '${JSON.stringify(hookInput)}' 2>&1`,
        { encoding: 'utf8' }
      );

      // Assert
      expect(result).toContain(`✓ Session already captured: ${testSessionId}`);
    });
  });
});

// Import after to avoid circular dependency
import { writeFileSync } from 'fs';