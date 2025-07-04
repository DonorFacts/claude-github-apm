#!/usr/bin/env tsx

/**
 * Notify_Jake - Task completion notification
 * Updated to use unified host-bridge system
 */

import { hostBridge } from '../index.js';

function notifyJake() {
  // Play notification sound via host-bridge (non-blocking)
  hostBridge.audio_play_nowait('Hero.aiff');
  console.log('🔔 Task completed by Claude Code!');
}

notifyJake();