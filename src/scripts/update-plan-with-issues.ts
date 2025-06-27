#!/usr/bin/env ts-node

import * as fs from 'fs';
import { execSync } from 'child_process';

interface IssueInfo {
  number: number;
  title: string;
  body: string;
}

function updateImplementationPlan(planPath: string) {
  console.log('🔄 Updating Implementation Plan with GitHub issue numbers...');
  
  // Get all issues from GitHub
  console.log('📥 Fetching issues from GitHub...');
  const issuesJson = execSync(
    'gh issue list --limit 150 --json number,title,body --state all',
    { encoding: 'utf-8' }
  );
  const issues = JSON.parse(issuesJson) as IssueInfo[];
  
  // Create a map of title to issue number
  const issueMap = new Map<string, number>();
  
  for (const issue of issues) {
    // Clean up the title for matching
    const cleanTitle = issue.title.trim().replace(/\.$/, '');
    issueMap.set(cleanTitle, issue.number);
    
    // Also try without trailing periods
    issueMap.set(issue.title.trim(), issue.number);
  }
  
  console.log(`Found ${issueMap.size} unique issues`);
  
  // Read the Implementation Plan
  let content = fs.readFileSync(planPath, 'utf-8');
  const lines = content.split('\n');
  
  let updated = 0;
  const updatedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains a task/story/epic/etc. that needs an issue number
    const itemMatch = line.match(/^(\s*-\s+)(Phase|Project|Epic|Feature|Story|Task|Bug|Doc):\s+(.+?)(\s*\[#\d+\])?$/);
    
    if (itemMatch) {
      const prefix = itemMatch[1];
      const itemType = itemMatch[2];
      const title = itemMatch[3].trim();
      const existingIssue = itemMatch[4];
      
      if (!existingIssue) {
        // Try to find the issue number
        const issueNumber = issueMap.get(title) || issueMap.get(title.replace(/\.$/, ''));
        
        if (issueNumber) {
          // Add the issue number to the line
          updatedLines.push(`${prefix}${itemType}: ${title} [#${issueNumber}]`);
          updated++;
          console.log(`✅ Updated "${title}" with issue #${issueNumber}`);
        } else {
          // No issue found, keep the line as is
          updatedLines.push(line);
          console.log(`⚠️  No issue found for: ${title}`);
        }
      } else {
        // Already has an issue number, keep as is
        updatedLines.push(line);
      }
    } else {
      // Not a line we're interested in, keep as is
      updatedLines.push(line);
    }
  }
  
  // Write the updated content back
  if (updated > 0) {
    fs.writeFileSync(planPath, updatedLines.join('\n'));
    console.log(`\n✅ Updated ${updated} items in ${planPath}`);
  } else {
    console.log('\n✅ All items already have issue numbers or no matches found');
  }
  
  // Report any items without issue numbers
  const finalContent = fs.readFileSync(planPath, 'utf-8');
  const missingIssues = finalContent.match(/^(\s*-\s+)(Phase|Project|Epic|Feature|Story|Task|Bug|Doc):\s+(.+?)$/gm);
  
  if (missingIssues) {
    console.log(`\n⚠️  ${missingIssues.length} items still without issue numbers`);
  } else {
    console.log('\n✅ All items now have issue numbers!');
  }
}

// Run if called directly
if (require.main === module) {
  const planPath = process.argv[2] || 'apm/Implementation_Plan.md';
  try {
    updateImplementationPlan(planPath);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}