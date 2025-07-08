#!/usr/bin/env tsx

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookResponse {
  continue: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

interface ValidationMappings {
  validationMappings: Record<string, string>;
}

// This runs as a Stop/SubagentStop hook
// It checks for recent artifacts that indicate a prompt was followed

async function main(): Promise<void> {
  try {
    // Load validation mappings
    const configPath = join(__dirname, 'validation-mappings.json');
    if (!existsSync(configPath)) {
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    const config: ValidationMappings = JSON.parse(readFileSync(configPath, 'utf8'));
    const recentThreshold = Date.now() - 60000; // 60 seconds
    
    // Check for recent artifacts that indicate specific prompts were executed
    const validationsToRun: string[] = [];
    
    // Check for joke artifacts
    if (config.validationMappings['joke']) {
      const jokesDir = 'tmp/jokes';
      if (existsSync(jokesDir)) {
        const files = readdirSync(jokesDir);
        const recentJokes = files.filter(f => {
          const stats = statSync(join(jokesDir, f));
          return stats.mtimeMs > recentThreshold;
        });
        
        if (recentJokes.length > 0) {
          console.error(`🔍 Found recent joke file: ${recentJokes[0]}`);
          validationsToRun.push(config.validationMappings['joke']);
        }
      }
    }
    
    // Check for git worktree artifacts
    if (config.validationMappings['git/worktrees/create']) {
      const worktreesDir = '.git/worktrees';
      if (existsSync(worktreesDir)) {
        const dirs = readdirSync(worktreesDir);
        const recentWorktrees = dirs.filter(d => {
          const stats = statSync(join(worktreesDir, d));
          return stats.mtimeMs > recentThreshold;
        });
        
        if (recentWorktrees.length > 0) {
          console.error(`🔍 Found recent worktree: ${recentWorktrees[0]}`);
          validationsToRun.push(config.validationMappings['git/worktrees/create']);
        }
      }
    }
    
    // Run any detected validations
    if (validationsToRun.length > 0) {
      let allPassed = true;
      const failedValidations: string[] = [];
      
      for (const validationScript of validationsToRun) {
        console.error(`\n🔍 Running validation: ${validationScript}`);
        
        try {
          execSync(`cd /workspace/main && tsx ${validationScript}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          console.error('✅ Validation passed!');
        } catch (error) {
          allPassed = false;
          failedValidations.push(validationScript);
          
          const errorOutput = error instanceof Error && 'stdout' in error ? 
            (error as any).stdout : 'Unknown validation error';
          
          console.error('❌ Validation failed!');
          console.error('');
          console.error(errorOutput);
          console.error('');
        }
      }
      
      if (!allPassed) {
        console.error('💡 Please address the issues above before continuing.');
        
        const response: HookResponse = {
          continue: false,
          stopReason: `Validation failed. Please review and fix the issues above.`,
          suppressOutput: true
        };
        console.log(JSON.stringify(response));
        process.exit(2);
      }
    }
    
    // All good - allow continuation
    const response: HookResponse = {
      continue: true,
      suppressOutput: true
    };
    console.log(JSON.stringify(response));
    process.exit(0);
    
  } catch (error) {
    // If there's an error in the hook itself, don't block the agent
    console.error('Hook execution error:', error);
    
    const response: HookResponse = {
      continue: true
    };
    console.log(JSON.stringify(response));
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(() => {
    const response: HookResponse = {
      continue: true
    };
    console.log(JSON.stringify(response));
    process.exit(0);
  });
}