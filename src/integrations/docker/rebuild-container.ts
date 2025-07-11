#!/usr/bin/env tsx

/**
 * Container Rebuild Script
 * 
 * Handles full container rebuild process:
 * 1. Stop existing container (if running)
 * 2. Remove existing container
 * 3. Rebuild Docker image
 * 4. Start new container
 * 
 * Usage: pnpm container:rebuild
 */

import { execSync } from 'child_process';
import * as path from 'path';

const CONTAINER_NAME = 'apm-workspace';
const IMAGE_NAME = 'apm-claude-container:latest';

function log(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[level];
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runCommand(command: string, description: string): void {
  try {
    log(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    log(`${description} completed`, 'success');
  } catch (error) {
    log(`Failed: ${description}`, 'error');
    throw error;
  }
}

function checkContainerExists(): boolean {
  try {
    execSync(`docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkContainerRunning(): boolean {
  try {
    execSync(`docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  log('🔄 Starting container rebuild process');
  
  try {
    // Step 1: Stop container if running
    if (checkContainerRunning()) {
      log(`Container '${CONTAINER_NAME}' is running`);
      runCommand(`docker stop ${CONTAINER_NAME}`, 'Stopping container');
    } else {
      log(`Container '${CONTAINER_NAME}' is not running`, 'info');
    }
    
    // Step 2: Remove container if exists
    if (checkContainerExists()) {
      log(`Container '${CONTAINER_NAME}' exists`);
      runCommand(`docker rm ${CONTAINER_NAME}`, 'Removing container');
    } else {
      log(`Container '${CONTAINER_NAME}' does not exist`, 'info');
    }
    
    // Step 3: Rebuild Docker image
    const dockerfilePath = path.join(__dirname, 'Dockerfile');
    
    // Find project root using same logic as apm-container
    function findProjectRoot(): string {
      let current = process.cwd();
      while (current !== '/') {
        // PRIORITY 1: Look for main/worktrees structure (this is the parent we want)
        if (require('fs').existsSync(path.join(current, 'main')) && 
            require('fs').existsSync(path.join(current, 'worktrees')) && 
            require('fs').existsSync(path.join(current, 'main', 'package.json'))) {
          return current;
        }
        current = path.dirname(current);
      }
      
      // Fallback: if no main/worktrees structure found, look for direct project structure
      current = process.cwd();
      while (current !== '/') {
        if (require('fs').existsSync(path.join(current, 'package.json'))) {
          return current;
        }
        current = path.dirname(current);
      }
      
      throw new Error('Could not find project root');
    }
    
    const buildContext = process.cwd();
    
    log(`Building image '${IMAGE_NAME}' from ${dockerfilePath}`);
    log(`Build context: ${buildContext}`);
    
    runCommand(
      `docker build -t ${IMAGE_NAME} -f "${dockerfilePath}" "${buildContext}"`,
      'Building Docker image'
    );
    
    // Step 4: Start new container
    log('Starting new container with updated image');
    runCommand(
      `tsx src/integrations/docker/apm-container.dev.ts ensure`,
      'Starting container'
    );
    
    log('🎉 Container rebuild completed successfully!', 'success');
    log(`Container '${CONTAINER_NAME}' is ready to use`);
    
  } catch (error) {
    log('Container rebuild failed', 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the rebuild process
if (require.main === module) {
  main().catch(error => {
    log('Unexpected error during rebuild', 'error');
    console.error(error);
    process.exit(1);
  });
}