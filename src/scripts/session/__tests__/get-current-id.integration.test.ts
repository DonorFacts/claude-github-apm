import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('get-current-id integration', () => {
  const scriptPath = join(__dirname, '../get-current-id.ts');
  const conversationsDir = '.claude/conversations';
  
  function findRealClaudeTranscript(): string | null {
    const claudeDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(claudeDir)) return null;
    
    const projects = readdirSync(claudeDir);
    for (const project of projects) {
      const projectDir = join(claudeDir, project);
      const files = readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
      if (files.length > 0) {
        return join(projectDir, files[0]);
      }
    }
    return null;
  }

  beforeEach(() => {
    // Clean up test sessions
    if (existsSync(conversationsDir)) {
      const sessions = readdirSync(conversationsDir);
      sessions.filter(s => s.startsWith('test-integration-')).forEach(session => {
        rmSync(join(conversationsDir, session), { recursive: true });
      });
    }
  });

  afterEach(() => {
    // Clean up test sessions
    if (existsSync(conversationsDir)) {
      const sessions = readdirSync(conversationsDir);
      sessions.filter(s => s.startsWith('test-integration-')).forEach(session => {
        rmSync(join(conversationsDir, session), { recursive: true });
      });
    }
  });

  describe('with real Claude Code session data', () => {
    it('should display session with real transcript path and validate file exists', () => {
      // Arrange - create session with real transcript
      const realTranscriptPath = findRealClaudeTranscript();
      if (!realTranscriptPath) {
        console.log('Skipping test: No real Claude transcript found. Run `claude -p "test"` first.');
        return;
      }
      
      const sessionId = `test-integration-real-${Date.now()}`;
      const sessionData = {
        sessionId,
        transcriptPath: realTranscriptPath,
        capturedAt: new Date().toISOString(),
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
      expect(result).toContain(`Transcript Path: ${realTranscriptPath}`);
      expect(result).toContain(`Captured: ${sessionData.capturedAt}`);
      
      // Most importantly: verify the transcript file actually exists
      expect(existsSync(realTranscriptPath)).toBe(true);
    });

    it('should handle sessions with tilde paths and validate expanded paths exist', () => {
      // Arrange
      const realTranscriptPath = findRealClaudeTranscript();
      if (!realTranscriptPath) {
        console.log('Skipping test: No real Claude transcript found.');
        return;
      }
      
      const tildePath = realTranscriptPath.replace(homedir(), '~');
      const sessionId = `test-integration-tilde-${Date.now()}`;
      const sessionData = {
        sessionId,
        transcriptPath: tildePath,
        capturedAt: new Date().toISOString(),
        firstToolUse: 'Bash'
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
      expect(result).toContain(`Transcript Path: ${tildePath}`);
      
      // Verify the expanded path exists
      const expandedPath = tildePath.replace('~', homedir());
      expect(existsSync(expandedPath)).toBe(true);
    });
  });

  describe('real Claude Code workflow simulation', () => {
    it('should work with captured session from PreToolUse hook', () => {
      // This test simulates the full workflow:
      // 1. PreToolUse hook captures session
      // 2. get-current-id retrieves it
      
      const realTranscriptPath = findRealClaudeTranscript();
      if (!realTranscriptPath) {
        console.log('Skipping test: Run `claude -p "test"` to create a real session first.');
        return;
      }

      // Simulate what the hook would capture
      const sessionId = `integration-${Date.now()}`;
      const captureHookPath = join(__dirname, '../../hooks/capture-session-id.ts');
      
      const hookInput = {
        session_id: sessionId,
        transcript_path: realTranscriptPath,
        tool_name: 'Read',
        tool_input: { file_path: 'test.ts' }
      };

      // Act - simulate hook capture
      execSync(`tsx ${captureHookPath} '${JSON.stringify(hookInput)}'`);
      
      // Act - retrieve session
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain(`Current Session ID: ${sessionId}`);
      expect(result).toContain(`Transcript Path: ${realTranscriptPath}`);
      
      // Verify transcript file exists
      expect(existsSync(realTranscriptPath)).toBe(true);
    });
  });

  describe('real environment validation', () => {
    it('should provide helpful guidance when no real sessions exist', () => {
      // Arrange - ensure no sessions exist
      if (existsSync(conversationsDir)) {
        rmSync(conversationsDir, { recursive: true });
      }

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert
      expect(result).toContain('No session data found');
      expect(result).toContain('Session ID will be captured on first tool use');
    });

    it('should validate that displayed transcript paths actually exist', () => {
      // This test ensures we never display broken transcript paths
      const realTranscriptPath = findRealClaudeTranscript();
      if (!realTranscriptPath) {
        console.log('Skipping: No real transcript available');
        return;
      }

      // Create session with real path
      const sessionId = `test-integration-validation-${Date.now()}`;
      const sessionData = {
        sessionId,
        transcriptPath: realTranscriptPath,
        capturedAt: new Date().toISOString()
      };
      
      const sessionDir = join(conversationsDir, sessionId);
      mkdirSync(sessionDir, { recursive: true });
      writeFileSync(
        join(sessionDir, 'conversation.json'),
        JSON.stringify(sessionData, null, 2)
      );

      // Act
      const result = execSync(`tsx ${scriptPath}`, { encoding: 'utf8' });

      // Assert - extract the transcript path from output
      const lines = result.split('\n');
      const transcriptLine = lines.find(line => line.includes('Transcript Path:'));
      expect(transcriptLine).toBeDefined();
      
      const displayedPath = transcriptLine!.split('Transcript Path: ')[1];
      expect(displayedPath).toBe(realTranscriptPath);
      
      // Most important: the displayed path must exist
      expect(existsSync(displayedPath)).toBe(true);
    });
  });
});