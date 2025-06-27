// Test setup and cleanup utilities
import { execSync } from 'child_process';

// Store test issue numbers for cleanup
export const testIssueNumbers: number[] = [];
export const TEST_LABEL = 'test-bulk-creator';
export const TEST_REPO = process.env.TEST_REPO || 'DonorFacts/claude-github-apm';

// Cleanup function to delete test issues
export async function cleanupTestIssues(): Promise<void> {
  if (testIssueNumbers.length === 0) return;
  
  console.log(`Cleaning up ${testIssueNumbers.length} test issues...`);
  
  for (const issueNumber of testIssueNumbers) {
    try {
      execSync(`gh issue delete ${issueNumber} --repo ${TEST_REPO} --yes`, {
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn(`Failed to delete issue #${issueNumber}:`, error);
    }
  }
  
  // Clear the array
  testIssueNumbers.length = 0;
}

// Global test setup
beforeAll(() => {
  // For unit tests, we're using mocks so we don't need real repo checks
  if (process.env.INTEGRATION_TESTS === 'true') {
    // Only check for production repo in integration tests
    if (TEST_REPO === 'DonorFacts/claude-github-apm' && !process.env.ALLOW_PROD_TESTS) {
      throw new Error('Tests should not run on production repo. Set TEST_REPO env var.');
    }
  }
});

// Global test cleanup
afterAll(async () => {
  await cleanupTestIssues();
});

// Cleanup after each test as well for safety
afterEach(async () => {
  await cleanupTestIssues();
});