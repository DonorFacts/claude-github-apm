#!/usr/bin/env tsx

/**
 * Test Script: Demonstrates the VS Code + Claude integration for git worktrees
 * 
 * This script shows how we:
 * 1. Create a new feature branch
 * 2. Create a git worktree for that branch
 * 3. Open VS Code in the worktree with Claude auto-launching
 */

import { execSync } from 'child_process';

console.log('🧪 Testing VS Code + Claude Worktree Integration\n');

// Step 1: Check current state
console.log('📍 Step 1: Checking current git state...');
const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
console.log(`   Current branch: ${currentBranch}`);

// Step 2: List existing worktrees
console.log('\n📂 Step 2: Existing worktrees:');
const worktrees = execSync('git worktree list', { encoding: 'utf-8' });
console.log(worktrees);

// Step 3: Show what we created earlier
console.log('✅ Step 3: What we already did:');
console.log('   1. Created branch: feature-draft-git-worktree-docs');
console.log('   2. Created worktree at: ../worktrees/feature-draft-git-worktree-docs');
console.log('   3. Created tasks.json in that worktree');

// Step 4: Show the VS Code task configuration
console.log('\n📋 Step 4: VS Code tasks.json content:');
console.log('   Location: ../worktrees/feature-draft-git-worktree-docs/.vscode/tasks.json');
console.log('   Key configuration:');
console.log('   - Auto-runs on folder open: "runOn": "folderOpen"');
console.log('   - Opens new terminal panel: "panel": "new"');
console.log('   - Focuses the terminal: "focus": true');

// Step 5: Explain the automation
console.log('\n🤖 Step 5: How the automation works:');
console.log('   When we run: tsx open-worktree-vscode.ts "../worktrees/feature-draft-git-worktree-docs"');
console.log('   It does the following:');
console.log('   a) Creates .vscode/ directory in the worktree (if needed)');
console.log('   b) Copies or creates tasks.json with Claude auto-launch config');
console.log('   c) Opens VS Code using platform-specific command:');
console.log('      - macOS: open -a "Visual Studio Code" <path>');
console.log('      - Windows: start Code.exe <path>');
console.log('      - Linux: code <path>');
console.log('   d) VS Code reads tasks.json and auto-runs the Claude task');
console.log('   e) Claude launches in a new terminal panel automatically!');

// Step 6: Manual verification steps
console.log('\n🔍 Step 6: To verify it worked:');
console.log('   1. Check if VS Code opened (you should see it)');
console.log('   2. Look for a terminal panel at the bottom');
console.log('   3. Claude should be running in that terminal');
console.log('   4. If not, manually run: Cmd+Shift+P → "Tasks: Run Task" → "Claude"');

// Step 7: The complete workflow
console.log('\n📚 Step 7: Complete workflow for future use:');
console.log(`
# 1. Create feature branch and worktree
git checkout -b feature-123-new-feature
git add .
git commit -m "wip: starting new feature"
git checkout main
git worktree add "../worktrees/feature-123-new-feature" "feature-123-new-feature"

# 2. Open VS Code with Claude
tsx open-worktree-vscode.ts "../worktrees/feature-123-new-feature"

# VS Code opens → tasks.json runs → Claude launches automatically!
`);

console.log('✅ Test explanation complete!');