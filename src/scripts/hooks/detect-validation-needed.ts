#!/usr/bin/env tsx

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

interface ValidationMappings {
  validationMappings: Record<string, string>;
}

interface QueuedValidation {
  timestamp: string;
  matchedPath: string;
  validationScript: string;
  agentType: 'main' | 'sub';
}

interface ReadOperation {
  timestamp: string;
  filePath: string;
  toolResult: string;
}

async function main(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
  const logDir = 'tmp/validation/hooks';
  const queueDir = 'tmp/validation/queue';
  const readOpsFile = 'tmp/read-operations.json';
  
  try {
    // Ensure directories exist
    mkdirSync(logDir, { recursive: true });
    mkdirSync(queueDir, { recursive: true });
    
    // Get the tool result from environment (keeping for compatibility)
    const toolResult = process.env.CLAUDE_TOOL_RESULT || '';
    
    // Track this read operation
    if (toolResult) {
      let readOps: ReadOperation[] = [];
      if (existsSync(readOpsFile)) {
        try {
          readOps = JSON.parse(readFileSync(readOpsFile, 'utf8'));
        } catch {}
      }
      
      // Add current read operation
      readOps.push({
        timestamp: new Date().toISOString(),
        filePath: toolResult,
        toolResult: toolResult
      });
      
      // Keep only operations from last 30 seconds
      const cutoff = Date.now() - 30000;
      readOps = readOps.filter(op => new Date(op.timestamp).getTime() > cutoff);
      
      writeFileSync(readOpsFile, JSON.stringify(readOps, null, 2));
    }
    
    const logData = {
      timestamp: new Date().toISOString(),
      toolResult,
      detected: false,
      matchedPath: null as string | null,
      validationScript: null as string | null,
      error: null as string | null
    };
    
    // Load validation mappings
    const configPath = join(__dirname, 'validation-mappings.json');
    if (!existsSync(configPath)) {
      logData.error = 'Config file not found';
      writeFileSync(join(logDir, `${timestamp}-detection.json`), JSON.stringify(logData, null, 2));
      process.exit(0);
    }
    
    const config: ValidationMappings = JSON.parse(readFileSync(configPath, 'utf8'));
    
    // Always check read operations file for any recent reads
    if (existsSync(readOpsFile)) {
      try {
        const readOps: ReadOperation[] = JSON.parse(readFileSync(readOpsFile, 'utf8'));
        
        // Check each read operation
        for (const readOp of readOps) {
          for (const [promptKey, validationScript] of Object.entries(config.validationMappings)) {
            // Generate all possible access patterns for this prompt
            const commandsName = promptKey.replace(/\//g, '-');
            const possiblePaths = [
              `src/prompts/${promptKey}.md`,
              `.claude/commands/${commandsName}.md`,
              `-/${commandsName}.md`
            ];
            
            // Check if any of these paths appear in the read operation
            const matchedPath = possiblePaths.find(path => readOp.filePath.includes(path));
            
            if (matchedPath) {
              logData.detected = true;
              logData.matchedPath = matchedPath;
              logData.validationScript = validationScript;
              
              // Check if validation already queued for this prompt
              const queueFileName = `${promptKey.replace(/\//g, '-')}`;
              const alreadyQueued = existsSync(queueDir) && 
                readdirSync(queueDir)
                  .filter(f => f.includes(queueFileName)).length > 0;
              
              if (!alreadyQueued) {
                // Queue validation
                const queuedValidation: QueuedValidation = {
                  timestamp: new Date().toISOString(),
                  matchedPath,
                  validationScript,
                  agentType: toolResult ? 'main' : 'sub'
                };
                
                const queueFile = join(queueDir, `${timestamp}-${queueFileName}.json`);
                writeFileSync(queueFile, JSON.stringify(queuedValidation, null, 2));
                
                console.log(`🔍 Detected validation needed for: ${matchedPath}`);
                console.log(`📋 Queued validation: ${validationScript}`);
              }
              
              break;
            }
          }
          
          if (logData.detected) break;
        }
      } catch (error) {
        logData.error = `Failed to process read operations: ${error}`;
      }
    }
    
    // Write log
    writeFileSync(join(logDir, `${timestamp}-detection.json`), JSON.stringify(logData, null, 2));
    
  } catch (error) {
    // Log the error but don't interfere with normal operation
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    };
    try {
      mkdirSync(logDir, { recursive: true });
      writeFileSync(join(logDir, `${timestamp}-error.json`), JSON.stringify(errorLog, null, 2));
    } catch {}
  }
  
  process.exit(0);
}

if (require.main === module) {
  main().catch(() => process.exit(0));
}