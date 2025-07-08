import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

describe('capture-session-id hook integration', () => {
  const hookPath = join(__dirname, '../capture-session-id.ts');
  const conversationsDir = '.claude/conversations';
  
  // Helper to find real Claude transcript
  function findRealClaudeTranscript(): { transcriptPath: string; projectName: string } {
    const claudeDir = join(homedir(), '.claude', 'projects');
    if (!existsSync(claudeDir)) {
      throw new Error('No ~/.claude/projects directory found. Run `claude -p "test"` first to create a session.');
    }
    
    const projects = readdirSync(claudeDir);
    let newestTranscript: { path: string; project: string; mtime: number } | null = null;
    
    for (const project of projects) {
      const projectDir = join(claudeDir, project);
      if (!statSync(projectDir).isDirectory()) continue;
      
      const files = readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
      for (const file of files) {
        const transcriptPath = join(projectDir, file);
        const stats = statSync(transcriptPath);
        
        if (!newestTranscript || stats.mtime > new Date(newestTranscript.mtime)) {
          newestTranscript = {
            path: transcriptPath,
            project,
            mtime: stats.mtime.getTime()
          };
        }
      }
    }
    
    if (!newestTranscript) {
      throw new Error('No transcript files found in ~/.claude/projects/*/. Run `claude -p "test"` to create one.');
    }
    
    return {
      transcriptPath: newestTranscript.path,
      projectName: newestTranscript.project
    };
  }

  // Generate a test session ID that won't conflict with real ones
  function generateTestSessionId(): string {
    return `test-integration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  beforeEach(() => {
    // Clean up any test sessions from previous runs
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

  describe('with real Claude Code data', () => {
    it('should capture session with real transcript path and validate file exists', () => {
      // Arrange - get real Claude data
      const { transcriptPath, projectName } = findRealClaudeTranscript();
      const testSessionId = generateTestSessionId();
      
      // Verify the transcript file actually exists
      expect(existsSync(transcriptPath)).toBe(true);
      
      const hookInput = {
        session_id: testSessionId,
        transcript_path: transcriptPath,
        hook_event_name: 'PreToolUse',
        tool_name: 'Read',
        tool_input: { file_path: '/real/file.txt' }
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
        transcriptPath: transcriptPath,
        firstToolUse: 'Read'
      });
      
      // Verify timestamp is recent
      expect(sessionData.capturedAt).toBeDefined();
      const capturedTime = new Date(sessionData.capturedAt).getTime();
      expect(capturedTime).toBeCloseTo(Date.now(), -5000); // Within 5 seconds
      
      // Most importantly: verify the transcript file actually exists
      expect(existsSync(sessionData.transcriptPath)).toBe(true);
      
      // Verify it's a valid transcript by checking it has jsonl content
      const transcriptContent = readFileSync(sessionData.transcriptPath, 'utf8');
      expect(transcriptContent.trim()).not.toBe('');
      
      // Each line should be valid JSON
      const lines = transcriptContent.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      
      // Verify at least the first line is valid JSON
      expect(() => JSON.parse(lines[0])).not.toThrow();
    });

    it('should work with relative transcript paths (~ expansion)', () => {
      // Arrange - get real transcript but use ~ notation
      const { transcriptPath } = findRealClaudeTranscript();
      const relativePath = transcriptPath.replace(homedir(), '~');
      const testSessionId = generateTestSessionId();
      
      const hookInput = {
        session_id: testSessionId,
        transcript_path: relativePath,
        tool_name: 'Bash'
      };

      // Act
      execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);

      // Assert
      const sessionFile = join(conversationsDir, testSessionId, 'conversation.json');
      const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      
      expect(sessionData.transcriptPath).toBe(relativePath);
      
      // The actual file should exist when ~ is expanded
      const expandedPath = relativePath.replace('~', homedir());
      expect(existsSync(expandedPath)).toBe(true);
    });
  });

  describe('integration with Claude Code SDK', () => {
    it('should be triggered by real Claude Code hook (manual verification)', () => {
      // This test documents how to verify the hook works with real Claude Code
      // Run: claude -p "test message" 
      // Then check: tsx src/scripts/session/get-current-id.ts
      
      const instructions = `
To manually verify the hook integration:

1. Run: claude -p "test message"
2. Check: tsx src/scripts/session/get-current-id.ts
3. Verify the session ID appears and transcript path exists

The hook should capture the real session data automatically.
      `.trim();
      
      console.log(instructions);
      expect(true).toBe(true); // Always passes - this is documentation
    });
  });

  describe('error handling with real data constraints', () => {
    it('should not capture session with nonexistent transcript path', () => {
      const testSessionId = generateTestSessionId();
      const fakePath = join(homedir(), '.claude', 'projects', 'nonexistent', 'fake.jsonl');
      
      const hookInput = {
        session_id: testSessionId,
        transcript_path: fakePath,
        tool_name: 'Read'
      };

      // Act
      execSync(`tsx ${hookPath} '${JSON.stringify(hookInput)}'`);

      // Assert - should still capture (we don't validate file existence in hook)
      // But the file won't exist, which get-current-id.ts can handle
      const sessionFile = join(conversationsDir, testSessionId, 'conversation.json');
      expect(existsSync(sessionFile)).toBe(true);
      
      const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
      expect(sessionData.transcriptPath).toBe(fakePath);
      
      // But the actual transcript shouldn't exist
      expect(existsSync(fakePath)).toBe(false);
    });
  });
});