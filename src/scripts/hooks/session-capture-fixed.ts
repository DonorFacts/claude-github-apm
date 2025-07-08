#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Based on proven working Python example from claude-code-hooks-mastery
// Key insight: Use process.stdin properly, not readFileSync(0)

interface HookInput {
  session_id?: string;
  transcript_path?: string;
  tool_name?: string;
  tool_input?: any;
  timestamp?: string;
}

interface SessionData {
  sessionId: string;
  transcriptPath: string;
  capturedAt: string;
  firstToolUse?: string;
}

function captureSessionData(hookInput: HookInput): void {
  const { session_id: sessionId, transcript_path: transcriptPath, tool_name: toolName } = hookInput;
  
  if (!sessionId || !transcriptPath) {
    console.error('Missing session_id or transcript_path, skipping capture');
    return;
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
    capturedAt: hookInput.timestamp || new Date().toISOString(),
    firstToolUse: toolName,
  };

  // Save to file
  writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  console.error(`✓ Session data captured: ${sessionId}`);

  // Log the hook input for debugging
  const debugDir = 'tmp/hook-debug';
  mkdirSync(debugDir, { recursive: true });
  writeFileSync(join(debugDir, 'session-capture-log.json'), JSON.stringify(hookInput, null, 2));
}

// Main execution - read from stdin using Node.js streams (like Python's json.load(sys.stdin))
async function main() {
  try {
    let inputData = '';
    
    // Use the proper way to read stdin in Node.js
    process.stdin.setEncoding('utf8');
    
    for await (const chunk of process.stdin) {
      inputData += chunk;
    }
    
    if (!inputData.trim()) {
      console.error('No input data received from stdin');
      process.exit(0);
    }

    const hookInput: HookInput = JSON.parse(inputData);
    
    // Debug: log all input data
    const debugDir = 'tmp/hook-debug';
    mkdirSync(debugDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(join(debugDir, `${timestamp}-input.json`), JSON.stringify({
      hookInput,
      inputData,
      env: Object.entries(process.env)
        .filter(([key]) => key.includes('CLAUDE'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    }, null, 2));

    captureSessionData(hookInput);
    
  } catch (error) {
    console.error('Hook execution error:', error);
    // Log error for debugging
    const debugDir = 'tmp/hook-debug';
    mkdirSync(debugDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(join(debugDir, `${timestamp}-error.json`), JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, null, 2));
  }
  
  // Always exit 0 to approve tool use
  process.exit(0);
}

main();