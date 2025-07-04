#!/usr/bin/env tsx

/**
 * Host-Bridge Daemon
 * Unified container-host communication daemon
 * Processes requests for vscode, audio, and speech services
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import type { BridgeRequest, BridgeResponse } from '../types';

const execAsync = promisify(exec);

class HostBridgeDaemon {
  private readonly scriptDir: string;
  private readonly bridgeDir: string;
  private readonly requestsDir: string;
  private readonly responsesDir: string;
  private readonly configDir: string;
  private readonly logsDir: string;
  private readonly pidFile: string;
  private readonly logFile: string;
  private readonly speechMaxAgeSeconds: number;
  private readonly projectRoot: string;
  private running = true;

  constructor() {
    // Configuration
    this.scriptDir = __dirname;
    this.bridgeDir = path.resolve(this.scriptDir, '../runtime/host-bridge');
    this.requestsDir = path.join(this.bridgeDir, 'requests');
    this.responsesDir = path.join(this.bridgeDir, 'responses');
    this.configDir = path.join(this.bridgeDir, 'config');
    this.logsDir = path.join(this.bridgeDir, 'logs');
    this.pidFile = path.join(this.configDir, 'daemon.pid');
    this.logFile = path.join(this.logsDir, 'bridge.log');
    
    // Speech queue filtering configuration
    this.speechMaxAgeSeconds = parseInt(process.env.SPEECH_MAX_AGE_SECONDS || '120', 10);
    
    // Get project root (navigate up from daemons directory)
    this.projectRoot = path.resolve(this.scriptDir, '../..');
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.requestsDir, this.responsesDir, this.configDir, this.logsDir].forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
    });
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    
    // Write to console
    process.stdout.write(logLine);
    
    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private isSpeechRequestStale(requestTimestamp: string): boolean {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    let requestTimestampEpoch = 0;

    try {
      // Parse ISO timestamp
      const date = new Date(requestTimestamp);
      if (!isNaN(date.getTime())) {
        requestTimestampEpoch = Math.floor(date.getTime() / 1000);
      }
    } catch (error) {
      // Parsing failed
    }

    // If timestamp parsing failed, consider it stale
    if (requestTimestampEpoch === 0) {
      return true;
    }

    const ageSeconds = currentTimestamp - requestTimestampEpoch;
    return ageSeconds > this.speechMaxAgeSeconds;
  }

  private checkExistingDaemon(): void {
    if (fs.existsSync(this.pidFile)) {
      try {
        const existingPid = fs.readFileSync(this.pidFile, 'utf8').trim();
        // Check if process is running
        process.kill(parseInt(existingPid), 0);
        this.log('ERROR', `Daemon already running (PID: ${existingPid})`);
        process.exit(1);
      } catch (error) {
        // Process not running, remove stale PID file
        this.log('INFO', 'Removing stale PID file');
        fs.unlinkSync(this.pidFile);
      }
    }
  }

  private storePid(): void {
    fs.writeFileSync(this.pidFile, process.pid.toString());
  }

  private cleanup(): void {
    this.log('INFO', 'Shutting down host-bridge daemon');
    this.running = false;
    try {
      fs.unlinkSync(this.pidFile);
    } catch (error) {
      // Ignore errors during cleanup
    }
    process.exit(0);
  }

  private translateContainerPath(containerPath: string): string {
    if (containerPath.startsWith('/workspace/main')) {
      return this.projectRoot + containerPath.substring('/workspace/main'.length);
    } else if (containerPath.startsWith('/workspace/worktrees/')) {
      const worktreeName = containerPath.substring('/workspace/worktrees/'.length);
      const projectDir = path.dirname(this.projectRoot);
      return path.join(projectDir, 'worktrees', worktreeName);
    } else if (containerPath.startsWith('/workspace')) {
      return this.projectRoot + containerPath.substring('/workspace'.length);
    }
    return containerPath;
  }

  private async handleVscode(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId } = request;
    const { path: requestPath } = payload;
    
    this.log('INFO', `VS Code request: ${action} ${requestPath}`);
    
    if (action === 'open') {
      const hostPath = this.translateContainerPath(requestPath);
      this.log('INFO', `Translated path: ${requestPath} -> ${hostPath}`);
      
      // Check if path exists
      if (!fs.existsSync(hostPath)) {
        const errorMsg = `Path does not exist: ${hostPath}`;
        this.log('ERROR', errorMsg);
        this.writeResponse('vscode', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Check if VS Code is available
      try {
        execSync('which code', { stdio: 'pipe' });
      } catch {
        const errorMsg = 'VS Code command not found';
        this.log('ERROR', errorMsg);
        this.writeResponse('vscode', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Open VS Code
      try {
        await execAsync(`code "${hostPath}"`);
        this.log('INFO', `VS Code opened successfully: ${hostPath}`);
        this.writeResponse('vscode', {
          id: requestId,
          status: 'success',
          message: 'VS Code opened successfully',
          data: { path: hostPath },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMsg = 'Failed to open VS Code';
        this.log('ERROR', errorMsg);
        this.writeResponse('vscode', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const errorMsg = `Unknown VS Code action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('vscode', {
        id: requestId,
        status: 'error',
        message: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleAudio(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId } = request;
    const { sound, volume = 1.0 } = payload;
    
    this.log('INFO', `Audio request: ${action} ${sound} (volume: ${volume})`);
    
    if (action === 'play') {
      // Try different sound locations
      const soundPaths = [
        `/System/Library/Sounds/${sound}`,
        `/System/Library/Sounds/${sound}.aiff`,
        sound
      ];
      
      let soundFile = '';
      for (const soundPath of soundPaths) {
        if (fs.existsSync(soundPath)) {
          soundFile = soundPath;
          break;
        }
      }
      
      if (!soundFile) {
        const errorMsg = `Sound file not found: ${sound}`;
        this.log('ERROR', errorMsg);
        this.writeResponse('audio', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      // Play audio using afplay
      try {
        await execAsync(`afplay "${soundFile}"`);
        this.log('INFO', `Audio played successfully: ${soundFile}`);
        this.writeResponse('audio', {
          id: requestId,
          status: 'success',
          message: 'Audio played successfully',
          data: { sound: soundFile },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMsg = 'Failed to play audio';
        this.log('ERROR', errorMsg);
        this.writeResponse('audio', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const errorMsg = `Unknown audio action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('audio', {
        id: requestId,
        status: 'error',
        message: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async handleSpeech(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId, timestamp: requestTimestamp } = request;
    const { message, voice = 'system', rate = 200 } = payload;
    
    // Check if the speech request is too old
    if (this.isSpeechRequestStale(requestTimestamp)) {
      const ageInfo = `older than ${this.speechMaxAgeSeconds}s`;
      this.log('INFO', `Skipping stale speech request (${ageInfo}): '${message}'`);
      this.writeResponse('speech', {
        id: requestId,
        status: 'skipped',
        message: 'Request too old, skipped',
        data: { reason: 'stale', max_age_seconds: this.speechMaxAgeSeconds },
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    this.log('INFO', `Speech request: ${action} '${message}' (voice: ${voice}, rate: ${rate})`);
    
    if (action === 'say') {
      // Build say command arguments
      const args: string[] = [];
      if (voice !== 'system') {
        args.push('-v', voice);
      }
      if (rate !== 200) {
        args.push('-r', rate.toString());
      }
      args.push(`"${message.replace(/"/g, '\\"')}"`);
      
      // Execute say command
      try {
        await execAsync(`say ${args.join(' ')}`);
        this.log('INFO', 'Speech completed successfully');
        this.writeResponse('speech', {
          id: requestId,
          status: 'success',
          message: 'Speech completed successfully',
          data: { message, voice },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        const errorMsg = 'Failed to speak message';
        this.log('ERROR', errorMsg);
        this.writeResponse('speech', {
          id: requestId,
          status: 'error',
          message: errorMsg,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const errorMsg = `Unknown speech action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('speech', {
        id: requestId,
        status: 'error',
        message: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  }

  private writeResponse(service: string, response: BridgeResponse): void {
    const responseFile = path.join(this.responsesDir, `${service}.response`);
    fs.appendFileSync(responseFile, JSON.stringify(response) + '\n');
  }

  private async processQueue(service: string): Promise<void> {
    const queueFile = path.join(this.requestsDir, `${service}.queue`);
    
    if (fs.existsSync(queueFile) && fs.statSync(queueFile).size > 0) {
      this.log('INFO', `Processing ${service} queue`);
      
      // Read all lines from the queue
      const content = fs.readFileSync(queueFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Clear the queue
      fs.writeFileSync(queueFile, '');
      
      // Process each request
      for (const requestLine of lines) {
        try {
          const request: BridgeRequest = JSON.parse(requestLine);
          
          switch (service) {
            case 'vscode':
              await this.handleVscode(request);
              break;
            case 'audio':
              await this.handleAudio(request);
              break;
            case 'speech':
              await this.handleSpeech(request);
              break;
            default:
              this.log('ERROR', `Unknown service: ${service}`);
          }
        } catch (error) {
          this.log('ERROR', `Invalid JSON in ${service} queue: ${requestLine}`);
        }
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async start(): Promise<void> {
    // Check if daemon is already running
    this.checkExistingDaemon();
    
    // Store daemon PID
    this.storePid();
    
    // Set up signal handlers
    process.on('SIGTERM', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    
    this.log('INFO', `Host-Bridge daemon started (PID: ${process.pid})`);
    this.log('INFO', `Bridge directory: ${this.bridgeDir}`);
    this.log('INFO', 'Processing requests for: vscode, audio, speech');
    this.log('INFO', `Speech queue filtering: max age ${this.speechMaxAgeSeconds}s (configurable via SPEECH_MAX_AGE_SECONDS)`);
    
    // Main processing loop
    this.log('INFO', 'Starting main processing loop');
    while (this.running) {
      try {
        for (const service of ['vscode', 'audio', 'speech']) {
          await this.processQueue(service);
        }
      } catch (error) {
        this.log('ERROR', `Error in main loop: ${error}`);
      }
      await this.sleep(100);
    }
  }
}

// Start the daemon
const daemon = new HostBridgeDaemon();
daemon.start().catch(error => {
  console.error('Failed to start daemon:', error);
  process.exit(1);
});