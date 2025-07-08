#!/usr/bin/env tsx

// Script to detect parent vs subagent sessions from hook input

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: any;
}

function detectSessionType(hookInput: HookInput): 'parent' | 'subagent' | 'unknown' {
  const { session_id, transcript_path } = hookInput;
  
  // Method 1: Check file size (subagents are typically smaller)
  try {
    const fs = require('fs');
    const stats = fs.statSync(transcript_path);
    const fileSizeKB = stats.size / 1024;
    
    console.log(`Session ${session_id}:`);
    console.log(`  File size: ${fileSizeKB.toFixed(1)} KB`);
    
    // Heuristic: Parent sessions are typically much larger
    if (fileSizeKB > 100) {
      console.log(`  Type: PARENT (large file)`);
      return 'parent';
    } else if (fileSizeKB < 50) {
      console.log(`  Type: SUBAGENT (small file)`);
      return 'subagent';
    }
    
  } catch (error) {
    console.log(`  Error checking file: ${error}`);
  }
  
  // Method 2: Check if transcript contains subagent-like patterns
  try {
    const fs = require('fs');
    const content = fs.readFileSync(transcript_path, 'utf8');
    
    // Look for indicators of subagent activity
    const subagentIndicators = [
      'claude -p ',           // CLI invocation
      'run src/prompts/',     // Prompt execution
      'Generated with',       // Quick completion
    ];
    
    const hasSubagentPattern = subagentIndicators.some(pattern => 
      content.includes(pattern)
    );
    
    if (hasSubagentPattern) {
      console.log(`  Type: SUBAGENT (contains subagent patterns)`);
      return 'subagent';
    }
    
  } catch (error) {
    console.log(`  Error analyzing content: ${error}`);
  }
  
  // Method 3: Check session duration (subagents complete quickly)
  try {
    const fs = require('fs');
    const stats = fs.statSync(transcript_path);
    const ageMinutes = (Date.now() - stats.birthtime.getTime()) / (1000 * 60);
    
    console.log(`  Age: ${ageMinutes.toFixed(1)} minutes`);
    
    // If file is very young and small, likely subagent
    if (ageMinutes < 5 && stats.size < 50000) {
      console.log(`  Type: SUBAGENT (young and small)`);
      return 'subagent';
    }
    
  } catch (error) {
    console.log(`  Error checking age: ${error}`);
  }
  
  console.log(`  Type: UNKNOWN (no clear indicators)`);
  return 'unknown';
}

// Test with current hook data
async function main() {
  console.log('🔍 Detecting Session Types\n');
  
  // Test current session
  const currentHook: HookInput = {
    session_id: "02d759a7-f86d-4a8d-bbbf-6bf7d6b2701d",
    transcript_path: "/home/user/.claude/projects/-workspace-main/02d759a7-f86d-4a8d-bbbf-6bf7d6b2701d.jsonl"
  };
  
  detectSessionType(currentHook);
  console.log('');
  
  // Test subagent session
  const subagentHook: HookInput = {
    session_id: "0930ac68-69bd-4108-aaf2-d368f9c12b4c", 
    transcript_path: "/home/user/.claude/projects/-workspace-main/0930ac68-69bd-4108-aaf2-d368f9c12b4c.jsonl"
  };
  
  detectSessionType(subagentHook);
}

if (require.main === module) {
  main();
}