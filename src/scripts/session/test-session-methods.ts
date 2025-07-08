#!/usr/bin/env tsx

import { execSync } from 'child_process';

// Test script to compare session transcript methods using Claude SDK

interface TestResult {
  method: string;
  success: boolean;
  sessionId?: string;
  transcriptPath?: string;
  output: string;
  error?: string;
}

async function testMethod(promptPath: string, methodName: string): Promise<TestResult> {
  try {
    console.log(`\n🔍 Testing ${methodName}...`);
    
    const output = execSync(`claude -p "run ${promptPath}"`, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    console.log(`✅ ${methodName} completed`);
    
    // Extract session info from output if possible
    const sessionIdMatch = output.match(/Session ID: ([a-f0-9-]+)/i);
    const pathMatch = output.match(/(?:Transcript Path|File): ([^\n]+)/i);
    
    return {
      method: methodName,
      success: true,
      sessionId: sessionIdMatch?.[1],
      transcriptPath: pathMatch?.[1],
      output: output.trim()
    };
    
  } catch (error) {
    console.log(`❌ ${methodName} failed:`, error);
    
    return {
      method: methodName,
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function compareResults(result1: TestResult, result2: TestResult): Promise<void> {
  console.log('\n📊 COMPARISON RESULTS');
  console.log('=' .repeat(50));
  
  console.log(`\n${result1.method}:`);
  console.log(`  Success: ${result1.success}`);
  console.log(`  Session ID: ${result1.sessionId || 'Not found'}`);
  console.log(`  Transcript Path: ${result1.transcriptPath || 'Not found'}`);
  
  console.log(`\n${result2.method}:`);
  console.log(`  Success: ${result2.success}`);
  console.log(`  Session ID: ${result2.sessionId || 'Not found'}`);
  console.log(`  Transcript Path: ${result2.transcriptPath || 'Not found'}`);
  
  console.log('\n🔍 Analysis:');
  
  if (result1.success && result2.success) {
    const sameSessionId = result1.sessionId === result2.sessionId;
    const samePath = result1.transcriptPath === result2.transcriptPath;
    
    if (sameSessionId && samePath) {
      console.log('✅ IDENTICAL: Both methods return the same session and path');
    } else {
      console.log('⚠️  DIFFERENT: Methods return different results');
      if (!sameSessionId) {
        console.log(`   Session ID differs: ${result1.sessionId} vs ${result2.sessionId}`);
      }
      if (!samePath) {
        console.log(`   Path differs: ${result1.transcriptPath} vs ${result2.transcriptPath}`);
      }
    }
  } else {
    console.log('❌ Cannot compare: One or both methods failed');
  }
}

async function main(): Promise<void> {
  console.log('🧪 Testing Session Transcript Methods');
  console.log('=====================================');
  
  // Test both methods
  const mostRecentResult = await testMethod(
    'src/prompts/session/most-recent-transcript.md',
    'Most Recent File System Method'
  );
  
  const hookResult = await testMethod(
    'src/prompts/session/hook-input-transcript.md', 
    'Hook Input Method'
  );
  
  // Compare results
  await compareResults(mostRecentResult, hookResult);
  
  console.log('\n📝 Detailed Outputs:');
  console.log('-'.repeat(30));
  console.log(`\n${mostRecentResult.method}:`);
  console.log(mostRecentResult.output || mostRecentResult.error);
  
  console.log(`\n${hookResult.method}:`);
  console.log(hookResult.output || hookResult.error);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}