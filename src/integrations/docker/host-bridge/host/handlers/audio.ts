/**
 * Audio Service Handler
 * Handles audio playback operations
 */

import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { BaseHandler } from './base';
import type { BridgeRequest } from '../../shared/types';

const execAsync = promisify(exec);

export class AudioHandler extends BaseHandler {
  private lastPlayTime: Map<string, number> = new Map();
  private readonly minPlayInterval = 2000; // 2 seconds in milliseconds

  getServiceName(): string {
    return 'audio';
  }
  
  async handle(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId } = request;
    const { sound, volume = 1.0 } = payload;
    
    this.log('INFO', `Audio request: ${action} ${sound} (volume: ${volume})`);
    
    if (action === 'play') {
      await this.handlePlay(requestId, sound, volume);
    } else {
      const errorMsg = `Unknown audio action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('audio', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
    }
  }
  
  private async handlePlay(requestId: string, sound: string, volume: number): Promise<void> {
    // Check rate limiting
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(sound) || 0;
    const timeSinceLastPlay = now - lastPlay;
    
    if (timeSinceLastPlay < this.minPlayInterval) {
      const remainingTime = this.minPlayInterval - timeSinceLastPlay;
      this.log('INFO', `Rate limiting: Skipping ${sound} (${remainingTime}ms until next allowed play)`);
      this.writeResponse('audio', this.createResponse(
        requestId,
        'skipped',
        `Rate limited - sound played too recently`,
        { sound, remainingTime }
      ));
      return;
    }
    
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
      this.writeResponse('audio', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
      return;
    }
    
    // Play audio using afplay
    try {
      await execAsync(`afplay "${soundFile}"`);
      this.log('INFO', `Audio played successfully: ${soundFile}`);
      
      // Update last play time for rate limiting
      this.lastPlayTime.set(sound, Date.now());
      
      this.writeResponse('audio', this.createResponse(
        requestId,
        'success',
        'Audio played successfully',
        { sound: soundFile }
      ));
    } catch (error) {
      const errorMsg = 'Failed to play audio';
      this.log('ERROR', errorMsg);
      this.writeResponse('audio', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
    }
  }
}