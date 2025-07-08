#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { HookInput, SessionData } from '../session/types';

// This script runs as a PreToolUse hook to capture session ID and transcript path
// It saves this data for the /session-id command to retrieve

function parseHookInput(input: string): HookInput | null {
  try {
    return JSON.parse(input);
  } catch (error) {
    console.error('Failed to parse hook input:', error);
    return null;
  }
}

function captureSessionData(hookInput: HookInput): void {
  const { session_id: sessionId, transcript_path: transcriptPath, tool_name: toolName } = hookInput;
  
  if (!sessionId || !transcriptPath) {
    return; // Skip if essential data is missing
  }

  const conversationsDir = '.claude/conversations';
  const sessionDir = join(conversationsDir, sessionId);
  const sessionFile = join(sessionDir, 'conversation.json');

  // Create directory structure
  mkdirSync(sessionDir, { recursive: true });

  // Check if already captured
  if (existsSync(sessionFile)) {
    console.error(`✓ Session already captured: ${sessionId}`);
    return;
  }

  // Create session data
  const sessionData: SessionData = {
    sessionId,
    transcriptPath,
    capturedAt: new Date().toISOString(),
    firstToolUse: toolName,
  };

  // Save to file
  writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  console.error(`✓ Session data captured: ${sessionId}`);
}

// Main execution - read from stdin for hooks
let input = '';
try {
  const fs = require('fs');
  input = fs.readFileSync(0, 'utf-8');
} catch (error) {
  console.error('Failed to read stdin:', error);
}

const hookInput = parseHookInput(input);

if (hookInput) {
  captureSessionData(hookInput);
}

// Always approve the tool use
process.exit(0);