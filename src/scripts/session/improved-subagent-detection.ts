#!/usr/bin/env tsx

import { readFileSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Improved subagent detection using multiple reliable indicators
 * Does NOT rely on content patterns that could be misleading
 */

interface SessionAnalysis {
  sessionId: string;
  transcriptPath: string;
  isSubagent: boolean;
  confidence: number;
  indicators: string[];
  birthTime: Date;
  modifyTime: Date;
  fileSizeKB: number;
  lifespanMinutes: number;
}

function analyzeSession(transcriptPath: string): SessionAnalysis {
  const sessionId = transcriptPath.split('/').pop()?.replace('.jsonl', '') || 'unknown';
  const stats = statSync(transcriptPath);
  const content = readFileSync(transcriptPath, 'utf8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  
  const fileSizeKB = stats.size / 1024;
  const birthTime = stats.birthtime;
  const modifyTime = stats.mtime;
  const lifespanMinutes = (modifyTime.getTime() - birthTime.getTime()) / (1000 * 60);
  
  const indicators: string[] = [];
  let confidence = 0;
  
  // Indicator 1: File size (very reliable)
  if (fileSizeKB < 20) {
    indicators.push('small-file-size');
    confidence += 0.4;
  } else if (fileSizeKB > 100) {
    indicators.push('large-file-size');
    confidence -= 0.4; // Against subagent
  }
  
  // Indicator 2: Short lifespan (reliable)
  if (lifespanMinutes < 5) {
    indicators.push('short-lifespan');
    confidence += 0.3;
  } else if (lifespanMinutes > 30) {
    indicators.push('long-lifespan');
    confidence -= 0.3; // Against subagent
  }
  
  // Indicator 3: Message structure analysis (structural, not content-based)
  try {
    const firstUserLine = lines.find(line => {
      try {
        const parsed = JSON.parse(line);
        return parsed.message?.role === 'user';
      } catch {
        return false;
      }
    });
    
    if (firstUserLine) {
      const parsed = JSON.parse(firstUserLine);
      
      // Check message structure (not content)
      if (typeof parsed.message.content === 'string') {
        indicators.push('simple-string-content');
        confidence += 0.2;
      } else if (Array.isArray(parsed.message.content)) {
        indicators.push('structured-array-content');
        confidence -= 0.2; // Against subagent
      }
      
      // Check message length (not content)
      const messageLength = typeof parsed.message.content === 'string' 
        ? parsed.message.content.length 
        : JSON.stringify(parsed.message.content).length;
        
      if (messageLength < 100) {
        indicators.push('short-first-message');
        confidence += 0.1;
      } else if (messageLength > 500) {
        indicators.push('long-first-message');
        confidence -= 0.1; // Against subagent
      }
    }
  } catch (error) {
    indicators.push('parse-error');
  }
  
  // Indicator 4: Timing correlation with other sessions
  const allSessions = findSessionsInTimeWindow(birthTime, 10); // 10 minute window
  if (allSessions.length > 1) {
    // If multiple sessions started around the same time, likely subagents
    const largestSession = allSessions.reduce((largest, current) => 
      current.size > largest.size ? current : largest
    );
    
    if (largestSession.path !== transcriptPath) {
      indicators.push('concurrent-with-larger-session');
      confidence += 0.2;
    }
  }
  
  // Final determination
  const isSubagent = confidence > 0.5;
  
  return {
    sessionId,
    transcriptPath,
    isSubagent,
    confidence: Math.max(0, Math.min(1, confidence)),
    indicators,
    birthTime,
    modifyTime,
    fileSizeKB,
    lifespanMinutes
  };
}

function findSessionsInTimeWindow(targetTime: Date, windowMinutes: number): Array<{path: string, size: number, birth: Date}> {
  const transcriptsDir = '/home/user/.claude/projects/-workspace-main';
  const windowStart = new Date(targetTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + windowMinutes * 60 * 1000);
  
  return readdirSync(transcriptsDir)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => {
      const path = join(transcriptsDir, file);
      const stats = statSync(path);
      return {
        path,
        size: stats.size,
        birth: stats.birthtime
      };
    })
    .filter(session => 
      session.birth >= windowStart && session.birth <= windowEnd
    );
}

function findMostLikelyParentSession(subagentAnalysis: SessionAnalysis): string | null {
  if (!subagentAnalysis.isSubagent) {
    return null; // Not a subagent
  }
  
  // Look for sessions that were active when this subagent was born
  const candidateParents = findSessionsInTimeWindow(subagentAnalysis.birthTime, 60)
    .filter(session => session.path !== subagentAnalysis.transcriptPath)
    .filter(session => session.size > subagentAnalysis.fileSizeKB * 1024 * 5) // Much larger
    .sort((a, b) => b.size - a.size); // Largest first
  
  return candidateParents.length > 0 ? candidateParents[0].path : null;
}

function main() {
  const transcriptPath = process.argv[2];
  
  if (!transcriptPath) {
    console.error('Usage: tsx improved-subagent-detection.ts <transcript-path>');
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing: ${transcriptPath}\n`);
  
  const analysis = analyzeSession(transcriptPath);
  
  console.log(`📊 Session Analysis:`);
  console.log(`  Session ID: ${analysis.sessionId}`);
  console.log(`  File Size: ${analysis.fileSizeKB.toFixed(1)} KB`);
  console.log(`  Lifespan: ${analysis.lifespanMinutes.toFixed(1)} minutes`);
  console.log(`  Born: ${analysis.birthTime.toISOString()}`);
  console.log(`  Modified: ${analysis.modifyTime.toISOString()}`);
  console.log(`\n🎯 Detection Results:`);
  console.log(`  Is Subagent: ${analysis.isSubagent ? 'YES' : 'NO'}`);
  console.log(`  Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
  console.log(`  Indicators: ${analysis.indicators.join(', ')}`);
  
  if (analysis.isSubagent) {
    const parentPath = findMostLikelyParentSession(analysis);
    if (parentPath) {
      const parentId = parentPath.split('/').pop()?.replace('.jsonl', '');
      console.log(`\n👨‍👩‍👧‍👦 Likely Parent Session: ${parentId}`);
      console.log(`  Path: ${parentPath}`);
    } else {
      console.log(`\n❓ Could not identify parent session`);
    }
  }
  
  process.exit(analysis.isSubagent ? 0 : 1);
}

if (require.main === module) {
  main();
}

export { analyzeSession, findMostLikelyParentSession };