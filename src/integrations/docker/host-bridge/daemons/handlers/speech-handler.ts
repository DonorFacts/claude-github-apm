/**
 * Speech Service Handler
 * Handles text-to-speech operations
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import { BaseHandler } from './base-handler';
import type { BridgeRequest } from '../../types';

const execAsync = promisify(exec);

export class SpeechHandler extends BaseHandler {
  constructor(
    responsesDir: string,
    log: (level: string, message: string) => void,
    private readonly speechMaxAgeSeconds: number
  ) {
    super(responsesDir, log);
  }
  
  getServiceName(): string {
    return 'speech';
  }
  
  async handle(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId, timestamp: requestTimestamp } = request;
    const { message, voice = 'system', rate = 200 } = payload;
    
    // Check if the speech request is too old
    if (this.isSpeechRequestStale(requestTimestamp)) {
      const ageInfo = `older than ${this.speechMaxAgeSeconds}s`;
      this.log('INFO', `Skipping stale speech request (${ageInfo}): '${message}'`);
      this.writeResponse('speech', this.createResponse(
        requestId,
        'skipped',
        'Request too old, skipped',
        { reason: 'stale', max_age_seconds: this.speechMaxAgeSeconds }
      ));
      return;
    }
    
    this.log('INFO', `Speech request: ${action} '${message}' (voice: ${voice}, rate: ${rate})`);
    
    if (action === 'say') {
      await this.handleSay(requestId, message, voice, rate);
    } else {
      const errorMsg = `Unknown speech action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('speech', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
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
  
  private async handleSay(
    requestId: string,
    message: string,
    voice: string,
    rate: number
  ): Promise<void> {
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
      this.writeResponse('speech', this.createResponse(
        requestId,
        'success',
        'Speech completed successfully',
        { message, voice }
      ));
    } catch (error) {
      const errorMsg = 'Failed to speak message';
      this.log('ERROR', errorMsg);
      this.writeResponse('speech', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
    }
  }
}