#!/usr/bin/env tsx

/**
 * Simple speech helper for command-line usage
 * Usage: tsx src/tools/host-bridge/speech-helper.ts "Your message here"
 */

import { hostBridge } from './index.js';

async function speakMessage() {
  const message = process.argv[2];
  
  if (!message) {
    console.error('Usage: tsx speech-helper.ts "Your message"');
    process.exit(1);
  }
  
  try {
    await hostBridge.speech_say(message);
    console.log('Speech delivered!');
  } catch (error) {
<<<<<<< HEAD
    console.error('Speech failed:', error instanceof Error ? error.message : error);
=======
    console.error('Speech failed:', error.message);
>>>>>>> 5d3291809a761e16acb51670a9738c3d2d31485f
    console.log('💡 Ensure host-bridge daemon is running: npm start');
  }
}

speakMessage();