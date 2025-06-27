#!/usr/bin/env tsx

import * as path from 'path';
import { GitHubClient } from '../tools/bulk-issue-creator/GitHubClient';
import { IssueTypeDiscoveryService } from '../tools/issue-type-config/IssueTypeDiscoveryService';
import { IssueTypeConfigManager } from '../tools/issue-type-config/IssueTypeConfigManager';

async function main() {
  try {
    console.log('🔍 Discovering GitHub issue templates...');
    
    // Initialize services
    const githubClient = new GitHubClient();
    const discoveryService = new IssueTypeDiscoveryService(githubClient);
    const configManager = new IssueTypeConfigManager(
      path.join(process.cwd(), 'apm', 'issue-types.json')
    );
    
    // Get repository info from git remote
    const { execSync } = require('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    
    if (!match) {
      throw new Error('Could not determine repository from git remote');
    }
    
    const owner = match[1];
    const repo = match[2];
    
    console.log(`📍 Repository: ${owner}/${repo}`);
    
    // Discover issue types
    const issueTypes = await discoveryService.discoverIssueTypes(owner, repo);
    
    if (Object.keys(issueTypes).length === 0) {
      console.log('⚠️  No issue templates found in this repository');
      console.log('   Make sure you have issue templates configured in your GitHub repository');
      return;
    }
    
    console.log('✅ Found issue templates:');
    for (const [type, id] of Object.entries(issueTypes)) {
      console.log(`   ${type}: ${id}`);
    }
    
    // Save to config file
    await configManager.saveConfig(issueTypes);
    console.log(`💾 Saved configuration to: ${configManager.getConfigPath()}`);
    
    console.log('\n🎉 Issue type discovery completed!');
    console.log('   You can now use these types for bulk issue creation or single issue creation');
    
  } catch (error) {
    console.error('❌ Error discovering issue types:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();