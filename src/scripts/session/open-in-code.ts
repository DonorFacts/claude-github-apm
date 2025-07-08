#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { hostBridge } from '../../integrations/docker/host-bridge/container';

// This script opens the current session transcript in VS Code
// It leverages the session data captured by the PreToolUse hook

interface SessionInfo {
  sessionId: string;
  transcriptPath: string;
  capturedAt: string;
  modifiedTime: number;
}

function getCurrentSession(): SessionInfo | null {
  const conversationsDir = '.claude/conversations';

  if (!existsSync(conversationsDir)) {
    return null;
  }

  // Get all session directories
  const sessions = readdirSync(conversationsDir)
    .filter(dir => {
      const sessionFile = join(conversationsDir, dir, 'conversation.json');
      return existsSync(sessionFile);
    })
    .map(dir => {
      const sessionFile = join(conversationsDir, dir, 'conversation.json');
      const stats = statSync(sessionFile);
      
      try {
        const data = JSON.parse(readFileSync(sessionFile, 'utf8'));
        return {
          sessionId: data.sessionId,
          transcriptPath: data.transcriptPath,
          capturedAt: data.capturedAt,
          modifiedTime: stats.mtime.getTime()
        };
      } catch (error) {
        console.error(`Warning: Invalid JSON in ${sessionFile}, skipping`);
        return null;
      }
    })
    .filter(session => session !== null)
    .sort((a, b) => b.modifiedTime - a.modifiedTime);

  return sessions.length > 0 ? sessions[0] : null;
}

async function openTranscriptInCode(transcriptPath: string): Promise<void> {
  try {
    // Convert container path to host path format
    // Container: /home/user/.claude/projects/-workspace-main/session-id.jsonl  
    // Host: /Users/{username}/.claude/projects/-workspace-main/session-id.jsonl
    
    // First try ~/.claude/ format (should work with tilde expansion)
    let hostPath = transcriptPath.replace('/home/user/.claude/', '~/.claude/');
    
    console.log(`Opening transcript in VS Code via host-bridge: ${hostPath}`);
    
    let success = await hostBridge.vscode_open(hostPath);
    
    if (!success) {
      // Fallback to absolute path format for macOS/Unix
      // Extract just the relative path after .claude/
      const relativePath = transcriptPath.split('/.claude/')[1];
      if (relativePath) {
        // For macOS, use /Users/{username} format - we need to determine username
        // Since you confirmed the path is /Users/jakedetels/.claude/...
        // Let's try a few common approaches
        
        const possiblePaths = [
          `/Users/jakedetels/.claude/${relativePath}`, // Your specific case
          // Could add more patterns here if needed
        ];
        
        for (const testPath of possiblePaths) {
          console.log(`Retrying with absolute path: ${testPath}`);
          success = await hostBridge.vscode_open(testPath);
          if (success) {
            hostPath = testPath;
            break;
          }
        }
      }
    }
    
    if (success) {
      console.log('✅ Transcript opened in VS Code on host');
    } else {
      console.log('❌ Failed to open VS Code via host-bridge');
      console.log('');
      console.log('💡 Troubleshooting options:');
      console.log('1. Check if host-bridge daemon is running:');
      console.log('   tsx src/integrations/docker/host-bridge/host/daemon.ts');
      console.log('');
      console.log('2. Manual alternatives:');
      console.log(`   code "${transcriptPath}"`);
      console.log(`   cat "${transcriptPath}"`);
    }
  } catch (error) {
    console.error('Error with host-bridge VS Code integration:', error);
    console.log('');
    console.log('💡 Alternative options:');
    console.log('1. Copy the transcript path and open it on your host machine:');
    console.log(`   code "${transcriptPath}"`);
    console.log('');
    console.log('2. View the transcript content directly:');
    console.log(`   cat "${transcriptPath}"`);
    console.log('');
    console.log('3. Open with default editor:');
    console.log(`   nano "${transcriptPath}"`);
    console.log('');
    console.log('4. Copy to host and open:');
    console.log(`   cp "${transcriptPath}" /workspace/main/tmp/current-session.jsonl`);
    console.log('   # Then open tmp/current-session.jsonl from your host');
  }
}

async function main(): Promise<void> {
  const currentSession = getCurrentSession();
  
  if (!currentSession) {
    console.log('No session data found. Session transcript path will be captured on the next tool use.');
    console.log('Try running any Claude Code command first to capture the session info.');
    return;
  }

  console.log(`Current Session ID: ${currentSession.sessionId}`);
  console.log(`Transcript Path: ${currentSession.transcriptPath}`);
  console.log(`Captured: ${currentSession.capturedAt}`);
  console.log('');
  
  // Check if transcript file exists
  if (!existsSync(currentSession.transcriptPath)) {
    console.error(`Transcript file not found: ${currentSession.transcriptPath}`);
    console.error('The file may have been moved or deleted.');
    return;
  }

  await openTranscriptInCode(currentSession.transcriptPath);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to open session transcript:', error);
    process.exit(1);
  });
}