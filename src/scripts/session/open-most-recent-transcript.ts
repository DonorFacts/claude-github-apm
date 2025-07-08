#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { hostBridge } from '../../integrations/docker/host-bridge/container';

// This script opens the most recently modified transcript file in VS Code
// Uses file system timestamps to find the currently active conversation

async function findMostRecentTranscript(): Promise<string | null> {
  const transcriptsDir = '/home/user/.claude/projects/-workspace-main';

  if (!existsSync(transcriptsDir)) {
    return null;
  }

  // Get all .jsonl files and sort by modification time
  const files = readdirSync(transcriptsDir)
    .filter(file => file.endsWith('.jsonl'))
    .map(file => {
      const filepath = join(transcriptsDir, file);
      const stats = statSync(filepath);
      return {
        path: filepath,
        modifiedTime: stats.mtime.getTime()
      };
    })
    .sort((a, b) => b.modifiedTime - a.modifiedTime); // Most recent first

  return files.length > 0 ? files[0].path : null;
}

async function openTranscriptInCode(transcriptPath: string): Promise<void> {
  try {
    // Convert container path to host path format
    // Container: /home/user/.claude/projects/-workspace-main/session-id.jsonl  
    // Host: /Users/{username}/.claude/projects/-workspace-main/session-id.jsonl
    
    // First try ~/.claude/ format (should work with tilde expansion)
    let hostPath = transcriptPath.replace('/home/user/.claude/', '~/.claude/');
    
    console.log(`Opening transcript in VS Code via host-bridge: ${hostPath}`);
    
    let success = await hostBridge.vscode_open(hostPath);
    
    if (!success) {
      // Fallback to absolute path format for macOS/Unix
      // Extract just the relative path after .claude/
      const relativePath = transcriptPath.split('/.claude/')[1];
      if (relativePath) {
        const possiblePaths = [
          `/Users/jakedetels/.claude/${relativePath}`, // Your specific case
          // Could add more patterns here if needed
        ];
        
        for (const testPath of possiblePaths) {
          console.log(`Retrying with absolute path: ${testPath}`);
          success = await hostBridge.vscode_open(testPath);
          if (success) {
            hostPath = testPath;
            break;
          }
        }
      }
    }
    
    if (success) {
      console.log('✅ Most recent transcript opened in VS Code on host');
      console.log(`📄 File: ${hostPath}`);
    } else {
      console.log('❌ Failed to open VS Code via host-bridge');
      console.log('');
      console.log('💡 Troubleshooting options:');
      console.log('1. Check if host-bridge daemon is running:');
      console.log('   tsx src/integrations/docker/host-bridge/host/daemon.ts');
      console.log('');
      console.log('2. Manual alternatives:');
      console.log(`   code "${transcriptPath}"`);
      console.log(`   cat "${transcriptPath}"`);
    }
  } catch (error) {
    console.error('Error with host-bridge VS Code integration:', error);
    console.log('');
    console.log('💡 Alternative options:');
    console.log('1. Copy the transcript path and open it on your host machine:');
    console.log(`   code "${transcriptPath}"`);
    console.log('');
    console.log('2. View the transcript content directly:');
    console.log(`   cat "${transcriptPath}"`);
  }
}

async function main(): Promise<void> {
  const mostRecentTranscript = await findMostRecentTranscript();
  
  if (!mostRecentTranscript) {
    console.log('No transcript files found in Claude projects directory.');
    return;
  }

  console.log(`Most Recent Transcript: ${mostRecentTranscript}`);
  const stats = statSync(mostRecentTranscript);
  console.log(`Last Modified: ${stats.mtime.toISOString()}`);
  console.log(`File Size: ${stats.size} bytes`);
  console.log('');
  
  // Check if transcript file exists
  if (!existsSync(mostRecentTranscript)) {
    console.error(`Transcript file not found: ${mostRecentTranscript}`);
    console.error('The file may have been moved or deleted.');
    return;
  }

  await openTranscriptInCode(mostRecentTranscript);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to open most recent transcript:', error);
    process.exit(1);
  });
}