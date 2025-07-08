#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'fs';

// This script runs as a PostToolUse hook after Read operations
// It simply logs what was read to a file

const timestamp = new Date().toISOString();
const readLogFile = 'tmp/recent-reads.txt';

// Ensure tmp directory exists
mkdirSync('tmp', { recursive: true });

// Get any available info about what was read
const toolResult = process.env.CLAUDE_TOOL_RESULT || '';
const toolName = process.env.CLAUDE_TOOL_NAME || '';

// For now, we'll append a timestamp marker
// The Stop hook will check if validation files exist that match the timestamp window
const entry = `${timestamp}|${toolName}|${toolResult}\n`;

if (existsSync(readLogFile)) {
  appendFileSync(readLogFile, entry);
} else {
  writeFileSync(readLogFile, entry);
}

console.log(`📝 Tracked read operation at ${timestamp}`);