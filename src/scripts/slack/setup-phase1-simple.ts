#!/usr/bin/env tsx

/**
 * APM Slack Integration Phase 1 Setup (Dependency-Free)
 * Installs dependencies before attempting to use them
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

interface SetupConfig {
  slack_bot_token?: string;
  slack_signing_secret?: string;
  webhook_port?: number;
  project_name?: string;
}

class Phase1SetupSimple {
  private config: SetupConfig = {};
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  async run(): Promise<void> {
    console.log('🚀 APM Slack Integration Phase 1 Setup');
    console.log('=====================================\n');

    try {
      await this.checkPrerequisites();
      await this.gatherConfiguration();
      await this.installDependencies();
      await this.createConfigFiles();
      await this.createSlackScripts();
      await this.showNextSteps();
      
      console.log('\n✅ Phase 1 setup complete!');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    }
  }

  async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');

    // Check if we're in an APM project
    const apmDir = path.join(this.projectRoot, 'apm');
    try {
      await fs.access(apmDir);
      console.log('  ✅ APM framework detected');
    } catch (error) {
      throw new Error('This does not appear to be an APM project (missing apm/ directory)');
    }

    // Check for package.json
    try {
      await fs.access(path.join(this.projectRoot, 'package.json'));
      console.log('  ✅ Node.js project detected');
    } catch (error) {
      throw new Error('package.json not found - ensure this is a Node.js project');
    }

    // Check for git
    try {
      execSync('git --version', { stdio: 'ignore' });
      console.log('  ✅ Git available');
    } catch (error) {
      throw new Error('Git not found - please install Git');
    }

    console.log('');
  }

  private async gatherConfiguration(): Promise<void> {
    console.log('⚙️ Configuration Setup');
    console.log('This setup requires a Slack Bot Token and optional Signing Secret.');
    console.log('Visit https://api.slack.com/apps to create a Slack app if needed.\n');

    // Check environment variables first
    this.config.slack_bot_token = process.env.SLACK_BOT_TOKEN;
    this.config.slack_signing_secret = process.env.SLACK_SIGNING_SECRET;
    this.config.webhook_port = parseInt(process.env.SLACK_WEBHOOK_PORT || '3000');

    if (!this.config.slack_bot_token) {
      console.log('⚠️  SLACK_BOT_TOKEN not found in environment variables');
      console.log('   Please set SLACK_BOT_TOKEN or update .slack-config.json after setup');
    } else {
      console.log('  ✅ SLACK_BOT_TOKEN found in environment');
    }

    // Detect project name from git or directory
    try {
      const gitRemote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = gitRemote.match(/[\/:]([^\/]+?)(?:\\.git)?$/);
      this.config.project_name = match ? match[1] : path.basename(this.projectRoot);
    } catch (error) {
      this.config.project_name = path.basename(this.projectRoot);
    }

    console.log(`  📁 Project name: ${this.config.project_name}`);
    console.log('');
  }

  async installDependencies(): Promise<{ skipped?: boolean }> {
    console.log('📦 Installing dependencies...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    const requiredDeps = [
      '@slack/web-api',
      'express',
      'node-fetch'
    ];

    const requiredDevDeps = [
      '@types/express',
      '@types/node'
    ];

    let needsInstall = false;
    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    // Check required dependencies
    for (const dep of requiredDeps) {
      if (!dependencies[dep]) {
        console.log(`  📦 Will install: ${dep}`);
        needsInstall = true;
      }
    }

    for (const dep of requiredDevDeps) {
      if (!devDependencies[dep]) {
        console.log(`  📦 Will install: ${dep} (dev)`);
        needsInstall = true;
      }
    }

    if (needsInstall) {
      try {
        console.log('  🔄 Installing packages...');
        execSync(`pnpm add ${requiredDeps.join(' ')}`, { stdio: 'inherit' });
        execSync(`pnpm add -D ${requiredDevDeps.join(' ')}`, { stdio: 'inherit' });
        console.log('  ✅ Dependencies installed');
      } catch (error) {
        throw new Error('Failed to install dependencies. Please run manually: pnpm add @slack/web-api express node-fetch');
      }
    } else {
      console.log('  ✅ All dependencies already installed');
    }

    console.log('');
    return { skipped: !needsInstall };
  }

  async createConfigFiles(): Promise<void> {
    console.log('📄 Creating configuration files...');

    // Create Slack configuration
    const configPath = path.join(this.projectRoot, '.slack-config.json');
    const slackConfig = {
      bot_token: this.config.slack_bot_token || "your-slack-bot-token-here",
      signing_secret: this.config.slack_signing_secret || "your-slack-signing-secret-here",
      port: this.config.webhook_port || 3000,
      webhook_path: "/webhook/status",
      project: this.config.project_name
    };

    await fs.writeFile(configPath, JSON.stringify(slackConfig, null, 2));
    console.log(`  ✅ Created ${path.basename(configPath)}`);

    // Create example environment file
    const envExamplePath = path.join(this.projectRoot, '.env.slack.example');
    const envExample = `# APM Slack Integration Configuration
# Copy to .env and update with your values

SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_SIGNING_SECRET=your-slack-signing-secret-here
SLACK_WEBHOOK_PORT=3000

# Optional: Default project name
DEFAULT_PROJECT_NAME=${this.config.project_name}
`;

    await fs.writeFile(envExamplePath, envExample);
    console.log(`  ✅ Created ${path.basename(envExamplePath)}`);

    // Update .gitignore
    await this.updateGitignore();

    console.log('');
  }

  private async updateGitignore(): Promise<void> {
    try {
      const gitignorePath = path.join(this.projectRoot, '.gitignore');
      let gitignoreContent = '';
      
      try {
        gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      } catch (error) {
        // .gitignore doesn't exist, will create
      }

      if (!gitignoreContent.includes('.slack-config.json')) {
        gitignoreContent += '\n# Slack configuration\n.slack-config.json\n.cc-slack-config.json\n';
        await fs.writeFile(gitignorePath, gitignoreContent);
        console.log('  ✅ Updated .gitignore');
      }
    } catch (error) {
      console.log('  ⚠️  Could not update .gitignore');
    }
  }

  async createSlackScripts(): Promise<void> {
    console.log('📝 Creating startup scripts...');

    // Create simplified start script that doesn't import Slack libraries immediately
    const startScriptPath = path.join(this.projectRoot, 'start-slack-coordinator.sh');
    const startScript = `#!/bin/bash

# APM Slack Coordinator Startup Script
# Usage: ./start-slack-coordinator.sh

echo "🚀 Starting APM Slack Coordinator..."

# Check for configuration
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json not found"
    echo "   Please update .slack-config.json with your Slack bot token"
    exit 1
fi

# Check for SLACK_BOT_TOKEN in config
BOT_TOKEN=$(grep -o '"bot_token": *"[^"]*"' .slack-config.json | cut -d'"' -f4)
if [ "$BOT_TOKEN" = "your-slack-bot-token-here" ]; then
    echo "❌ Please update .slack-config.json with your actual Slack bot token"
    echo "   Get your token from https://api.slack.com/apps"
    exit 1
fi

# Start webhook server
echo "🔗 Starting webhook server..."
tsx src/scripts/slack/webhook-server.ts &
WEBHOOK_PID=$!

echo "✅ Slack coordination system running"
echo "   Webhook server PID: $WEBHOOK_PID"
echo "   Use Ctrl+C to stop"

# Wait for webhook server
wait $WEBHOOK_PID
`;

    await fs.writeFile(startScriptPath, startScript);
    await fs.chmod(startScriptPath, 0o755);
    console.log(`  ✅ Created ${path.basename(startScriptPath)}`);

    // Create a simple test script
    const testScriptPath = path.join(this.projectRoot, 'test-slack-setup.sh');
    const testScript = `#!/bin/bash

# Test APM Slack Integration Setup
echo "🧪 Testing Slack setup..."

# Check config file
if [ ! -f ".slack-config.json" ]; then
    echo "❌ .slack-config.json missing"
    exit 1
fi

# Check if dependencies are installed
if ! pnpm list @slack/web-api > /dev/null 2>&1; then
    echo "❌ @slack/web-api not installed"
    exit 1
fi

# Check if scripts exist
if [ ! -f "src/scripts/slack/webhook-server.ts" ]; then
    echo "❌ webhook-server.ts missing"
    exit 1
fi

echo "✅ Basic setup validation passed"
echo "   Next: Update .slack-config.json with your bot token"
echo "   Then: ./start-slack-coordinator.sh"
`;

    await fs.writeFile(testScriptPath, testScript);
    await fs.chmod(testScriptPath, 0o755);
    console.log(`  ✅ Created ${path.basename(testScriptPath)}`);

    console.log('');
  }

  private async showNextSteps(): Promise<void> {
    console.log('🎯 Next Steps');
    console.log('=============');

    if (!this.config.slack_bot_token || this.config.slack_bot_token === "your-slack-bot-token-here") {
      console.log('\n1. Configure Slack Bot Token:');
      console.log('   • Visit https://api.slack.com/apps');
      console.log('   • Create a new app or use existing');
      console.log('   • Get Bot User OAuth Token (starts with xoxb-)');
      console.log('   • Update .slack-config.json with your token');
      console.log('   • Or set SLACK_BOT_TOKEN environment variable');
    }

    console.log('\n2. Test the setup:');
    console.log('   ./test-slack-setup.sh');

    console.log('\n3. Start the coordination system:');
    console.log('   ./start-slack-coordinator.sh');

    console.log('\n4. Connect Claude Code instances:');
    console.log('   # In any CC terminal');
    console.log(`   tsx src/scripts/slack/cc-adapter.ts connect ${this.config.project_name} <role>`);
    console.log('   # Example: tsx src/scripts/slack/cc-adapter.ts connect myproject frontend');

    console.log('\n5. Create Slack channels (after configuring token):');
    console.log('   tsx src/scripts/slack/channel-manager.ts setup-meta');
    console.log(`   tsx src/scripts/slack/channel-manager.ts setup-project ${this.config.project_name}`);

    console.log('\n📚 Documentation:');
    console.log('   docs/slack-integration-guide.md');
    console.log('   src/scripts/slack/README.md');
  }
}

// Main execution
async function main() {
  const setup = new Phase1SetupSimple();
  await setup.run();
}

if (require.main === module) {
  main();
}

export { Phase1SetupSimple };