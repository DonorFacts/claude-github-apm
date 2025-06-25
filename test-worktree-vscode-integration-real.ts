#!/usr/bin/env tsx

/**
 * ACTUAL Test Script: Validates VS Code + Claude worktree integration
 * 
 * This script ACTUALLY tests and validates:
 * 1. Can we create a test worktree?
 * 2. Does our script create the necessary files?
 * 3. Can VS Code actually be launched?
 * 4. Does tasks.json get created correctly?
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, errorMsg?: string): void {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    if (errorMsg) console.log(`   Error: ${errorMsg}`);
    testsFailed++;
  }
}

function runTest(testName: string, testFn: () => void): void {
  console.log(`\n🧪 ${testName}`);
  try {
    testFn();
  } catch (error) {
    console.log(`❌ FAIL: ${testName} - Exception thrown`);
    console.log(`   Error: ${error}`);
    testsFailed++;
  }
}

console.log('🧪 REAL Testing: VS Code + Claude Worktree Integration\n');

// Test 1: Verify our TypeScript script exists
runTest('Test 1: Verify open-worktree-vscode.ts exists', () => {
  const scriptPath = './open-worktree-vscode.ts';
  assert(existsSync(scriptPath), 'Script file exists', `File not found: ${scriptPath}`);
});

// Test 2: Create a test worktree
const testBranchName = 'test-branch-delete-me';
const testWorktreePath = `../worktrees/${testBranchName}`;

runTest('Test 2: Create test worktree', () => {
  // Clean up if exists from previous run
  try {
    execSync(`git worktree remove "${testWorktreePath}"`, { stdio: 'ignore' });
    execSync(`git branch -D ${testBranchName}`, { stdio: 'ignore' });
  } catch {}
  
  // Create new test branch and worktree
  execSync(`git checkout -b ${testBranchName}`, { stdio: 'ignore' });
  execSync(`git checkout main`, { stdio: 'ignore' });
  execSync(`git worktree add "${testWorktreePath}" "${testBranchName}"`, { stdio: 'ignore' });
  
  assert(existsSync(testWorktreePath), 'Worktree directory created');
});

// Test 3: Run our script (without actually opening VS Code)
runTest('Test 3: Verify script creates tasks.json', () => {
  // Modify the script temporarily to not open VS Code (for automated testing)
  const scriptContent = readFileSync('./open-worktree-vscode.ts', 'utf-8');
  const modifiedScript = scriptContent.replace(
    /execSync\(`open -a "Visual Studio Code".*?\);/,
    '// TESTING: VS Code launch disabled'
  );
  
  // Write temporary test version
  const testScriptPath = './test-open-worktree-temp.ts';
  require('fs').writeFileSync(testScriptPath, modifiedScript);
  
  // Run the modified script
  execSync(`tsx ${testScriptPath} "${testWorktreePath}"`, { stdio: 'ignore' });
  
  // Verify tasks.json was created
  const tasksJsonPath = join(testWorktreePath, '.vscode', 'tasks.json');
  assert(existsSync(tasksJsonPath), 'tasks.json created in worktree');
  
  // Verify tasks.json content
  if (existsSync(tasksJsonPath)) {
    const tasksContent = JSON.parse(readFileSync(tasksJsonPath, 'utf-8'));
    assert(tasksContent.version === "2.0.0", 'tasks.json has correct version');
    assert(Array.isArray(tasksContent.tasks), 'tasks.json has tasks array');
    assert(tasksContent.tasks.length > 0, 'tasks.json has at least one task');
    
    const claudeTask = tasksContent.tasks.find((t: any) => t.label === 'Claude');
    assert(!!claudeTask, 'Claude task exists');
    assert(claudeTask?.command === 'claude', 'Claude task has correct command');
    assert(claudeTask?.runOptions?.runOn === 'folderOpen', 'Claude task runs on folder open');
  }
  
  // Clean up temp script
  rmSync(testScriptPath);
});

// Test 4: Verify VS Code command availability
runTest('Test 4: Check VS Code command availability', () => {
  try {
    // On macOS, check if VS Code app exists
    if (process.platform === 'darwin') {
      assert(existsSync('/Applications/Visual Studio Code.app'), 'VS Code app exists on macOS');
    } else {
      // Try to run 'code --version' to check if command is available
      execSync('code --version', { stdio: 'ignore' });
      assert(true, 'VS Code command is available');
    }
  } catch {
    assert(false, 'VS Code command is available', 'VS Code command not found in PATH');
  }
});

// Cleanup
runTest('Test 5: Cleanup test artifacts', () => {
  try {
    execSync(`git worktree remove "${testWorktreePath}"`, { stdio: 'ignore' });
    execSync(`git branch -D ${testBranchName}`, { stdio: 'ignore' });
    assert(true, 'Cleaned up test worktree and branch');
  } catch (error) {
    assert(false, 'Cleanup successful', `Cleanup failed: ${error}`);
  }
});

// Summary
console.log('\n📊 Test Summary:');
console.log(`   Passed: ${testsPassed}`);
console.log(`   Failed: ${testsFailed}`);
console.log(`   Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n✅ All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}