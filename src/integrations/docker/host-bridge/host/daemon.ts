#!/usr/bin/env tsx

/**
 * Host-Bridge Daemon
 * Unified container-host communication daemon
 * Processes requests for vscode, audio, and speech services
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BridgeRequest } from '../shared/types';

// Import handlers
import { ServiceHandler } from './handlers/base';
import { VSCodeHandler } from './handlers/vscode';
import { AudioHandler } from './handlers/audio';
import { SpeechHandler } from './handlers/speech';

// Import utilities
import { PathTranslator } from './utils/path-translator';
import { Logger } from './utils/logger';
import { ConfigManager } from './utils/config-manager';

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
  
  private logger: Logger;
  private pathTranslator: PathTranslator;
  private configManager: ConfigManager;
  private handlers: Map<string, ServiceHandler>;

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
    
    // Initialize utilities
    this.logger = new Logger(this.logFile);
    this.pathTranslator = new PathTranslator(this.projectRoot);
    this.configManager = new ConfigManager(this.configDir);
    
    // Load or create services configuration
    const servicesConfig = this.configManager.loadOrCreateConfig();
    
    // Initialize handlers
    this.handlers = new Map();
    this.registerHandlers();
  }

  private ensureDirectories(): void {
    [this.requestsDir, this.responsesDir, this.configDir, this.logsDir].forEach(dir => {
      fs.mkdirSync(dir, { recursive: true });
    });
  }
  
  private registerHandlers(): void {
    // Create bound log function
    const log = (level: string, message: string) => this.logger.log(level, message);
    
    // Register service handlers
    const vscodeHandler = new VSCodeHandler(
      this.responsesDir,
      log,
      (path) => this.pathTranslator.translate(path)
    );
    const audioHandler = new AudioHandler(this.responsesDir, log);
    const speechHandler = new SpeechHandler(
      this.responsesDir,
      log,
      this.speechMaxAgeSeconds
    );
    
    this.handlers.set(vscodeHandler.getServiceName(), vscodeHandler);
    this.handlers.set(audioHandler.getServiceName(), audioHandler);
    this.handlers.set(speechHandler.getServiceName(), speechHandler);
  }

  private checkExistingDaemon(): void {
    if (fs.existsSync(this.pidFile)) {
      try {
        const existingPid = fs.readFileSync(this.pidFile, 'utf8').trim();
        // Check if process is running
        process.kill(parseInt(existingPid), 0);
        this.logger.log('ERROR', `Daemon already running (PID: ${existingPid})`);
        process.exit(1);
      } catch (error) {
        // Process not running, remove stale PID file
        this.logger.log('INFO', 'Removing stale PID file');
        fs.unlinkSync(this.pidFile);
      }
    }
  }

  private storePid(): void {
    fs.writeFileSync(this.pidFile, process.pid.toString());
  }

  private cleanup(): void {
    this.logger.log('INFO', 'Shutting down host-bridge daemon');
    this.running = false;
    try {
      fs.unlinkSync(this.pidFile);
    } catch (error) {
      // Ignore errors during cleanup
    }
    process.exit(0);
  }

  private async processQueue(service: string): Promise<void> {
    const queueFile = path.join(this.requestsDir, `${service}.queue`);
    
    if (fs.existsSync(queueFile) && fs.statSync(queueFile).size > 0) {
      this.logger.log('INFO', `Processing ${service} queue`);
      
      // Read all lines from the queue
      const content = fs.readFileSync(queueFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Clear the queue
      fs.writeFileSync(queueFile, '');
      
      // Get handler for this service
      const handler = this.handlers.get(service);
      if (!handler) {
        this.logger.log('ERROR', `No handler registered for service: ${service}`);
        return;
      }
      
      // Process each request
      for (const requestLine of lines) {
        try {
          const request: BridgeRequest = JSON.parse(requestLine);
          await handler.handle(request);
        } catch (error) {
          this.logger.log('ERROR', `Invalid JSON in ${service} queue: ${requestLine}`);
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
    
    this.logger.log('INFO', `Host-Bridge daemon started (PID: ${process.pid})`);
    this.logger.log('INFO', `Bridge directory: ${this.bridgeDir}`);
    this.logger.log('INFO', `Processing requests for: ${Array.from(this.handlers.keys()).join(', ')}`);
    this.logger.log('INFO', `Speech queue filtering: max age ${this.speechMaxAgeSeconds}s (configurable via SPEECH_MAX_AGE_SECONDS)`);
    
    // Main processing loop
    this.logger.log('INFO', 'Starting main processing loop');
    while (this.running) {
      try {
        for (const service of this.handlers.keys()) {
          await this.processQueue(service);
        }
      } catch (error) {
        this.logger.log('ERROR', `Error in main loop: ${error}`);
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