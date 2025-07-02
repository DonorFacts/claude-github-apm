#!/usr/bin/env node
import { BulkIssueCreator } from '../../integrations/github/BulkIssueCreator';
import { GitHubClient } from '../../integrations/github/GitHubClient';
import * as path from 'path';

async function main() {
  const planPath = process.argv[2] || path.join(process.cwd(), 'apm/Implementation_Plan.md');
  
  console.log('🚀 Starting bulk issue creation...');
  console.log(`📄 Plan file: ${planPath}`);
  
  try {
    const githubClient = new GitHubClient();
    const creator = new BulkIssueCreator(planPath, githubClient);
    
    const result = await creator.execute();
    
    console.log('\n✅ Bulk issue creation completed!');
    console.log(`📊 Results:`);
    console.log(`   - Created: ${result.created}`);
    console.log(`   - Skipped: ${result.skipped}`);
    console.log(`   - Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    process.exit(result.failed > 0 ? 1 : 0);
  } catch (error: unknown) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();