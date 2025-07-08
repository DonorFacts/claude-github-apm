#!/usr/bin/env tsx
/**
 * Shell configuration setup for Docker container
 * Sets up shell configuration that works for any user
 */

import { execSync } from 'child_process';
import { appendFileSync } from 'fs';

console.log('🔧 Setting up shell configuration...');

try {
  // Add shell configuration to /etc/bash.bashrc
  const bashConfig = [
    'export HISTSIZE=100000',
    'export PATH="/workspace/.local/bin:/workspace/node_modules/.bin:$PATH"',
    'alias python=python3',
    'alias pip=pip3',
    'alias e="pnpm tsx"',
    'alias pn=pnpm',
    'eval "$(direnv hook bash)"',
  ];

  for (const config of bashConfig) {
    appendFileSync('/etc/bash.bashrc', config + '\n');
  }

  console.log('✅ Shell configuration completed');
} catch (error) {
  console.error('❌ Shell configuration failed:', error);
  process.exit(1);
}