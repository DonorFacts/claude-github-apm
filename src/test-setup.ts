/**
 * Test setup configuration with environment-based test isolation
 * 
 * Default: Unit tests with mocks (no env vars needed)
 * Real APIs: Only when GITHUB_INTEGRATION_TESTS=true
 */

import { execSync } from 'child_process';

// Test configuration - defaults to safe unit testing
console.log('[test-setup.ts] process.env.APM_TEST_PROD =', process.env.APM_TEST_PROD);
console.log('[test-setup.ts] typeof process.env.APM_TEST_PROD =', typeof process.env.APM_TEST_PROD);
export const USE_REAL_GITHUB = process.env.APM_TEST_PROD === 'true';
console.log('[test-setup.ts] USE_REAL_GITHUB =', USE_REAL_GITHUB);
export const TEST_REPOSITORY = 'DonorFacts/claude-github-apm-test';

// Track test issues for cleanup
export const testIssueNumbers: number[] = [];


// Cleanup function for integration tests
export async function cleanupTestIssues(): Promise<void> {
  if (!USE_REAL_GITHUB || testIssueNumbers.length === 0) {
    return;
  }
  
  console.log(`🧹 Cleaning up ${testIssueNumbers.length} test issues...`);
  
  for (const issueNumber of testIssueNumbers) {
    try {
      execSync(`gh issue delete ${issueNumber} --yes`, {
        stdio: 'pipe'
      });
    } catch (error) {
      console.warn(`⚠️  Failed to delete issue #${issueNumber}:`, error);
    }
  }
  
  testIssueNumbers.length = 0;
}

// Global test setup
beforeAll(() => {
  if (USE_REAL_GITHUB) {
    console.log(`🔗 Production testing enabled against current repository`);
    
    // Check GitHub CLI is available
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch {
      throw new Error('❌ GitHub CLI (gh) is required for production tests');
    }
    
    // Verify network connectivity to GitHub
    try {
      console.log('🌐 Verifying network connectivity to GitHub...');
      const result = execSync('gh api /rate_limit --jq .rate.remaining', { 
        encoding: 'utf-8',
        timeout: 5000 // 5 second timeout
      }).trim();
      console.log(`✅ GitHub API is reachable (${result} requests remaining)`);
    } catch (error: any) {
      console.error('❌ Network check failed!');
      console.error('Error:', error.message);
      console.error('This test MUST fail when offline!');
      throw new Error('❌ Cannot reach GitHub API. Are you offline? Production tests require internet connection.');
    }
  } else {
    console.log('📦 Unit tests with mocks (default)');
  }
});

// Global test cleanup
afterAll(async () => {
  await cleanupTestIssues();
});

// Per-test cleanup for safety  
afterEach(async () => {
  await cleanupTestIssues();
});

// Export for test configuration
export const shouldUseMocks = !USE_REAL_GITHUB;