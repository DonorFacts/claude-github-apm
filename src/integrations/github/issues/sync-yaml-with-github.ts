#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';
import { ImplementationPlan, PlanItem } from '../api/types';

async function syncYamlWithGitHub(yamlPath: string) {
  console.log('🔄 Syncing YAML with GitHub issues...');
  
  // Load the YAML file
  const content = fs.readFileSync(yamlPath, 'utf-8');
  const plan = yaml.load(content) as ImplementationPlan;
  
  // Get all issues from GitHub with our plan IDs
  console.log('📥 Fetching issues from GitHub...');
  const issuesJson = execSync(
    'gh issue list --limit 150 --json number,title,body,id --state all',
    { encoding: 'utf-8' }
  );
  const issues = JSON.parse(issuesJson);
  
  // Create a map of plan ID to issue data
  const issueMap = new Map<string, { number: number; id: string }>();
  
  for (const issue of issues) {
    // Extract plan ID from body
    const planIdMatch = issue.body?.match(/\*Plan ID: ([^*]+)\*/);
    if (planIdMatch) {
      const planId = planIdMatch[1].trim();
      issueMap.set(planId, { number: issue.number, id: issue.id });
    }
  }
  
  console.log(`Found ${issueMap.size} issues with plan IDs`);
  
  // Update plan items with issue numbers
  let updated = 0;
  for (const item of plan.items) {
    const issueData = issueMap.get(item.id);
    if (issueData && !item.issue_number) {
      item.issue_number = issueData.number;
      item.github_id = issueData.id;
      updated++;
      console.log(`✅ Updated ${item.id} with issue #${issueData.number}`);
    }
  }
  
  // Save the updated YAML
  if (updated > 0) {
    const updatedYaml = yaml.dump(plan, {
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
    fs.writeFileSync(yamlPath, updatedYaml);
    console.log(`\n✅ Updated ${updated} items in ${yamlPath}`);
  } else {
    console.log('\n✅ All items already have issue numbers');
  }
  
  // Report statistics
  const totalItems = plan.items.length;
  const itemsWithIssues = plan.items.filter((item: PlanItem) => item.issue_number).length;
  const itemsWithoutIssues = totalItems - itemsWithIssues;
  
  console.log('\n📊 Statistics:');
  console.log(`   Total items: ${totalItems}`);
  console.log(`   With issues: ${itemsWithIssues}`);
  console.log(`   Without issues: ${itemsWithoutIssues}`);
  
  if (itemsWithoutIssues > 0) {
    console.log('\n⚠️  Items without issues:');
    for (const item of plan.items) {
      if (!item.issue_number) {
        console.log(`   - ${item.id}: ${item.title}`);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const yamlPath = process.argv[2] || 'apm/Implementation_Plan.yaml';
  syncYamlWithGitHub(yamlPath).catch(console.error);
}