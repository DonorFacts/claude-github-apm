#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';

// Simple debug to see what we get
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
mkdirSync('tmp/debug-simple', { recursive: true });

const debugInfo = {
  timestamp,
  argv: process.argv,
  envHookInput: process.env.CLAUDE_HOOK_INPUT || 'NOT_SET'
};

writeFileSync(`tmp/debug-simple/${timestamp}.json`, JSON.stringify(debugInfo, null, 2));

console.error(`Debug: ${timestamp} - Hook input: ${process.env.CLAUDE_HOOK_INPUT || 'NONE'}`);
process.exit(0);