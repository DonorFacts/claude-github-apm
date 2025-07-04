#!/usr/bin/env tsx

/**
 * Create sub-issue relationship between two issues
 * Usage: tsx src/integrations/github/automation/create-sub-issue.ts <child_node_id> <parent_node_id>
 */

import { execSync } from 'child_process';
import { logError, logInfo } from '../../../utilities/common/common';

function main() {
  const childId = process.argv[2];
  const parentId = process.argv[3];

  if (!childId || !parentId) {
    logError('Usage: tsx src/scripts/github/create-sub-issue.ts <child_node_id> <parent_node_id>');
    process.exit(1);
  }

  try {
    logInfo(`Creating sub-issue relationship: ${childId} -> ${parentId}`);

    // Use GitHub GraphQL API to create sub-issue relationship
    const query = `
      mutation {
        addSubIssue(input: {
          issueId: "${parentId}"
          subIssueId: "${childId}"
        }) {
          issue {
            id
            title
          }
          subIssue {
            id
            title
          }
        }
      }
    `;

    const result = execSync(`gh api graphql -H "GraphQL-Features: sub_issues" -f query='${query}'`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const response = JSON.parse(result);
    if (response.data?.addSubIssue) {
      logInfo('✅ Sub-issue relationship created successfully');
      console.log('Parent:', response.data.addSubIssue.issue.title);
      console.log('Child:', response.data.addSubIssue.subIssue.title);
    } else {
      logError('Failed to create sub-issue relationship');
      console.log(result);
      process.exit(1);
    }
  } catch (error) {
    logError(`Error creating sub-issue relationship: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main as createSubIssue };