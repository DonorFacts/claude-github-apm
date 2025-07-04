#!/usr/bin/env tsx

/**
 * APM Container Development Tool
 * 
 * This tool provides advanced container management and debugging capabilities
 * beyond the simple bash wrapper used for daily development.
 * 
 * USAGE:
 *   npm run container:status  # Check container health and status
 *   npm run container:start   # Start container manually
 *   npm run container:stop    # Stop container
 *   npm run container:bash    # Open interactive shell in container
 *   
 * DEBUGGING:
 *   tsx src/scripts/docker/apm-container.dev.ts status  # Detailed status
 *   tsx src/scripts/docker/apm-container.dev.ts logs    # Container logs
 *   tsx src/scripts/docker/apm-container.dev.ts ensure  # Force health check
 * 
 * Note: For normal development, use `pnpm claude` which uses the simpler
 * bash wrapper (.local/bin/claude-container) for better performance.
 * This tool is for when you need advanced container management.
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface ContainerConfig {
  name: string;
  image: string;
  projectRoot: string;
  status: 'running' | 'stopped' | 'not-found' | 'unhealthy';
}

class ApmContainer {
  private readonly CONTAINER_NAME = 'apm-workspace';
  private readonly IMAGE_NAME = 'apm-claude-container:latest';
  private readonly DOCKERFILE_PATH = path.join(__dirname, '../../docker/claude-container/Dockerfile');
  private readonly HEALTH_CHECK_INTERVAL = 30; // seconds
  private readonly RESTART_DELAY = 5; // seconds
  private readonly HEALTH_START_PERIOD = 30; // seconds - increased for reliability
  
  async main(): Promise<void> {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    switch (command) {
      case 'ensure':
        await this.ensure();
        break;
      case 'exec':
        await this.exec(args);
        break;
      case 'start':
        await this.start();
        break;
      case 'stop':
        await this.stop();
        break;
      case 'status':
        await this.printStatus();
        break;
      case 'logs':
        await this.logs();
        break;
      case 'shell':
        await this.exec(['bash']);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Usage: apm-container.ts [ensure|exec|start|stop|status|logs|shell]');
        process.exit(1);
    }
  }
  
  async ensure(): Promise<void> {
    // Check Docker availability first
    if (!this.isDockerAvailable()) {
      console.error('❌ Docker not found or not running');
      console.error('Please install Docker Desktop and ensure it\'s running');
      process.exit(1);
    }
    
    // Build image if needed
    await this.ensureImage();
    
    // Check container status
    const status = await this.getStatus();
    
    if (status === 'not-found') {
      await this.create();
    } else if (status === 'stopped') {
      await this.start();
    } else if (status === 'unhealthy') {
      await this.restart();
    }
    
    // Verify container is healthy
    await this.waitForHealthy();
  }
  
  private async ensureImage(): Promise<void> {
    // Check if image exists
    try {
      execSync(`docker image inspect ${this.IMAGE_NAME}`, { stdio: 'ignore' });
    } catch {
      console.log('🔨 Building container image...');
      execSync(`docker build -t ${this.IMAGE_NAME} ${path.dirname(this.DOCKERFILE_PATH)}`, {
        stdio: 'inherit'
      });
    }
  }
  
  private isDockerAvailable(): boolean {
    try {
      execSync('docker info', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
  
  private findProjectRoot(): string {
    let current = process.cwd();
    while (current !== '/') {
      // PRIORITY 1: Look for main/worktrees structure (this is the parent we want)
      if (fs.existsSync(path.join(current, 'main')) && 
          fs.existsSync(path.join(current, 'worktrees')) && 
          fs.existsSync(path.join(current, 'main', 'package.json')) && 
          fs.existsSync(path.join(current, 'main', 'apm'))) {
        return current;
      }
      
      current = path.dirname(current);
    }
    
    // Fallback: if no main/worktrees structure found, look for direct project structure
    current = process.cwd();
    while (current !== '/') {
      if (fs.existsSync(path.join(current, 'package.json')) &&
          fs.existsSync(path.join(current, 'apm'))) {
        return current;
      }
      current = path.dirname(current);
    }
    
    throw new Error('Could not find APM project root');
  }
  
  async create(): Promise<void> {
    const projectRoot = this.findProjectRoot();
    console.log(`🐳 Creating container with project root: ${projectRoot}`);
    
    // Get current user UID/GID for container
    const uid = process.getuid?.() ?? 1000;
    const gid = process.getgid?.() ?? 1000;
    
    const cmd = `docker run -d \
      --name ${this.CONTAINER_NAME} \
      --restart unless-stopped \
      --user ${uid}:${gid} \
      -v "${projectRoot}:/workspace" \
      -v "${process.env.HOME}/.claude:/home/user/.claude" \
      -v "${process.env.HOME}/.zshrc:/home/user/.zshrc:ro" \
      -e APM_CONTAINERIZED=true \
      -e APM_PROJECT_ROOT=/workspace \
      -e HOME=/home/user \
      ${this.IMAGE_NAME} \
      tail -f /dev/null`;
    
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Container created successfully');
  }
  
  async start(): Promise<void> {
    console.log('🚀 Starting container...');
    execSync(`docker start ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
    // Wait a moment for container to initialize
    await this.sleep(2);
  }
  
  async stop(): Promise<void> {
    console.log('🛑 Stopping container...');
    execSync(`docker stop ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
  }
  
  async restart(): Promise<void> {
    console.log('🔄 Restarting container...');
    await this.stop();
    await this.sleep(this.RESTART_DELAY);
    await this.start();
  }
  
  async getStatus(): Promise<string> {
    try {
      const output = execSync(
        `docker inspect -f '{{.State.Status}}' ${this.CONTAINER_NAME}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      
      if (output === 'running') {
        // If no health check configured, just return running
        const health = await this.getHealth();
        if (health === 'unknown' || health === '') {
          return 'running';
        }
        // Otherwise check health status
        return health === 'healthy' ? 'running' : 'unhealthy';
      } else if (output === 'exited') {
        return 'stopped';  // Treat exited as stopped
      }
      return output as any;
    } catch {
      return 'not-found';
    }
  }
  
  async getHealth(): Promise<string> {
    try {
      const output = execSync(
        `docker inspect -f '{{.State.Health.Status}}' ${this.CONTAINER_NAME}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      return output;
    } catch {
      return 'unknown';
    }
  }
  
  async waitForHealthy(): Promise<void> {
    const health = await this.getHealth();
    
    // If no health check is configured, just verify container is running
    if (health === 'unknown' || health === '') {
      const status = await this.getStatus();
      if (status === 'running') {
        console.log('✅ Container is running (no health check configured)');
        return;
      } else {
        throw new Error(`Container is not running: ${status}`);
      }
    }
    
    // Otherwise wait for health check
    const maxAttempts = 30;
    const waitInterval = 2;
    
    for (let i = 0; i < maxAttempts; i++) {
      const currentHealth = await this.getHealth();
      
      if (currentHealth === 'healthy') {
        console.log('✅ Container is healthy');
        return;
      }
      
      if (currentHealth === 'starting') {
        console.log(`⏳ Container is starting up... (${i + 1}/${maxAttempts})`);
      } else {
        console.log(`⏳ Waiting for container to be healthy... (${i + 1}/${maxAttempts}) [${currentHealth}]`);
      }
      
      await this.sleep(waitInterval);
    }
    throw new Error('Container failed to become healthy');
  }
  
  async exec(command: string[]): Promise<void> {
    // Ensure container is ready
    await this.ensure();
    
    // Get working directory
    const projectRoot = this.findProjectRoot();
    const relativePath = path.relative(projectRoot, process.cwd());
    const workDir = path.join('/workspace', relativePath);
    
    // Determine if we need interactive mode
    const isInteractive = process.stdin.isTTY && process.stdout.isTTY;
    const execFlags = isInteractive ? ['-it'] : [];
    
    // Execute command in container
    const args = [
      'exec',
      ...execFlags,
      '-w', workDir,
      '-e', `APM_AGENT_ROLE=${process.env.APM_AGENT_ROLE || 'developer'}`,
      '-e', `APM_WORKTREE_NAME=${path.basename(process.cwd())}`,
      '-e', 'PATH=/workspace/.local/bin:/workspace/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
      this.CONTAINER_NAME,
      ...command
    ];
    
    // Use spawn for all commands
    const docker = spawn('docker', args, {
      stdio: 'inherit',
      shell: false
    });
    
    docker.on('exit', (code) => {
      process.exit(code || 0);
    });
    
    docker.on('error', (err) => {
      console.error('Error executing command:', err.message);
      process.exit(1);
    });
  }
  
  async printStatus(): Promise<void> {
    const status = await this.getStatus();
    const health = status === 'running' ? await this.getHealth() : 'n/a';
    
    console.log(`Container: ${this.CONTAINER_NAME}`);
    console.log(`Status: ${status}`);
    console.log(`Health: ${health}`);
    
    if (status === 'running') {
      // Show active sessions (simplified for now)
      console.log('\nProject root mounted at: /workspace');
    }
  }
  
  async logs(): Promise<void> {
    execSync(`docker logs -f ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
  }
  
  private sleep(seconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
}

// Run the container manager
if (require.main === module) {
  const container = new ApmContainer();
  container.main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}