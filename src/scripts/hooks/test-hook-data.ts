#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test what data hooks actually receive
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const debugDir = 'tmp/hook-debug';
mkdirSync(debugDir, { recursive: true });

const testData = {
  timestamp: new Date().toISOString(),
  argv: process.argv,
  env: Object.entries(process.env)
    .filter(([key]) => key.includes('CLAUDE'))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
  stdin_attempt: 'trying to read...'
};

// Try multiple ways to get input
let stdinData = '';
try {
  const fs = require('fs');
  stdinData = fs.readFileSync(0, 'utf-8');
  testData.stdin_attempt = 'success';
} catch (error) {
  testData.stdin_attempt = `error: ${error}`;
}

const finalData = {
  ...testData,
  stdinData,
  stdinLength: stdinData.length
};

const debugFile = join(debugDir, `${timestamp}-test-data.json`);
writeFileSync(debugFile, JSON.stringify(finalData, null, 2));

console.error(`✓ Test data saved: ${debugFile}`);
console.error(`Environment vars: ${Object.keys(finalData.env).length}`);
console.error(`Stdin length: ${stdinData.length}`);

process.exit(0);