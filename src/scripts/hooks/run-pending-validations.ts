#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

interface HookResponse {
  continue: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

interface QueuedValidation {
  timestamp: string;
  matchedPath: string;
  validationScript: string;
  agentType: 'main' | 'sub';
}

async function main(): Promise<void> {
  try {
    // Check queue directory for pending validations
    const queueDir = 'tmp/validation/queue';
    let pendingValidations: { file: string; data: QueuedValidation }[] = [];
    
    if (existsSync(queueDir)) {
      // Find validation files created in the last 60 seconds
      const recentThreshold = Date.now() - 60000; // 60 seconds
      const queueFiles = readdirSync(queueDir).filter(f => f.endsWith('.json'));
      
      for (const file of queueFiles) {
        const filePath = join(queueDir, file);
        const stats = statSync(filePath);
        
        if (stats.mtimeMs > recentThreshold) {
          try {
            const data: QueuedValidation = JSON.parse(readFileSync(filePath, 'utf8'));
            pendingValidations.push({ file: filePath, data });
          } catch {
            // Skip invalid files
          }
        }
      }
    }
    
    // If no pending validations, allow normal completion
    if (pendingValidations.length === 0) {
      const response: HookResponse = {
        continue: true
      };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    // Run all pending validations
    let allPassed = true;
    const failedValidations: string[] = [];
    
    for (const { file, data } of pendingValidations) {
      console.error(`🔍 Running validation: ${data.validationScript}`);
      console.error(`   For: ${data.matchedPath} (${data.agentType} agent)`);
      
      try {
        execSync(`cd /workspace/main && tsx ${data.validationScript}`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        // Validation passed - remove from queue
        try {
          unlinkSync(file);
        } catch {}
        
      } catch (error) {
        allPassed = false;
        failedValidations.push(data.validationScript);
        
        // Show validation output
        const errorOutput = error instanceof Error && 'stdout' in error ? 
          (error as any).stdout : 'Unknown validation error';
        
        console.error('❌ Validation failed!');
        console.error('');
        console.error(errorOutput);
        console.error('');
      }
    }
    
    if (allPassed) {
      console.error('✅ All validations passed!');
      
      const response: HookResponse = {
        continue: true,
        suppressOutput: true
      };
      console.log(JSON.stringify(response));
      process.exit(0);
      
    } else {
      console.error('💡 Once you\'ve addressed these issues, I can continue with the task.');
      
      const response: HookResponse = {
        continue: false,
        stopReason: `Validation failed for: ${failedValidations.join(', ')}. Please review the issues above and remediate them.`,
        suppressOutput: true
      };
      console.log(JSON.stringify(response));
      process.exit(2);
    }
    
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