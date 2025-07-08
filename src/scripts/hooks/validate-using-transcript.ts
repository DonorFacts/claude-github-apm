#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookResponse {
  continue: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

interface TranscriptEntry {
  ts: string;
  evt: string;
  content?: any;
}

interface ToolCallContent {
  role: string;
  type: string;
  tool_uses?: Array<{
    name: string;
    input: any;
  }>;
}

interface ValidationMappings {
  validationMappings: Record<string, string>;
}

async function main(): Promise<void> {
  try {
    // Read hook input from stdin
    let hookInput: any = {};
    try {
      const { readFileSync } = require('fs');
      const stdinData = readFileSync(0, 'utf-8'); // fd 0 is stdin
      hookInput = JSON.parse(stdinData);
    } catch (error) {
      // No hook input available, allow continuation
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    // Get transcript path from hook input
    const transcriptPath = hookInput.transcript_path;
    
    if (!transcriptPath) {
      // No transcript path available, allow continuation
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    // Load validation mappings
    const configPath = join(__dirname, 'validation-mappings.json');
    if (!existsSync(configPath)) {
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    const config: ValidationMappings = JSON.parse(readFileSync(configPath, 'utf8'));
    
    // Read the transcript file
    const resolvedPath = transcriptPath.replace('~', process.env.HOME || '');
    if (!existsSync(resolvedPath)) {
      console.error(`Transcript not found: ${resolvedPath}`);
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    // Read last 200 lines of transcript to find recent Read operations
    const transcriptContent = readFileSync(resolvedPath, 'utf8');
    const lines = transcriptContent.trim().split('\n');
    const recentLines = lines.slice(-200); // Last 200 entries
    
    const readOperations: string[] = [];
    
    for (const line of recentLines) {
      try {
        const entry: TranscriptEntry = JSON.parse(line);
        
        // Look for Claude messages with tool uses
        if (entry.evt === 'claude_message' && entry.content?.tool_uses) {
          const content = entry.content as ToolCallContent;
          
          for (const toolUse of content.tool_uses || []) {
            if (toolUse.name === 'Read' && toolUse.input?.file_path) {
              readOperations.push(toolUse.input.file_path);
              console.error(`📖 Found Read operation: ${toolUse.input.file_path}`);
            }
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
    
    // Check if any read operations match our validation mappings
    const validationsToRun: Set<string> = new Set();
    
    for (const readPath of readOperations) {
      for (const [promptKey, validationScript] of Object.entries(config.validationMappings)) {
        const commandsName = promptKey.replace(/\//g, '-');
        const possiblePaths = [
          `src/prompts/${promptKey}.md`,
          `.claude/commands/${commandsName}.md`,
          `-/${commandsName}.md`
        ];
        
        if (possiblePaths.some(path => readPath.includes(path))) {
          validationsToRun.add(validationScript);
          console.error(`✅ Matched validation for: ${promptKey}`);
        }
      }
    }
    
    // Run validations
    if (validationsToRun.size > 0) {
      let allPassed = true;
      const failedValidations: string[] = [];
      
      for (const validationScript of validationsToRun) {
        console.error(`\n🔍 Running validation: ${validationScript}`);
        
        try {
          const output = execSync(`cd /workspace/main && tsx ${validationScript}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          console.error('✅ Validation passed!');
          console.error(output);
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
      
      console.error('\n🎉 All validations passed!');
    } else {
      console.error('ℹ️ No validations needed for this session.');
    }
    
    // All good - allow continuation
    const response: HookResponse = {
      continue: true,
      suppressOutput: validationsToRun.size > 0
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