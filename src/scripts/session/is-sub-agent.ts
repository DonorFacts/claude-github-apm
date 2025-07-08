#!/usr/bin/env tsx

import { readFileSync } from 'fs';

/**
 * Detects if a transcript file represents a subagent conversation
 * by analyzing the actual transcript content structure
 */

interface TranscriptLine {
  message: {
    role: 'user' | 'assistant';
    content: Array<{ type: string; text?: string; [key: string]: any }>;
  };
  [key: string]: any;
}

function isSubAgent(transcriptPath: string): boolean {
  try {
    const content = readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return false; // Empty file, can't determine
    }
    
    // Parse the first line to check the structure
    let firstLine: any;
    try {
      firstLine = JSON.parse(lines[0]);
    } catch {
      return false; // Can't parse JSON
    }
    
    // Find the first user message by checking first few lines
    let firstUserMessage: any = null;
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      try {
        const line = JSON.parse(lines[i]);
        if (line.message?.role === 'user') {
          firstUserMessage = line;
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!firstUserMessage) {
      return false; // No user message found
    }
    
    // Extract the user's message content
    let userText = '';
    
    if (typeof firstUserMessage.message.content === 'string') {
      // Subagent pattern: content is a simple string
      userText = firstUserMessage.message.content;
    } else if (Array.isArray(firstUserMessage.message.content)) {
      // Parent pattern: content is an array of objects
      userText = firstUserMessage.message.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join(' ');
    } else {
      return false; // Unknown content structure
    }
    
    const userTextLower = userText.toLowerCase();
    console.log(`First user message: "${userText.slice(0, 100)}..."`);
    console.log(`Content type: ${typeof firstUserMessage.message.content}`);
    
    // Primary indicator: Simple string content (subagent) vs structured array (parent)
    const isSimpleStringContent = typeof firstUserMessage.message.content === 'string';
    
    // Secondary indicator: Subagent-specific patterns in the first message
    const subagentPatterns = [
      'run src/prompts/',           // Explicit prompt execution
    ];
    
    const hasSubagentPattern = subagentPatterns.some(pattern => 
      userTextLower.includes(pattern.toLowerCase())
    );
    
    const isSubagent = isSimpleStringContent && hasSubagentPattern;
    
    console.log(`Simple string content: ${isSimpleStringContent}`);
    console.log(`Has subagent patterns: ${hasSubagentPattern}`);
    console.log(`Detected as: ${isSubagent ? 'SUBAGENT' : 'PARENT'}`);
    
    return isSubagent;
    
  } catch (error) {
    console.error(`Error analyzing transcript: ${error}`);
    return false;
  }
}

function main() {
  const transcriptPath = process.argv[2];
  
  if (!transcriptPath) {
    console.error('Usage: tsx is-sub-agent.ts <transcript-path>');
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing: ${transcriptPath}`);
  const result = isSubAgent(transcriptPath);
  
  console.log(`\n📊 Result: ${result ? 'SUBAGENT' : 'PARENT'}`);
  process.exit(result ? 0 : 1); // Exit code 0 for subagent, 1 for parent
}

if (require.main === module) {
  main();
}

export { isSubAgent };