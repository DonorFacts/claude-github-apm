#!/usr/bin/env tsx

/**
 * Simple speech helper for command-line usage
 * Usage: tsx src/integrations/docker/host-bridge/speech-helper.ts "Your message here"
 */

import { hostBridge } from '../index.js';

async function speakMessage() {
  const message = process.argv[2];
  const waitForResponse = process.argv.includes('--wait');
  
  if (!message) {
    console.error('Usage: tsx speech-helper.ts "Your message" [--wait]');
    process.exit(1);
  }
  
  try {
    if (waitForResponse) {
      // Wait for confirmation (default behavior)
      await hostBridge.speech_say(message);
      console.log('Speech delivered!');
    } else {
      // Fire and forget - just queue the message and exit
      hostBridge.speech_say_nowait(message);
      console.log('Speech queued!');
    }
  } catch (error) {
    console.error('Speech failed:', error instanceof Error ? error.message : String(error));
    console.log('💡 Ensure host-bridge daemon is running: npm start');
  }
}

speakMessage();