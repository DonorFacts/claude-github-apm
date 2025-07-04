#!/usr/bin/env tsx

/**
 * Container Speech Bridge
 * Allows Docker containers to use host speech via the host-bridge system
 * Usage: tsx container-speech.ts "message to speak"
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

async function main() {
  const message = process.argv[2];

  if (!message) {
    console.error('Usage: container-speech.ts "message to speak"');
    process.exit(1);
  }

  // Check if running in container
  if (process.env.APM_CONTAINERIZED === 'true') {
    // In container: write to shared speech queue
    const speechQueuePath = '/workspace/src/integrations/docker/host-bridge/runtime/host-bridge/requests/speech.queue';
    
    // Ensure directory exists
    const queueDir = path.dirname(speechQueuePath);
    if (!fs.existsSync(queueDir)) {
      fs.mkdirSync(queueDir, { recursive: true });
    }
    
    // Append message to queue
    fs.appendFileSync(speechQueuePath, message + '\n');
    console.log(`🔊 Speech queued: ${message}`);
  } else {
    // On host: use system say command directly (macOS)
    try {
      execSync(`say "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log(`🔊 Spoke: ${message}`);
    } catch (error) {
      console.error(`❌ Failed to speak: ${(error as Error).message}`);
      console.log('💡 This feature requires macOS or compatible speech system');
    }
  }
}

main().catch(error => {
  console.error('Speech error:', error);
  process.exit(1);
});