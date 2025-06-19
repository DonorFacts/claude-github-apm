#!/usr/bin/env node

/**
 * CLI entry point for bulk issue creation
 */

import { BulkIssueCreator } from './bulk-issue-creator';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);
  
  // Default to implementation-plan.yaml in current directory
  const planPath = args[0] || path.join(process.cwd(), 'src/tools/implementation-plan.yaml');
  
  console.log('🚀 Claude GitHub APM - Bulk Issue Creator\n');
  console.log(`📄 Plan file: ${planPath}`);
  
  try {
    const creator = new BulkIssueCreator(planPath);
    await creator.execute();
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { BulkIssueCreator } from './bulk-issue-creator';
export * from './types';