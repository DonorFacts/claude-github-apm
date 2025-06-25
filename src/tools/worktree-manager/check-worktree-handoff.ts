#!/usr/bin/env tsx

/**
 * CLI tool to check if work should be redirected to a worktree
 * Usage: tsx check-worktree-handoff.ts "<user request>"
 * 
 * Pass the ACTUAL user message/request as the argument.
 * The tool analyzes the request to determine intent.
 * 
 * Examples:
 *   tsx check-worktree-handoff.ts "Can you add tests to the auth module?"
 *   tsx check-worktree-handoff.ts "I need to fix a different bug"
 * 
 * Exit codes:
 * 0 - Continue in current window
 * 1 - Redirect to worktree (prints path to stdout)
 * 2 - Ask user about creating new worktree
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { determineHandoffAction, WorktreeInfo } from './handoff-protocol';

function getExistingWorktrees(): WorktreeInfo[] {
  const worktreesDir = '../worktrees';
  
  if (!existsSync(worktreesDir)) {
    return [];
  }

  try {
    const entries = readdirSync(worktreesDir);
    return entries
      .filter(entry => {
        const fullPath = join(worktreesDir, entry);
        return statSync(fullPath).isDirectory();
      })
      .map(dir => {
        const fullPath = join(worktreesDir, dir);
        const stat = statSync(fullPath);
        return {
          path: fullPath,
          branch: dir, // Directory name usually matches branch
          createdAt: stat.birthtime
        };
      });
  } catch (error) {
    console.error('Error reading worktrees:', error);
    return [];
  }
}

function main() {
  const userRequest = process.argv[2] || '';
  
  if (!userRequest) {
    console.error('Usage: tsx check-worktree-handoff.ts "<user request>"');
    process.exit(0); // Default to continuing in current window
  }

  const worktrees = getExistingWorktrees();
  const decision = determineHandoffAction(worktrees, userRequest);

  switch (decision.action) {
    case 'continue-here':
      // Exit 0 - continue in current window
      process.exit(0);
      
    case 'redirect':
      // Exit 1 - redirect to worktree
      console.log(decision.targetWorktree);
      process.exit(1);
      
    case 'create-new':
      // Exit 2 - ask about creating new worktree
      process.exit(2);
  }
}

if (require.main === module) {
  main();
}