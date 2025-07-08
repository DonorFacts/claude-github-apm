#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

interface HookResponse {
  continue: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
}

interface HookInput {
  session_id: string;
  transcript_path: string;
}

interface TranscriptEntry {
  ts: string;
  evt: string;
  content?: any;
}

interface ToolCallContent {
  role: string;
  type: string;
  tool_use?: {
    name: string;
    input: any;
  };
}

interface ValidationMappings {
  validationMappings: Record<string, string>;
}

async function main(): Promise<void> {
  try {
    // Get hook input from stdin
    const input = process.argv[2] || '';
    let hookInput: HookInput | null = null;
    
    try {
      hookInput = JSON.parse(input);
    } catch {
      // If no input provided, allow continuation
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    if (!hookInput?.transcript_path) {
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
    const transcriptPath = hookInput.transcript_path.replace('~', process.env.HOME || '');
    if (!existsSync(transcriptPath)) {
      console.error(`Transcript not found: ${transcriptPath}`);
      const response: HookResponse = { continue: true };
      console.log(JSON.stringify(response));
      process.exit(0);
    }
    
    // Read last 100 lines of transcript to find recent Read operations
    const transcriptContent = readFileSync(transcriptPath, 'utf8');
    const lines = transcriptContent.trim().split('\n');
    const recentLines = lines.slice(-100); // Last 100 entries
    
    const readOperations: string[] = [];
    
    for (const line of recentLines) {
      try {
        const entry: TranscriptEntry = JSON.parse(line);
        
        if (entry.evt === 'claude_message' && entry.content) {
          const content = entry.content as ToolCallContent;
          
          if (content.tool_use?.name === 'Read') {
            const filePath = content.tool_use.input.file_path;
            if (filePath) {
              readOperations.push(filePath);
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
          console.error(`🔍 Found Read operation for: ${readPath}`);
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