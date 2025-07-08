#!/usr/bin/env tsx

import { readFileSync, statSync } from 'fs';

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name?: string;
  tool_name?: string;
  tool_input?: any;
}

function testMethod1_FileSize(hookInput: HookInput): 'parent' | 'subagent' | 'unknown' {
  try {
    const stats = statSync(hookInput.transcript_path);
    const fileSizeKB = stats.size / 1024;
    
    console.log(`  Method 1 - File Size: ${fileSizeKB.toFixed(1)} KB`);
    
    if (fileSizeKB < 50) return 'subagent';
    if (fileSizeKB > 100) return 'parent';
    return 'unknown';
  } catch (error) {
    console.log(`  Method 1 - Error: ${error}`);
    return 'unknown';
  }
}

function testMethod2_Environment(): 'parent' | 'subagent' | 'unknown' {
  const entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT;
  console.log(`  Method 2 - CLAUDE_CODE_ENTRYPOINT: ${entrypoint}`);
  
  if (entrypoint === 'cli') return 'subagent';
  if (entrypoint === undefined || entrypoint === '') return 'parent';
  return 'unknown';
}

function testMethod3_SessionTracking(hookInput: HookInput): 'parent' | 'subagent' | 'unknown' {
  // We know our current parent session
  const knownParentSessions = new Set(['02d759a7-f86d-4a8d-bbbf-6bf7d6b2701d']);
  const isKnownParent = knownParentSessions.has(hookInput.session_id);
  
  console.log(`  Method 3 - Known parent session: ${isKnownParent}`);
  
  if (isKnownParent) return 'parent';
  return 'subagent'; // Assume unknown sessions are subagents
}

function testMethod4_ContentAnalysis(hookInput: HookInput): 'parent' | 'subagent' | 'unknown' {
  try {
    const content = readFileSync(hookInput.transcript_path, 'utf8');
    const hasSubagentPatterns = content.includes('claude -p ') || content.includes('run src/prompts/');
    
    console.log(`  Method 4 - Has subagent patterns: ${hasSubagentPatterns}`);
    
    if (hasSubagentPatterns) return 'subagent';
    return 'parent';
  } catch (error) {
    console.log(`  Method 4 - Error: ${error}`);
    return 'unknown';
  }
}

function validateSession(hookInput: HookInput, expectedType: 'parent' | 'subagent') {
  console.log(`\n🧪 Testing session: ${hookInput.session_id}`);
  console.log(`Expected type: ${expectedType.toUpperCase()}`);
  
  const results = {
    method1: testMethod1_FileSize(hookInput),
    method2: testMethod2_Environment(),
    method3: testMethod3_SessionTracking(hookInput),
    method4: testMethod4_ContentAnalysis(hookInput)
  };
  
  console.log(`\n📊 Results:`);
  Object.entries(results).forEach(([method, result]) => {
    const isCorrect = result === expectedType;
    const status = isCorrect ? '✅' : '❌';
    console.log(`  ${method}: ${result} ${status}`);
  });
  
  const correctCount = Object.values(results).filter(r => r === expectedType).length;
  console.log(`\n📈 Accuracy: ${correctCount}/4 methods correct`);
  
  return results;
}

async function main() {
  console.log('🔬 VALIDATING DETECTION METHODS');
  console.log('================================');
  
  // Test parent session
  const parentHook: HookInput = {
    session_id: "02d759a7-f86d-4a8d-bbbf-6bf7d6b2701d",
    transcript_path: "/home/user/.claude/projects/-workspace-main/02d759a7-f86d-4a8d-bbbf-6bf7d6b2701d.jsonl"
  };
  
  validateSession(parentHook, 'parent');
  
  // Test subagent session
  const subagentHook: HookInput = {
    session_id: "0930ac68-69bd-4108-aaf2-d368f9c12b4c",
    transcript_path: "/home/user/.claude/projects/-workspace-main/0930ac68-69bd-4108-aaf2-d368f9c12b4c.jsonl"
  };
  
  validateSession(subagentHook, 'subagent');
}

if (require.main === module) {
  main();
}