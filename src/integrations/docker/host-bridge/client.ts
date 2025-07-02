/**
 * Host-Bridge Client Library
 * Unified container-host communication client
 */

import { randomUUID } from 'crypto';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import path from 'path';
import type { 
  BridgeRequest, 
  BridgeResponse, 
  VSCodePayload, 
  AudioPayload, 
  SpeechPayload,
  ServicesConfig 
} from './types';

export class HostBridge {
  private bridgeDir: string;
  private requestsDir: string;
  private responsesDir: string;
  private configDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.bridgeDir = path.join(projectRoot, 'src', 'integrations', 'docker', 'host-bridge', 'runtime', 'host-bridge');
    this.requestsDir = path.join(this.bridgeDir, 'requests');
    this.responsesDir = path.join(this.bridgeDir, 'responses');
    this.configDir = path.join(this.bridgeDir, 'config');
    
    // Ensure directories exist
    mkdirSync(this.requestsDir, { recursive: true });
    mkdirSync(this.responsesDir, { recursive: true });
    mkdirSync(this.configDir, { recursive: true });
  }

  /**
   * Send a request to the host daemon and wait for response
   */
  async request(
    service: BridgeRequest['service'],
    action: string,
    payload: Record<string, any>,
    options: { timeout?: number; priority?: BridgeRequest['priority'] } = {}
  ): Promise<BridgeResponse> {
    const config = this.loadServicesConfig();
    const serviceConfig = config[service];
    
    if (!serviceConfig?.enabled) {
      throw new Error(`Service '${service}' is not enabled`);
    }

    const request: BridgeRequest = {
      id: randomUUID(),
      service,
      action,
      timestamp: new Date().toISOString(),
      payload,
      timeout: options.timeout ?? serviceConfig.timeout,
      priority: options.priority ?? 'normal'
    };

    const requestFile = path.join(this.requestsDir, `${service}.queue`);
    const responseFile = path.join(this.responsesDir, `${service}.response`);

    // Clear any existing response for this service
    if (existsSync(responseFile)) {
      writeFileSync(responseFile, '');
    }

    // Send request
    writeFileSync(requestFile, JSON.stringify(request) + '\n', { flag: 'a' });

    // Wait for response
    return this.waitForResponse(request.id, responseFile, request.timeout);
  }

  /**
   * Wait for response from host daemon
   */
  private async waitForResponse(
    requestId: string,
    responseFile: string,
    timeout: number
  ): Promise<BridgeResponse> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkResponse = () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Request ${requestId} timed out after ${timeout}ms`));
          return;
        }

        if (existsSync(responseFile)) {
          try {
            const content = readFileSync(responseFile, 'utf8').trim();
            if (content) {
              const lines = content.split('\n').filter(line => line.trim());
              
              // Find response matching our request ID
              for (const line of lines) {
                const response: BridgeResponse = JSON.parse(line);
                if (response.id === requestId) {
                  if (response.status === 'success') {
                    resolve(response);
                  } else {
                    reject(new Error(`Request failed: ${response.message}`));
                  }
                  return;
                }
              }
            }
          } catch (error) {
            // Response file might be partially written, continue polling
          }
        }

        // Continue polling
        setTimeout(checkResponse, 100);
      };

      checkResponse();
    });
  }

  /**
   * Load services configuration
   */
  private loadServicesConfig(): ServicesConfig {
    const configFile = path.join(this.configDir, 'services.json');
    if (!existsSync(configFile)) {
      throw new Error('Services configuration not found. Is the host daemon running?');
    }
    
    return JSON.parse(readFileSync(configFile, 'utf8'));
  }

  // Convenience methods for specific services

  /**
   * Open a path in VS Code
   */
  async vscode_open(path: string): Promise<boolean> {
    try {
      const response = await this.request('vscode', 'open', { path });
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to open VS Code:', (error as Error).message);
      return false;
    }
  }

  /**
   * Play a notification sound
   */
  async audio_play(sound: string, volume: number = 1.0): Promise<boolean> {
    try {
      const response = await this.request('audio', 'play', { sound, volume });
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to play audio:', (error as Error).message);
      return false;
    }
  }

  /**
   * Speak text using text-to-speech
   */
  async speech_say(message: string, voice?: string, rate?: number): Promise<boolean> {
    try {
      const payload: SpeechPayload = { message };
      if (voice) payload.voice = voice;
      if (rate) payload.rate = rate;
      
      const response = await this.request('speech', 'say', payload);
      return response.status === 'success';
    } catch (error) {
      console.error('Failed to speak:', (error as Error).message);
      return false;
    }
  }

  /**
   * Check if host daemon is running
   */
  async isHostDaemonRunning(): Promise<boolean> {
    try {
      const pidFile = path.join(this.configDir, 'daemon.pid');
      return existsSync(pidFile);
    } catch {
      return false;
    }
  }

  /**
   * Get available services and their status
   */
  getServicesStatus(): ServicesConfig {
    return this.loadServicesConfig();
  }
}

// Export singleton instance
export const hostBridge = new HostBridge();