#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Debug script to log hook input

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const debugDir = 'tmp/hook-debug';
mkdirSync(debugDir, { recursive: true });

let stdinData = '';
let hookInput: any = null;

try {
  stdinData = readFileSync(0, 'utf-8');
  hookInput = JSON.parse(stdinData);
} catch (error) {
  const errorInfo = {
    error: error instanceof Error ? error.message : 'Unknown error',
    stdinData: stdinData || '[no data]'
  };
  writeFileSync(join(debugDir, `${timestamp}-error.json`), JSON.stringify(errorInfo, null, 2));
}

const debugInfo = {
  timestamp: new Date().toISOString(),
  stdinData,
  parsedInput: hookInput,
  env: {
    CLAUDE_HOOK_INPUT: process.env.CLAUDE_HOOK_INPUT,
    allClaudeVars: Object.entries(process.env)
      .filter(([key]) => key.includes('CLAUDE'))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  }
};

const debugFile = join(debugDir, `${timestamp}-debug.json`);
writeFileSync(debugFile, JSON.stringify(debugInfo, null, 2));

console.error(`✓ Debug info saved to: ${debugFile}`);
if (hookInput) {
  console.error(`Session ID: ${hookInput.session_id}`);
  console.error(`Tool: ${hookInput.tool_name}`);
}

// Always approve
process.exit(0);