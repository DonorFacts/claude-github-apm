#!/usr/bin/env tsx

import { readFileSync, writeFileSync, mkdirSync, existsSync, symlinkSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { HookInput } from './types';

interface SubagentReference {
  sessionId: string;
  transcriptPath: string;
  timestamp: string;
}

/**
 * Creates .claude/sessions/ folder structure with symlinks
 * 
 * Structure:
 * .claude/sessions/YYYYMMDD_HHMMSS-<parent-session-id>/
 *   ├── main.jsonl -> /Users/jakedetels/.claude/projects/-workspace-main/<parent-session-id>.jsonl
 *   ├── subagent-1-YYYYMMDD_HHMMSS-<subagent-session-id-1>.jsonl -> /Users/jakedetels/.claude/projects/-workspace-main/<subagent-session-id-1>.jsonl
 *   └── subagent-2-YYYYMMDD_HHMMSS-<subagent-session-id-2>.jsonl -> /Users/jakedetels/.claude/projects/-workspace-main/<subagent-session-id-2>.jsonl
 */
class SessionSymlinkManager {
  private parentSessionId: string;
  private parentTranscriptPath: string;
  private timestamp: string;
  private sessionFolderName: string;
  private sessionDir: string;

  constructor(hookInput: HookInput) {
    if (!hookInput.session_id || !hookInput.transcript_path) {
      throw new Error('Missing session_id or transcript_path in hook input');
    }

    this.parentSessionId = hookInput.session_id;
    this.parentTranscriptPath = hookInput.transcript_path;
    this.timestamp = this.generateTimestamp();
    this.sessionFolderName = `${this.timestamp}-${this.parentSessionId}`;
    this.sessionDir = join('.claude/sessions', this.sessionFolderName);

    console.log(`🔗 Creating session symlinks for ${this.parentSessionId}`);
    console.log(`📁 Session folder: ${this.sessionDir}`);
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  private containerPathToHostPath(containerPath: string): string {
    // Convert container path to macOS host path
    // Container: /home/user/.claude/projects/-workspace-main/session-id.jsonl
    // Host: /Users/jakedetels/.claude/projects/-workspace-main/session-id.jsonl
    return containerPath.replace('/home/user/', '/Users/jakedetels/');
  }

  private createSymlink(linkPath: string, targetPath: string): void {
    // Remove existing symlink if it exists
    if (existsSync(linkPath)) {
      unlinkSync(linkPath);
    }

    try {
      symlinkSync(targetPath, linkPath);
      console.log(`✅ Created symlink: ${linkPath} -> ${targetPath}`);
    } catch (error) {
      console.error(`❌ Failed to create symlink: ${linkPath} -> ${targetPath}`, error);
    }
  }

  private async findSubagentSessions(): Promise<SubagentReference[]> {
    console.log('🔍 Searching for subagent sessions...');
    
    const subagents: SubagentReference[] = [];
    const transcriptsDir = dirname(this.parentTranscriptPath);
    
    if (!existsSync(transcriptsDir)) {
      console.log('📁 Transcripts directory not found');
      return subagents;
    }

    // Get all .jsonl files in the transcripts directory
    const allTranscriptFiles = readdirSync(transcriptsDir)
      .filter(file => file.endsWith('.jsonl'))
      .filter(file => !file.includes(this.parentSessionId)); // Exclude parent session
    
    console.log(`📊 Found ${allTranscriptFiles.length} potential subagent files to analyze`);

    // Extract recent outgoing messages from current parent session AND other recent sessions
    const parentMessages = this.extractRecentParentMessages();
    const messagesFromOtherSessions = this.extractMessagesFromRecentSessions(transcriptsDir);
    const allParentMessages = [...parentMessages, ...messagesFromOtherSessions];
    
    if (allParentMessages.length === 0) {
      console.log('⚠️  No recent parent messages found to match against subagents');
      return subagents;
    }

    console.log(`🔍 Analyzing ${allParentMessages.length} recent parent messages for subagent patterns`);

    // Check each potential subagent file
    for (const file of allTranscriptFiles) {
      const sessionId = file.replace('.jsonl', '');
      const filePath = join(transcriptsDir, file);
      
      try {
        const isSubagent = await this.isSubagentOfParent(filePath, allParentMessages);
        
        if (isSubagent) {
          const timestamp = this.extractSubagentTimestamp(filePath);
          subagents.push({
            sessionId,
            transcriptPath: filePath,
            timestamp
          });
          console.log(`✅ Found subagent: ${sessionId}`);
        }
      } catch (error) {
        console.error(`⚠️  Error analyzing ${file}:`, error);
      }
    }

    console.log(`🎯 Total subagents found: ${subagents.length}`);
    return subagents;
  }

  private extractRecentParentMessages(): string[] {
    return this.extractTaskMessagesFromFile(this.parentTranscriptPath, 'current session');
  }

  private extractMessagesFromRecentSessions(transcriptsDir: string): string[] {
    const messages: string[] = [];
    
    try {
      // Get the 3 most recent transcript files that might be parent sessions
      const allFiles = readdirSync(transcriptsDir)
        .filter(file => file.endsWith('.jsonl'))
        .filter(file => !file.includes(this.parentSessionId))
        .map(file => {
          const filePath = join(transcriptsDir, file);
          const stats = statSync(filePath);
          return { file, filePath, mtime: stats.mtime.getTime(), size: stats.size };
        })
        .sort((a, b) => b.mtime - a.mtime) // Most recent first
        .slice(0, 3); // Only check 3 most recent
      
      console.log(`🔍 Checking ${allFiles.length} recent sessions for Task invocations`);
      
      for (const fileInfo of allFiles) {
        console.log(`📂 Checking ${fileInfo.file} (size: ${(fileInfo.size/1024).toFixed(1)}KB)`);
        
        // Skip very small files (likely subagents)
        if (fileInfo.size < 10000) {
          console.log(`   ⏭️  Skipping (too small, likely subagent)`);
          continue;
        }
        
        const sessionMessages = this.extractTaskMessagesFromFile(fileInfo.filePath, `session ${fileInfo.file.replace('.jsonl', '')}`);
        messages.push(...sessionMessages);
      }
      
    } catch (error) {
      console.error('Error reading other recent sessions:', error);
    }
    
    return messages;
  }

  private extractTaskMessagesFromFile(filePath: string, sessionName: string): string[] {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const messages: string[] = [];
      
      // Look at the last 30 lines to find recent assistant messages
      const recentLines = lines.slice(-30);
      
      for (const line of recentLines) {
        try {
          const entry = JSON.parse(line);
          
          // Look for assistant messages with tool_use content
          if (entry.type === 'assistant' && entry.message?.content) {
            const content = entry.message.content;
            
            // Check if it's an array of content blocks
            if (Array.isArray(content)) {
              for (const block of content) {
                if (block.type === 'tool_use' && block.name === 'Task') {
                  const prompt = block.input?.prompt || '';
                  if (prompt.includes('Test subagent') || 
                      prompt.includes('echo some test text') || 
                      prompt.includes('run src/prompts/') || 
                      prompt.includes('claude -p')) {
                    messages.push(prompt);
                  }
                }
              }
            }
            // Check if it's a string containing subagent invocation
            else if (typeof content === 'string' && (content.includes('run src/prompts/') || content.includes('claude -p'))) {
              messages.push(content);
            }
          }
        } catch (error) {
          // Skip invalid JSON lines
          continue;
        }
      }
      
      if (messages.length > 0) {
        console.log(`🔍 Found ${messages.length} Task invocations in ${sessionName}`);
      }
      return messages;
    } catch (error) {
      console.error(`Error reading ${sessionName}:`, error);
      return [];
    }
  }

  private async isSubagentOfParent(subagentPath: string, parentMessages: string[]): Promise<boolean> {
    try {
      const content = readFileSync(subagentPath, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) return false;
      
      // Look at the first few lines for the initial user message
      const firstFewLines = lines.slice(0, 5);
      
      for (const line of firstFewLines) {
        try {
          const entry = JSON.parse(line);
          
          if (entry.type === 'user' && entry.message?.content) {
            const userContent = entry.message.content;
            
            // Check if this user message matches any recent parent messages
            for (const parentMessage of parentMessages) {
              if (this.messagesMatch(userContent, parentMessage)) {
                return true;
              }
            }
          }
        } catch (error) {
          // Skip invalid JSON lines
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error reading subagent file ${subagentPath}:`, error);
      return false;
    }
  }

  private messagesMatch(subagentUserContent: string, parentMessage: string): boolean {
    // Check for Test subagent patterns
    if (parentMessage.includes('Test subagent')) {
      const testSubagentMatch = parentMessage.match(/Test subagent (\d+)/);
      if (testSubagentMatch) {
        const testNumber = testSubagentMatch[1];
        if (subagentUserContent.includes(`Test subagent ${testNumber}`)) {
          return true;
        }
      }
    }
    
    // Check for simple text patterns first
    if (parentMessage.includes('echo some test text') && subagentUserContent.includes('echo some test text')) {
      return true;
    }
    
    // Extract the core prompt from the parent message - try multiple patterns
    const patterns = [
      /run src\/prompts\/([^"'\s\)]+)/,  // run src/prompts/prompt-name
      /claude -p "([^"]+)"/,              // claude -p "prompt text"
      /"([^"]*run src\/prompts\/[^"]+)"/  // quoted full command
    ];
    
    for (const pattern of patterns) {
      const match = parentMessage.match(pattern);
      if (match) {
        const extractedPart = match[1];
        
        // Check if the subagent's user content contains this extracted part
        if (subagentUserContent.includes(extractedPart) || 
            subagentUserContent.includes(`run src/prompts/${extractedPart}`) ||
            subagentUserContent.includes(extractedPart.replace('src/prompts/', ''))) {
          return true;
        }
      }
    }
    
    return false;
  }

  private extractSubagentTimestamp(subagentPath: string): string {
    try {
      const content = readFileSync(subagentPath, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) return this.timestamp;
      
      // Get timestamp from first line
      const firstLine = lines[0];
      const entry = JSON.parse(firstLine);
      
      if (entry.timestamp) {
        const date = new Date(entry.timestamp);
        return this.formatTimestamp(date);
      }
    } catch (error) {
      console.error('Error extracting subagent timestamp:', error);
    }
    
    return this.timestamp;
  }

  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  public async createSessionSymlinks(): Promise<void> {
    // Create session directory
    mkdirSync(this.sessionDir, { recursive: true });
    
    // Create main.jsonl symlink for parent session
    const mainSymlinkPath = join(this.sessionDir, 'main.jsonl');
    const mainTargetPath = this.containerPathToHostPath(this.parentTranscriptPath);
    this.createSymlink(mainSymlinkPath, mainTargetPath);
    
    // Find and create symlinks for subagent sessions
    const subagents = await this.findSubagentSessions();
    
    subagents.forEach((subagent, index) => {
      const subagentSymlinkName = `subagent-${index + 1}-${subagent.timestamp}-${subagent.sessionId}.jsonl`;
      const subagentSymlinkPath = join(this.sessionDir, subagentSymlinkName);
      const subagentTargetPath = this.containerPathToHostPath(subagent.transcriptPath);
      
      this.createSymlink(subagentSymlinkPath, subagentTargetPath);
    });
    
    console.log(`🎉 Session symlinks created successfully in ${this.sessionDir}`);
    
    // Create a summary file
    const summaryPath = join(this.sessionDir, 'session-info.json');
    const summaryData = {
      parentSessionId: this.parentSessionId,
      timestamp: this.timestamp,
      totalSubagents: subagents.length,
      createdAt: new Date().toISOString(),
      subagents: subagents.map(s => ({
        sessionId: s.sessionId,
        timestamp: s.timestamp
      }))
    };
    
    writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
    console.log(`📋 Session summary saved to ${summaryPath}`);
  }
}

// Main execution
async function main(): Promise<void> {
  console.log('🚀 Starting session symlink creation...');
  
  try {
    // Try to read from current session (via hooks)
    const capturedSessionsDir = '.claude/conversations';
    
    if (!existsSync(capturedSessionsDir)) {
      throw new Error('No captured sessions found. This script must be run from a parent agent with active hooks.');
    }
    
    // Find the most recent captured session
    const sessionDirs = readdirSync(capturedSessionsDir).filter(dir => 
      existsSync(join(capturedSessionsDir, dir, 'conversation.json'))
    );
    
    if (sessionDirs.length === 0) {
      throw new Error('No captured session data found. Ensure hooks are capturing session data.');
    }
    
    // Get the most recent session
    const mostRecentSession = sessionDirs
      .map(dir => {
        const sessionFile = join(capturedSessionsDir, dir, 'conversation.json');
        const sessionData = JSON.parse(readFileSync(sessionFile, 'utf8'));
        return { dir, sessionData };
      })
      .sort((a, b) => new Date(b.sessionData.capturedAt).getTime() - new Date(a.sessionData.capturedAt).getTime())[0];
    
    const hookInput: HookInput = {
      session_id: mostRecentSession.sessionData.sessionId,
      transcript_path: mostRecentSession.sessionData.transcriptPath
    };
    
    console.log(`📊 Using session: ${hookInput.session_id}`);
    console.log(`📄 Transcript path: ${hookInput.transcript_path}`);
    
    const manager = new SessionSymlinkManager(hookInput);
    await manager.createSessionSymlinks();
    
  } catch (error) {
    console.error('❌ Error creating session symlinks:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SessionSymlinkManager };