/**
 * Tests for Phase 1 Setup Script
 * Following TDD workflow - write tests first, then implementation
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

describe('Phase1Setup', () => {
  const testProjectRoot = '/tmp/test-apm-setup';
  
  beforeEach(async () => {
    // Create test environment
    await fs.mkdir(testProjectRoot, { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, 'apm'), { recursive: true });
    
    // Create minimal package.json
    const packageJson = {
      name: 'test-apm-project',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    };
    await fs.writeFile(
      path.join(testProjectRoot, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    // Initialize git
    process.chdir(testProjectRoot);
    execSync('git init', { stdio: 'ignore' });
  });

  afterEach(async () => {
    // Cleanup test environment
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  });

  describe('checkPrerequisites', () => {
    it('should_pass_when_apm_directory_exists', async () => {
      // Prerequisites check should pass with apm/ directory
      const setup = new Phase1Setup();
      await expect(setup.checkPrerequisites()).resolves.not.toThrow();
    });

    it('should_fail_when_apm_directory_missing', async () => {
      // Remove apm directory
      await fs.rm(path.join(testProjectRoot, 'apm'), { recursive: true });
      
      const setup = new Phase1Setup();
      await expect(setup.checkPrerequisites()).rejects.toThrow('missing apm/ directory');
    });

    it('should_fail_when_package_json_missing', async () => {
      // Remove package.json
      await fs.rm(path.join(testProjectRoot, 'package.json'));
      
      const setup = new Phase1Setup();
      await expect(setup.checkPrerequisites()).rejects.toThrow('package.json not found');
    });
  });

  describe('installDependencies', () => {
    it('should_install_required_slack_dependencies', async () => {
      const setup = new Phase1Setup();
      await setup.installDependencies();
      
      // Verify package.json was updated
      const packageJson = JSON.parse(
        await fs.readFile(path.join(testProjectRoot, 'package.json'), 'utf-8')
      );
      
      expect(packageJson.dependencies).toHaveProperty('@slack/web-api');
      expect(packageJson.dependencies).toHaveProperty('express');
      expect(packageJson.dependencies).toHaveProperty('node-fetch');
      expect(packageJson.devDependencies).toHaveProperty('@types/express');
    });

    it('should_skip_install_when_dependencies_exist', async () => {
      // Pre-populate dependencies
      const packageJson = {
        name: 'test-project',
        dependencies: {
          '@slack/web-api': '^6.0.0',
          'express': '^4.0.0',
          'node-fetch': '^3.0.0'
        },
        devDependencies: {
          '@types/express': '^4.0.0',
          '@types/node': '^20.0.0'
        }
      };
      await fs.writeFile(
        path.join(testProjectRoot, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );
      
      const setup = new Phase1Setup();
      const result = await setup.installDependencies();
      
      expect(result.skipped).toBe(true);
    });
  });

  describe('createConfigFiles', () => {
    it('should_create_slack_config_with_default_values', async () => {
      const setup = new Phase1Setup();
      await setup.createConfigFiles();
      
      const configPath = path.join(testProjectRoot, '.slack-config.json');
      const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
      
      expect(config).toHaveProperty('bot_token');
      expect(config).toHaveProperty('signing_secret');
      expect(config).toHaveProperty('port', 3000);
      expect(config).toHaveProperty('webhook_path', '/webhook/status');
    });

    it('should_create_executable_start_script', async () => {
      const setup = new Phase1Setup();
      await setup.createConfigFiles();
      
      const scriptPath = path.join(testProjectRoot, 'start-slack-coordinator.sh');
      const stats = await fs.stat(scriptPath);
      
      expect(stats.mode & 0o111).toBeTruthy(); // Check execute permissions
    });

    it('should_update_gitignore_with_config_files', async () => {
      const setup = new Phase1Setup();
      await setup.createConfigFiles();
      
      const gitignoreContent = await fs.readFile(
        path.join(testProjectRoot, '.gitignore'), 
        'utf-8'
      );
      
      expect(gitignoreContent).toContain('.slack-config.json');
      expect(gitignoreContent).toContain('.cc-slack-config.json');
    });
  });

  describe('setupSlackChannels', () => {
    it('should_skip_channel_setup_without_token', async () => {
      const setup = new Phase1Setup();
      const result = await setup.setupSlackChannels();
      
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('token');
    });

    it('should_create_channels_with_valid_token', async () => {
      // Mock Slack API
      const mockSlack = {
        conversations: {
          list: jest.fn().mockResolvedValue({ channels: [] }),
          create: jest.fn().mockResolvedValue({ ok: true, channel: { id: 'C123' } })
        }
      };
      
      const setup = new Phase1Setup();
      setup.setSlackClient(mockSlack);
      
      const result = await setup.setupSlackChannels('test-project');
      
      expect(result.channelsCreated).toBeGreaterThan(0);
      expect(mockSlack.conversations.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'proj-test-project-dashboard'
        })
      );
    });
  });

  describe('complete setup flow', () => {
    it('should_run_complete_setup_without_errors', async () => {
      // Mock external dependencies
      process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
      
      const setup = new Phase1Setup();
      await expect(setup.run()).resolves.not.toThrow();
      
      // Verify all expected files were created
      const expectedFiles = [
        '.slack-config.json',
        'start-slack-coordinator.sh',
        '.env.slack.example',
        '.gitignore'
      ];
      
      for (const file of expectedFiles) {
        await expect(fs.access(path.join(testProjectRoot, file))).resolves.not.toThrow();
      }
    });
  });
});

// Placeholder for Phase1Setup class - will implement after tests
class Phase1Setup {
  async checkPrerequisites(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  async installDependencies(): Promise<{ skipped?: boolean }> {
    throw new Error('Not implemented');
  }
  
  async createConfigFiles(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  async setupSlackChannels(projectName?: string): Promise<{ skipped?: boolean; reason?: string; channelsCreated?: number }> {
    throw new Error('Not implemented');
  }
  
  async run(): Promise<void> {
    throw new Error('Not implemented');
  }
  
  setSlackClient(client: any): void {
    throw new Error('Not implemented');
  }
}