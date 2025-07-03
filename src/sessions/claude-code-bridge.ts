/**
 * Claude Code Bridge - Maps APM sessions to Claude Code conversation UUIDs
 * 
 * Handles the integration between our APM session management system
 * and Claude Code's native conversation restoration functionality.
 */

import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface ClaudeCodeSession {
  uuid: string;
  filePath: string;
  summary?: string;
  lastActivity: string;
  projectPath: string;
  messageCount: number;
}

interface SessionBridgeData {
  apm_session_id: string;
  claude_session_uuid: string;
  mapping_created: string;
  last_verified: string;
  project_path: string;
}

export class ClaudeCodeBridge {
  private claudeConfigDir: string;
  private bridgeDataFile: string;

  constructor() {
    // Direct access to mounted ~/.claude directory
    this.claudeConfigDir = path.join(require('os').homedir(), '.claude');
    this.bridgeDataFile = path.join(process.cwd(), 'apm', 'sessions', '.claude-bridge.jsonl');
  }

  /**
   * Find Claude Code session UUID for a given APM session ID
   */
  async findClaudeSessionUuid(apmSessionId: string): Promise<string | null> {
    // First check our bridge mapping
    const bridgeMapping = this.readBridgeMapping(apmSessionId);
    if (bridgeMapping) {
      // Verify the session still exists
      if (await this.verifyClaudeSession(bridgeMapping.claude_session_uuid, bridgeMapping.project_path)) {
        return bridgeMapping.claude_session_uuid;
      }
    }

    // Fall back to scanning Claude Code sessions
    return await this.scanForClaudeSession(apmSessionId);
  }

  /**
   * Create or update bridge mapping between APM and Claude Code sessions
   */
  createBridgeMapping(apmSessionId: string, claudeSessionUuid: string, projectPath: string): void {
    const bridgeData: SessionBridgeData = {
      apm_session_id: apmSessionId,
      claude_session_uuid: claudeSessionUuid,
      mapping_created: new Date().toISOString(),
      last_verified: new Date().toISOString(),
      project_path: projectPath
    };

    // Ensure bridge directory exists
    const bridgeDir = path.dirname(this.bridgeDataFile);
    if (!fs.existsSync(bridgeDir)) {
      fs.mkdirSync(bridgeDir, { recursive: true });
    }

    // Append to bridge file
    fs.appendFileSync(this.bridgeDataFile, JSON.stringify(bridgeData) + '\n');
  }

  /**
   * Get Claude Code session information
   */
  async getClaudeSessionInfo(sessionUuid: string): Promise<ClaudeCodeSession | null> {
    try {
      const projectDirs = this.getClaudeProjectDirectories();
      
      for (const projectDir of projectDirs) {
        const sessionFile = path.join(projectDir, `${sessionUuid}.jsonl`);
        if (fs.existsSync(sessionFile)) {
          const stats = fs.statSync(sessionFile);
          const content = fs.readFileSync(sessionFile, 'utf8');
          const lines = content.trim().split('\n');
          
          // Extract summary from first line if available
          let summary = 'No summary available';
          try {
            const firstLine = JSON.parse(lines[0]);
            if (firstLine.type === 'summary' && firstLine.summary) {
              summary = firstLine.summary;
            }
          } catch {
            // Ignore parsing errors
          }

          return {
            uuid: sessionUuid,
            filePath: sessionFile,
            summary,
            lastActivity: stats.mtime.toISOString(),
            projectPath: projectDir,
            messageCount: lines.length
          };
        }
      }
    } catch (error) {
      console.error(chalk.red('Error reading Claude session:'), error);
    }
    
    return null;
  }

  /**
   * Generate appropriate directory path relative to current working directory
   */
  generateRelativeDirectoryPath(sessionWorktree: string): string {
    const currentDir = process.cwd();
    
    // Common worktree patterns to handle
    const patterns = [
      // Direct match
      sessionWorktree,
      // Relative to parent directory
      path.join('..', path.basename(sessionWorktree)),
      // Worktree subdirectory pattern
      path.join('..', '..', 'worktrees', path.basename(sessionWorktree)),
      // Main repo pattern
      path.join('..', 'main'),
    ];

    for (const pattern of patterns) {
      const fullPath = path.resolve(currentDir, pattern);
      if (fs.existsSync(fullPath)) {
        // Return the relative path from current directory
        return path.relative(currentDir, fullPath);
      }
    }

    // If nothing found, return the session worktree as-is
    return sessionWorktree;
  }

  /**
   * Check if Claude Code is available for session restoration
   */
  async isClaudeCodeAvailable(): Promise<boolean> {
    try {
      const claudeBin = path.join('.local', 'bin', 'claude');
      return fs.existsSync(claudeBin);
    } catch {
      return false;
    }
  }

  private readBridgeMapping(apmSessionId: string): SessionBridgeData | null {
    if (!fs.existsSync(this.bridgeDataFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.bridgeDataFile, 'utf8');
      const lines = content.trim().split('\n');
      
      for (const line of lines.reverse()) { // Most recent first
        if (line.trim()) {
          const data = JSON.parse(line) as SessionBridgeData;
          if (data.apm_session_id === apmSessionId) {
            return data;
          }
        }
      }
    } catch (error) {
      console.error(chalk.yellow('Warning: Error reading bridge mapping:'), error);
    }

    return null;
  }

  private async verifyClaudeSession(sessionUuid: string, projectPath: string): Promise<boolean> {
    const sessionFile = path.join(projectPath, `${sessionUuid}.jsonl`);
    return fs.existsSync(sessionFile);
  }

  public async scanForClaudeSession(apmSessionId: string): Promise<string | null> {
    try {
      const projectPath = this.getCurrentProjectPath();
      if (!fs.existsSync(projectPath)) {
        return null;
      }
      
      // Get all .jsonl files in the project directory
      const conversationFiles = fs.readdirSync(projectPath)
        .filter(file => file.endsWith('.jsonl'))
        .map(file => ({
          uuid: file.replace('.jsonl', ''),
          path: path.join(projectPath, file),
          mtime: fs.statSync(path.join(projectPath, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Most recent first
      
      console.log(chalk.blue('🔍'), `Scanning ${conversationFiles.length} conversations for APM session ID...`);
      
      // Search conversation contents for APM session ID
      for (const conversation of conversationFiles.slice(0, 10)) { // Check last 10 conversations
        try {
          const content = fs.readFileSync(conversation.path, 'utf8');
          
          // Look for our APM session ID in the conversation
          if (content.includes(apmSessionId)) {
            console.log(chalk.green('✓'), `Found matching conversation: ${conversation.uuid.substring(0, 8)}...`);
            
            // Create bridge mapping for future use
            this.createBridgeMapping(apmSessionId, conversation.uuid, projectPath);
            
            return conversation.uuid;
          }
        } catch (error) {
          // Skip corrupted files
          continue;
        }
      }
      
      // Fallback: return most recent conversation if it's from today
      if (conversationFiles.length > 0) {
        const mostRecent = conversationFiles[0];
        const isRecent = Date.now() - mostRecent.mtime.getTime() < 24 * 60 * 60 * 1000; // Last 24h
        
        if (isRecent) {
          console.log(chalk.yellow('⚠️'), `No direct match found, using most recent conversation: ${mostRecent.uuid.substring(0, 8)}...`);
          console.log(chalk.dim('   This may not be the correct conversation - verify manually if needed'));
          
          this.createBridgeMapping(apmSessionId, mostRecent.uuid, projectPath);
          return mostRecent.uuid;
        }
      }
      
      return null;
    } catch (error) {
      console.error(chalk.red('Error scanning conversations:'), error);
      return null;
    }
  }

  public getCurrentProjectPath(): string {
    try {
      const cwd = process.cwd();
      // Since ~/.claude is mounted, use direct path access consistently
      const claudeDir = path.join(require('os').homedir(), '.claude', 'projects');
      
      // Use Claude's naming convention for project directories
      const projectName = cwd.replace(/\//g, '-');
      
      return path.join(claudeDir, projectName);
    } catch {
      return '';
    }
  }

  private getClaudeProjectDirectories(): string[] {
    try {
      const projectsDir = path.join(this.claudeConfigDir, 'projects');
      if (!fs.existsSync(projectsDir)) {
        return [];
      }

      return fs.readdirSync(projectsDir)
        .map(name => path.join(projectsDir, name))
        .filter(dir => fs.statSync(dir).isDirectory());
    } catch {
      return [];
    }
  }
}

/**
 * Generate friendly error message for environment mismatches
 */
export function generateEnvironmentMismatchError(session: any): string {
  const currentBranch = getCurrentBranchSync();
  const currentDir = process.cwd();
  const bridge = new ClaudeCodeBridge();
  
  const targetDir = bridge.generateRelativeDirectoryPath(session.worktree);
  
  let message = '\n';
  message += chalk.bold.red('❌ Environment Mismatch - Cannot Restore Session\n');
  message += chalk.red('='.repeat(60)) + '\n\n';
  
  message += chalk.bold('Session Requirements:\n');
  message += `  Branch: ${chalk.cyan(session.branch)}\n`;
  message += `  Directory: ${chalk.cyan(session.worktree)}\n\n`;
  
  message += chalk.bold('Current Environment:\n');
  message += `  Branch: ${chalk.yellow(currentBranch)}\n`;
  message += `  Directory: ${chalk.yellow(path.basename(currentDir))}\n\n`;
  
  message += chalk.bold.green('🛠️  To restore this session, run these commands:\n\n');
  
  // Only show cd command if we need to change directories
  if (path.resolve(targetDir) !== currentDir) {
    message += chalk.cyan('# Navigate to correct directory\n');
    message += `cd ${targetDir}\n\n`;
  }
  
  // Only show git checkout if branches differ
  if (currentBranch !== session.branch) {
    message += chalk.cyan('# Switch to correct branch\n');
    message += `git checkout ${session.branch}\n\n`;
  }
  
  message += chalk.cyan('# Then restore the session\n');
  message += `pnpm cli restore ${session.id}\n\n`;
  
  message += chalk.dim('💡 Or use --skip-env-check to restore anyway (not recommended)\n');
  
  return message;
}

function getCurrentBranchSync(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}