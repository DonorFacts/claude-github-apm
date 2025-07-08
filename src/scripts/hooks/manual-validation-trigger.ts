#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface QueuedValidation {
  timestamp: string;
  matchedPath: string;
  validationScript: string;
  agentType: 'main' | 'sub';
}

const promptFile = process.argv[2];
if (!promptFile) {
  console.error('Usage: tsx manual-validation-trigger.ts <prompt-file>');
  console.error('Example: tsx manual-validation-trigger.ts src/prompts/joke.md');
  process.exit(1);
}

// Map common prompt files to their validation scripts
const validationMap: Record<string, string> = {
  'src/prompts/joke.md': 'src/scripts/jokes/validate-joke.ts',
  '.claude/commands/joke.md': 'src/scripts/jokes/validate-joke.ts',
  '-/joke.md': 'src/scripts/jokes/validate-joke.ts',
  'src/prompts/git/worktrees/create.md': 'src/scripts/git-worktree/validate-worktree.ts',
  '.claude/commands/git-worktree-create.md': 'src/scripts/git-worktree/validate-worktree.ts',
  '-/git-worktree-create.md': 'src/scripts/git-worktree/validate-worktree.ts'
};

const validationScript = validationMap[promptFile];
if (!validationScript) {
  console.error(`No validation mapping found for: ${promptFile}`);
  console.error('Known mappings:', Object.keys(validationMap).join(', '));
  process.exit(1);
}

// Queue the validation
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
const queueDir = 'tmp/validation/queue';
mkdirSync(queueDir, { recursive: true });

const queuedValidation: QueuedValidation = {
  timestamp: new Date().toISOString(),
  matchedPath: promptFile,
  validationScript,
  agentType: 'main'
};

const promptKey = promptFile.replace(/^(src\/prompts\/|\.claude\/commands\/|-\/)/, '').replace(/\.md$/, '');
const queueFile = join(queueDir, `${timestamp}-${promptKey.replace(/\//g, '-')}-manual.json`);

writeFileSync(queueFile, JSON.stringify(queuedValidation, null, 2));

console.log(`📋 Manually queued validation: ${validationScript}`);
console.log(`📁 Queue file: ${queueFile}`);
console.log(`\nRun the following to execute validation:`);
console.log(`tsx src/scripts/hooks/run-pending-validations.ts`);