#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createCommandFiles } = require('../src/utilities/command-processing/prompt-builder.ts');

const command = process.argv[2];
const args = process.argv.slice(3);

const scriptsDir = path.join(__dirname, '..', 'scripts');

function showHelp() {
  console.log(`
Claude GitHub APM Framework CLI

Usage: claude-github-apm <command> [args...]

Commands:
  add-issues <org> <project_num> <issue_numbers_or_urls...>
    Add specific issues to a GitHub project
    
  add-issues-simple
    Add all open issues from current repo to hardcoded project
    
  create-sub-issue <parent_issue> <child_issue>
    Create sub-issue relationship between two issues
    
  init
    Initialize .claude directory structure in current project
    
  help
    Show this help message

Examples:
  claude-github-apm add-issues DonorFacts 1 42 43 44
  claude-github-apm add-issues-simple
  claude-github-apm create-sub-issue 26 30
  claude-github-apm init
`);
}

function initProject() {
  const templatesDir = path.join(__dirname, '..', 'templates');
  const targetDir = path.join(process.cwd(), '.claude');
  const packageRoot = path.join(__dirname, '..');
  
  // Create .claude directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    try {
      // Copy template directory
      execSync(`cp -r "${templatesDir}/.claude" "${targetDir}"`, { stdio: 'inherit' });
      console.log('✓ Initialized .claude directory structure');
    } catch (error) {
      console.error('❌ Failed to initialize .claude directory:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✓ .claude directory already exists');
  }
  
  // Create command files for APM prompts
  createCommandFiles(process.cwd(), packageRoot);
}

function runScript(scriptName, scriptArgs = []) {
  const scriptPath = path.join(scriptsDir, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script not found: ${scriptName}`);
    process.exit(1);
  }
  
  try {
    execSync(`"${scriptPath}" ${scriptArgs.join(' ')}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error(`❌ Script failed: ${scriptName}`);
    process.exit(1);
  }
}

switch (command) {
  case 'add-issues':
    if (args.length < 3) {
      console.error('Usage: claude-github-apm add-issues <org> <project_num> <issue_numbers_or_urls...>');
      process.exit(1);
    }
    runScript('add-issues-to-project.sh', args);
    break;
    
  case 'add-issues-simple':
    runScript('add-issues-simple.sh');
    break;
    
  case 'create-sub-issue':
    if (args.length < 2) {
      console.error('Usage: claude-github-apm create-sub-issue <parent_issue> <child_issue>');
      process.exit(1);
    }
    runScript('create-sub-issue.sh', args);
    break;
    
  case 'init':
    initProject();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    if (!command) {
      showHelp();
    } else {
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
    }
}