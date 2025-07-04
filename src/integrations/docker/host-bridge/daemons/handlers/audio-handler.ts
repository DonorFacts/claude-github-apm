/**
 * Audio Service Handler
 * Handles audio playback operations
 */

import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { BaseHandler } from './base-handler';
import type { BridgeRequest } from '../../types';

const execAsync = promisify(exec);

export class AudioHandler extends BaseHandler {
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