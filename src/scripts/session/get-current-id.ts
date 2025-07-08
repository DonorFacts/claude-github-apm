#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// This script finds and returns the current session ID
// It looks for the most recently modified session in .claude/conversations/

const conversationsDir = '.claude/conversations';

if (!existsSync(conversationsDir)) {
  console.log('No session data found. Session ID will be captured on first tool use.');
  process.exit(0);
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

if (sessions.length === 0) {
  console.log('No session data found. Session ID will be captured on first tool use.');
} else {
  const currentSession = sessions[0];
  console.log(`Current Session ID: ${currentSession.sessionId}`);
  console.log(`Transcript Path: ${currentSession.transcriptPath}`);
  console.log(`Captured: ${currentSession.capturedAt}`);
}