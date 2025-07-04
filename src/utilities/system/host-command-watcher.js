#!/usr/bin/env node

/**
 * Host-compatible command watcher
 * Compiles TypeScript and runs the watcher without requiring tsx
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if we're in the right directory
const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Must be run from project root directory');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(projectRoot, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.error('❌ node_modules not found. Run pnpm install first.');
  process.exit(1);
}

// Try to find tsx in node_modules
const tsxPath = path.join(nodeModulesPath, '.bin', 'tsx');
if (!fs.existsSync(tsxPath)) {
  console.error('❌ tsx not found in node_modules. Run pnpm install first.');
  process.exit(1);
}

console.log('🚀 Starting command watcher...');
console.log(`📍 Using tsx: ${tsxPath}`);
console.log(`📂 Working directory: ${projectRoot}`);

// Add error handling for spawn
const child = spawn(tsxPath, ['src/utilities/command-processing/index.ts', '--watch'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  cwd: projectRoot
});

// Log stdout and stderr to help debug
child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('error', (error) => {
  console.error('❌ Failed to start command watcher:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping command watcher...');
  child.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});

child.on('exit', (code) => {
  console.log(`Command watcher exited with code ${code}`);
  process.exit(code);
});