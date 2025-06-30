#!/usr/bin/env tsx

/**
 * Test utility for host-bridge system
 */

import { hostBridge } from './index.js';

async function testHostBridge() {
  console.log('🧪 Testing Host-Bridge System');
  console.log('================================');

  // Test 1: Check daemon status
  console.log('\n1. Checking daemon status...');
  const isRunning = await hostBridge.isHostDaemonRunning();
  console.log(`   Daemon running: ${isRunning ? '✅' : '❌'}`);

  if (!isRunning) {
    console.log('   Please start the daemon first:');
    console.log('   ./.local/bin/host-bridge-daemon.sh');
    return;
  }

  // Test 2: Check services configuration
  console.log('\n2. Checking services configuration...');
  try {
    const services = hostBridge.getServicesStatus();
    console.log('   Available services:');
    for (const [name, config] of Object.entries(services)) {
      console.log(`   - ${name}: ${config.enabled ? '✅' : '❌'} (${config.description})`);
    }
  } catch (error) {
    console.error('   ❌ Failed to load services config:', (error as Error).message);
    return;
  }

  // Test 3: Test VS Code opening
  console.log('\n3. Testing VS Code service...');
  const testPath = process.cwd(); // Use current directory
  try {
    const success = await hostBridge.vscode_open(testPath);
    console.log(`   VS Code open test: ${success ? '✅' : '❌'}`);
  } catch (error) {
    console.error('   ❌ VS Code test failed:', (error as Error).message);
  }

  // Test 4: Test audio service
  console.log('\n4. Testing audio service...');
  try {
    const success = await hostBridge.audio_play('Hero.aiff');
    console.log(`   Audio play test: ${success ? '✅' : '❌'}`);
  } catch (error) {
    console.error('   ❌ Audio test failed:', (error as Error).message);
  }

  // Test 5: Test speech service
  console.log('\n5. Testing speech service...');
  try {
    const success = await hostBridge.speech_say('Host bridge system is working correctly!');
    console.log(`   Speech test: ${success ? '✅' : '❌'}`);
  } catch (error) {
    console.error('   ❌ Speech test failed:', (error as Error).message);
  }

  console.log('\n🎉 Host-Bridge testing complete!');
}

// Run tests if called directly
if (require.main === module) {
  testHostBridge().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}