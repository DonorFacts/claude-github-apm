#!/usr/bin/env tsx

import * as path from 'path';
import { GitHubClient } from '../tools/bulk-issue-creator/GitHubClient';
import { SingleIssueCreator } from '../tools/issue-type-config/SingleIssueCreator';
import { IssueTypeConfigManager } from '../tools/issue-type-config/IssueTypeConfigManager';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: tsx scripts/create-single-issue.ts <type> <title> <body>');
    console.log('');
    console.log('Example:');
    console.log('  tsx scripts/create-single-issue.ts task "Fix login bug" "The login form is not validating properly"');
    console.log('');
    console.log('To see available types, run:');
    console.log('  tsx scripts/discover-issue-types.ts');
    process.exit(1);
  }
  
  const [type, title, body] = args;
  
  try {
    console.log('🎯 Creating single issue...');
    
    // Initialize services
    const githubClient = new GitHubClient();
    const configManager = new IssueTypeConfigManager(
      path.join(process.cwd(), 'apm', 'issue-types.json')
    );
    const issueCreator = new SingleIssueCreator(githubClient, configManager);
    
    // Check if config exists
    if (!configManager.configExists()) {
      console.error('❌ No issue types configuration found');
      console.log('   Run: tsx scripts/discover-issue-types.ts');
      process.exit(1);
    }
    
    // Get repository info
    const { execSync } = require('child_process');
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    
    if (!match) {
      throw new Error('Could not determine repository from git remote');
    }
    
    const owner = match[1];
    const repo = match[2];
    
    console.log(`📍 Repository: ${owner}/${repo}`);
    console.log(`🏷️  Type: ${type}`);
    console.log(`📝 Title: ${title}`);
    
    // List available types first
    const availableTypes = await issueCreator.listAvailableTypes();
    console.log(`🔧 Available types: ${availableTypes.join(', ')}`);
    
    // Create the issue
    const issue = await issueCreator.createIssue({
      title,
      body,
      type,
      owner,
      repo
    });
    
    console.log('✅ Issue created successfully!');
    console.log(`   #${issue.number}: ${issue.title || title}`);
    if (issue.url) {
      console.log(`   URL: ${issue.url}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating issue:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();