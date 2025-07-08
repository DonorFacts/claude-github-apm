#!/usr/bin/env tsx

/**
 * Validates that Claude Code is running in Docker container mode
 * Required before creating any worktrees
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

function validateContainerEnvironment(): boolean {
  console.log(chalk.blue('🔍 Validating container environment...'));
  
  // Check APM_CONTAINERIZED environment variable
  const isContainerized = process.env.APM_CONTAINERIZED;
  
  if (!isContainerized || isContainerized !== 'true') {
    console.log(chalk.red('❌ FAILED: APM_CONTAINERIZED is not set to "true"'));
    console.log(chalk.yellow('💡 This script requires Claude Code to be running in Docker container mode'));
    console.log(chalk.yellow('   Please start Claude Code in container mode and try again'));
    return false;
  }
  
  console.log(chalk.green('✅ Container environment validated'));
  console.log(chalk.dim(`   APM_CONTAINERIZED: ${isContainerized}`));
  
  // Additional container checks
  try {
    // Check if we're actually in a container (common indicators)
    const hostname = execSync('hostname', { encoding: 'utf8' }).trim();
    const hasDockerEnv = require('fs').existsSync('/.dockerenv');
    
    console.log(chalk.dim(`   Container hostname: ${hostname}`));
    console.log(chalk.dim(`   Docker environment file: ${hasDockerEnv ? 'present' : 'absent'}`));
    
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️  Warning: Could not verify container details, but APM_CONTAINERIZED is set'));
    return true;
  }
}

// Run validation
const isValid = validateContainerEnvironment();
process.exit(isValid ? 0 : 1);