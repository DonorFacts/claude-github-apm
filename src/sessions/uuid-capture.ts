/**
 * Claude Code UUID Capture - Automatically capture Claude session UUIDs
 * 
 * This module captures the relationship between APM sessions and Claude Code conversation UUIDs
 * so we can properly restore sessions using claude --resume
 */

import { ClaudeCodeBridge } from './claude-code-bridge';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

/**
 * Capture Claude Code session UUID from environment and create bridge mapping
 * This should be called early in agent initialization
 */
export function captureClaudeSessionUuid(): void {
  try {
    const apmSessionId = process.env.APM_SESSION_ID;
    if (!apmSessionId) {
      console.warn(chalk.yellow('Warning: APM_SESSION_ID not found in environment'));
      return;
    }

    // Since ~/.claude is mounted, use direct JSONL scanning for UUID
    const claudeSessionUuid = 
      process.env.CLAUDE_SESSION_ID ||
      process.env.CLAUDE_CONVERSATION_ID ||
      process.env.CLAUDE_UUID ||
      scanForActiveClaudeSession();

    if (claudeSessionUuid) {
      const bridge = new ClaudeCodeBridge();
      const projectPath = getCurrentClaudeProjectPath();
      
      bridge.createBridgeMapping(apmSessionId, claudeSessionUuid, projectPath);
      
      console.log(chalk.green('✓'), `Captured Claude session UUID: ${claudeSessionUuid.substring(0, 8)}...`);
      console.log(chalk.dim(`   Bridge: ${apmSessionId} → ${claudeSessionUuid}`));
    } else {
      console.warn(chalk.yellow('Warning: Unable to capture Claude session UUID'));
      console.log(chalk.dim('   Session restoration may require manual UUID lookup'));
    }
  } catch (error) {
    console.error(chalk.red('Error capturing Claude session UUID:'), error);
  }
}

/**
 * Scan for active Claude session by looking at recent JSONL files
 * Since ~/.claude is mounted, we can directly access the files
 */
function scanForActiveClaudeSession(): string | null {
  try {
    const claudeProjectsDir = path.join(require('os').homedir(), '.claude', 'projects');
    
    if (!fs.existsSync(claudeProjectsDir)) {
      return null;
    }

    // Get current project directory name (Claude's naming convention)
    const cwd = process.cwd();
    const projectName = cwd.replace(/\//g, '-');
    const currentProjectDir = path.join(claudeProjectsDir, projectName);

    if (!fs.existsSync(currentProjectDir)) {
      return null;
    }

    // Find the most recent JSONL file (active session)
    const jsonlFiles = fs.readdirSync(currentProjectDir)
      .filter(file => file.endsWith('.jsonl'))
      .map(file => ({
        name: file,
        path: path.join(currentProjectDir, file),
        mtime: fs.statSync(path.join(currentProjectDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    if (jsonlFiles.length > 0) {
      // Extract UUID from most recent file name (filename is the UUID)
      const mostRecentFile = jsonlFiles[0];
      const uuidMatch = mostRecentFile.name.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
      return uuidMatch ? uuidMatch[1] : null;
    }

    return null;
  } catch (error) {
    console.error(chalk.dim('Error scanning for Claude session:'), error);
    return null;
  }
}

/**
 * Get current Claude project path for bridge mapping
 */
function getCurrentClaudeProjectPath(): string {
  try {
    const cwd = process.cwd();
    const claudeDir = path.join(require('os').homedir(), '.claude', 'projects');
    
    // Use Claude's naming convention (direct access since ~/.claude is mounted)
    const projectName = cwd.replace(/\//g, '-').replace(/^-/, '');
    
    return path.join(claudeDir, projectName);
  } catch {
    return '';
  }
}

/**
 * Scan existing Claude conversations to find likely matches
 */
export async function scanForMatchingConversation(apmSessionId: string): Promise<string | null> {
  try {
    const bridge = new ClaudeCodeBridge();
    const claudeProjectPath = getCurrentClaudeProjectPath();
    
    if (!fs.existsSync(claudeProjectPath)) {
      return null;
    }
    
    // Get all .jsonl files in the project directory
    const conversationFiles = fs.readdirSync(claudeProjectPath)
      .filter(file => file.endsWith('.jsonl'))
      .map(file => ({
        uuid: file.replace('.jsonl', ''),
        path: path.join(claudeProjectPath, file),
        mtime: fs.statSync(path.join(claudeProjectPath, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Most recent first
    
    // Search conversation contents for APM session ID
    for (const conversation of conversationFiles) {
      try {
        const content = fs.readFileSync(conversation.path, 'utf8');
        
        // Look for our APM session ID in the conversation
        if (content.includes(apmSessionId)) {
          console.log(chalk.blue('🔍'), `Found matching conversation: ${conversation.uuid}`);
          
          // Create bridge mapping for future use
          bridge.createBridgeMapping(apmSessionId, conversation.uuid, claudeProjectPath);
          
          return conversation.uuid;
        }
      } catch (error) {
        // Skip corrupted files
        continue;
      }
    }
    
    // Fallback: return most recent conversation if no direct match
    if (conversationFiles.length > 0) {
      const mostRecent = conversationFiles[0];
      console.log(chalk.yellow('⚠️'), `No direct match found, using most recent conversation: ${mostRecent.uuid}`);
      
      bridge.createBridgeMapping(apmSessionId, mostRecent.uuid, claudeProjectPath);
      return mostRecent.uuid;
    }
    
    return null;
  } catch (error) {
    console.error(chalk.red('Error scanning conversations:'), error);
    return null;
  }
}