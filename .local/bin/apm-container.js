#!/usr/bin/env tsx
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class ApmContainer {
    constructor() {
        this.CONTAINER_NAME = 'apm-workspace';
        this.IMAGE_NAME = 'apm-claude-container:latest';
        this.DOCKERFILE_PATH = path.join(__dirname, '../../docker/claude-container/Dockerfile');
        this.HEALTH_CHECK_INTERVAL = 30; // seconds
        this.RESTART_DELAY = 5; // seconds
        this.HEALTH_START_PERIOD = 30; // seconds - increased for reliability
    }
    async main() {
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
    async ensure() {
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
        }
        else if (status === 'stopped') {
            await this.start();
        }
        else if (status === 'unhealthy') {
            await this.restart();
        }
        // Verify container is healthy
        await this.waitForHealthy();
    }
    async ensureImage() {
        // Check if image exists
        try {
            (0, child_process_1.execSync)(`docker image inspect ${this.IMAGE_NAME}`, { stdio: 'ignore' });
        }
        catch {
            console.log('🔨 Building container image...');
            (0, child_process_1.execSync)(`docker build -t ${this.IMAGE_NAME} ${path.dirname(this.DOCKERFILE_PATH)}`, {
                stdio: 'inherit'
            });
        }
    }
    isDockerAvailable() {
        try {
            (0, child_process_1.execSync)('docker info', { stdio: 'ignore' });
            return true;
        }
        catch {
            return false;
        }
    }
    findProjectRoot() {
        let current = process.cwd();
        while (current !== '/') {
            if (fs.existsSync(path.join(current, 'package.json')) &&
                fs.existsSync(path.join(current, 'apm'))) {
                return current;
            }
            // Check if we're in a worktree
            const parent = path.dirname(current);
            if (path.basename(parent) === 'worktrees') {
                return path.dirname(parent);
            }
            current = parent;
        }
        throw new Error('Could not find APM project root');
    }
    async create() {
        const projectRoot = this.findProjectRoot();
        console.log(`🐳 Creating container with project root: ${projectRoot}`);
        // Get current user UID/GID for container
        const uid = process.getuid();
        const gid = process.getgid();
        const cmd = `docker run -d \
      --name ${this.CONTAINER_NAME} \
      --restart unless-stopped \
      --user ${uid}:${gid} \
      -v "${projectRoot}:/workspace" \
      -v "${process.env.HOME}/.claude:/home/user/.claude" \
      -v "${process.env.HOME}/.zshrc:/home/user/.zshrc:ro" \
      --health-cmd "test -f /workspace/package.json" \
      --health-interval ${this.HEALTH_CHECK_INTERVAL}s \
      --health-timeout 5s \
      --health-retries 3 \
      --health-start-period ${this.HEALTH_START_PERIOD}s \
      -e APM_CONTAINERIZED=true \
      -e APM_PROJECT_ROOT=/workspace \
      -e HOME=/home/user \
      ${this.IMAGE_NAME} \
      tail -f /dev/null`;
        (0, child_process_1.execSync)(cmd, { stdio: 'inherit', shell: true });
        console.log('✅ Container created successfully');
    }
    async start() {
        console.log('🚀 Starting container...');
        (0, child_process_1.execSync)(`docker start ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
        // Wait a moment for container to initialize
        await this.sleep(2);
    }
    async stop() {
        console.log('🛑 Stopping container...');
        (0, child_process_1.execSync)(`docker stop ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
    }
    async restart() {
        console.log('🔄 Restarting container...');
        await this.stop();
        await this.sleep(this.RESTART_DELAY);
        await this.start();
    }
    async getStatus() {
        try {
            const output = (0, child_process_1.execSync)(`docker inspect -f '{{.State.Status}}' ${this.CONTAINER_NAME}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
            if (output === 'running') {
                // Check health
                const health = await this.getHealth();
                return health === 'healthy' ? 'running' : 'unhealthy';
            }
            else if (output === 'exited') {
                return 'stopped'; // Treat exited as stopped
            }
            return output;
        }
        catch {
            return 'not-found';
        }
    }
    async getHealth() {
        try {
            const output = (0, child_process_1.execSync)(`docker inspect -f '{{.State.Health.Status}}' ${this.CONTAINER_NAME}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
            return output;
        }
        catch {
            return 'unknown';
        }
    }
    async waitForHealthy() {
        const maxAttempts = 20; // Increased from 10
        const waitInterval = 3; // Increased from 2 seconds
        for (let i = 0; i < maxAttempts; i++) {
            const health = await this.getHealth();
            const status = await this.getStatus();
            if (health === 'healthy') {
                console.log('✅ Container is healthy');
                return;
            }
            // Check if container is still starting
            if (health === 'starting') {
                console.log(`⏳ Container is starting up... (${i + 1}/${maxAttempts})`);
            }
            else {
                console.log(`⏳ Waiting for container to be healthy... (${i + 1}/${maxAttempts}) [${health}]`);
            }
            await this.sleep(waitInterval);
        }
        throw new Error('Container failed to become healthy');
    }
    async exec(command) {
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
        const docker = (0, child_process_1.spawn)('docker', args, {
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
    async printStatus() {
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
    async logs() {
        (0, child_process_1.execSync)(`docker logs -f ${this.CONTAINER_NAME}`, { stdio: 'inherit' });
    }
    sleep(seconds) {
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
