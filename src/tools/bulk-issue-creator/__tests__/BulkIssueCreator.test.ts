import { BulkIssueCreator } from '../BulkIssueCreator';
import { GitHubClient } from '../GitHubClient';
import { TestPlanBuilder, MockGitHubClient, expectIssueCreated, loadPlanFromFile } from '../utils/test-utils';
import { shouldUseMocks, TEST_REPOSITORY } from '../../../test-setup';
import { IGitHubClient } from '../interfaces';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';
import { IssueNumberTracker } from '../utils/issue-number-tracker';

describe('BulkIssueCreator - Happy Path', () => {
  let githubClient: IGitHubClient;
  let testPlanPath: string;
  let outputDir: string;
  let issueTracker: IssueNumberTracker;
  
  beforeEach(() => {
    console.log('=== BulkIssueCreator Test Setup ===');
    console.log('APM_TEST_PROD:', process.env.APM_TEST_PROD);
    console.log('shouldUseMocks:', shouldUseMocks);
    console.log('Client type:', shouldUseMocks ? 'MockGitHubClient' : 'GitHubClient');
    
    // Initialize issue tracker for production tests
    if (!shouldUseMocks) {
      issueTracker = new IssueNumberTracker();
      console.log('Last tracked issue number:', issueTracker.getLastNumber());
    }
    
    
    // Use mock or real client based on environment
    if (shouldUseMocks) {
      console.log('>>> Creating MOCK client because shouldUseMocks =', shouldUseMocks);
      githubClient = new MockGitHubClient();
    } else {
      console.log('>>> Creating REAL GitHubClient because shouldUseMocks =', shouldUseMocks);
      console.log('>>> Using test repository:', TEST_REPOSITORY);
      githubClient = new GitHubClient(TEST_REPOSITORY);
    }
    console.log('>>> Client instantiated:', githubClient.constructor.name);
    console.log('>>> typeof githubClient.createIssue:', typeof (githubClient as any).createIssue);
    
    if (shouldUseMocks && 'reset' in githubClient) {
      (githubClient as any).reset();
    }
    // Use more unique directory names to avoid race conditions
    outputDir = path.join(__dirname, 'output', `${Date.now()}-${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(outputDir, { recursive: true });
    testPlanPath = path.join(outputDir, 'test-plan.yaml');
  });
  
  afterEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
  });
  
  describe('Single Issue Creation', () => {
    it('should create a single task successfully', async () => {
      // Arrange
      const timestamp = new Date().toISOString();
      const uniqueTitle = `Test Task ${timestamp} ${Math.random().toString(36).substring(7)}`;
      console.log('>>> Creating test with unique title:', uniqueTitle);
      
      const plan = new TestPlanBuilder()
        .addTask('task-1', uniqueTitle, null)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      
      // Act
      const result = await creator.execute();
      
      // Assert
      console.log('Test result:', JSON.stringify(result, null, 2));
      // Critical: In production mode, check if creation failed (offline)
      if (!shouldUseMocks && result.failed > 0) {
        console.log('\n❌ Production test failed to create issues:', result.errors);
        console.log('This indicates the test is running offline or GitHub API is unreachable.\n');
      }
      
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      
      if (shouldUseMocks) {
        expectIssueCreated(githubClient as MockGitHubClient, uniqueTitle);
      } else {
        // For production tests, verify issue number increased
        const updatedPlan = loadPlanFromFile(testPlanPath);
        const createdItem = updatedPlan.items.find(i => i.id === 'task-1');
        
        if (!createdItem?.issue_number) {
          throw new Error('Production test failed: No issue number found in plan. Issue was not created on GitHub.');
        }
        
        issueTracker.recordIssue(createdItem.issue_number, uniqueTitle);
        
        // This will throw if the issue number didn't increase
        issueTracker.expectIncreasingNumber(createdItem.issue_number);
      }
      
      // Verify plan file was updated (only for mocks)
      if (shouldUseMocks) {
        const updatedPlan = fs.readFileSync(testPlanPath, 'utf-8');
        expect(updatedPlan).toContain('issue_number: 200');
      }
    });
    
    it('should create backup before modifying plan', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addTask('task-1', 'Test Task', null)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      await creator.execute();
      
      // Assert
      const backupPath = testPlanPath.replace('.yaml', '.backup.yaml');
      expect(fs.existsSync(backupPath)).toBe(true);
    });
  });
  
  describe('Issue Hierarchy Creation', () => {
    it('should create 3-level hierarchy (Phase > Epic > Task)', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addPhase('phase-1', 'Test Phase', ['epic-1'])
        .addEpic('epic-1', 'Test Epic', 'phase-1', ['task-1'])
        .addTask('task-1', 'Test Task', 'epic-1')
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      
      // Verify creation order (level by level) - only for mocks
      if (shouldUseMocks) {
        const calls = (githubClient as MockGitHubClient).calls;
        const createCalls = calls.filter((c: any) => c.method === 'createIssue' || c.method === 'createIssuesBatch');
        
        // First call should create the phase
        expect(createCalls[0]).toMatchObject({
          method: 'createIssue',
          issue: expect.objectContaining({ title: 'Test Phase' })
        });
        
        // Second call should create the epic
        expect(createCalls[1]).toMatchObject({
          method: 'createIssue',
          issue: expect.objectContaining({ title: 'Test Epic' })
        });
        
        // Third call should create the task
        expect(createCalls[2]).toMatchObject({
          method: 'createIssue',
          issue: expect.objectContaining({ title: 'Test Task' })
        });
      }
    });
    
    it('should create parent-child relationships', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addPhase('phase-1', 'Test Phase', ['epic-1'])
        .addEpic('epic-1', 'Test Epic', 'phase-1', ['task-1'])
        .addTask('task-1', 'Test Task', 'epic-1')
        .saveToFile(testPlanPath);
      
      // Mock responses with GitHub IDs - only for mocks
      if (shouldUseMocks) {
        (githubClient as MockGitHubClient).setResponse('createIssue', { number: 100, id: 'phase-id' });
      }
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      
      // Assert - verify relationships were created (only for mocks)
      if (shouldUseMocks) {
        const relationshipCalls = (githubClient as MockGitHubClient).calls.filter((c: any) => 
          c.method === 'createSubIssueRelationships'
        );
        
        expect(relationshipCalls.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Batch Creation', () => {
    it('should batch create 20 issues in single API call', async () => {
      // Arrange
      const builder = new TestPlanBuilder();
      
      // Add 20 tasks at the same level
      for (let i = 1; i <= 20; i++) {
        builder.addTask(`task-${i}`, `Task ${i}`, null);
      }
      
      builder.saveToFile(testPlanPath);
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(20);
      
      // Verify only one batch call was made (only for mocks)
      if (shouldUseMocks) {
        const batchCalls = (githubClient as MockGitHubClient).calls.filter((c: any) => c.method === 'createIssuesBatch');
        expect(batchCalls.length).toBe(1);
        expect(batchCalls[0].issues.length).toBe(20);
      }
    });
    
    it('should handle multiple batches for 25 issues', async () => {
      // Arrange
      const builder = new TestPlanBuilder();
      
      // Add 25 tasks at the same level
      for (let i = 1; i <= 25; i++) {
        builder.addTask(`task-${i}`, `Task ${i}`, null);
      }
      
      builder.saveToFile(testPlanPath);
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(25);
      
      // Verify two batch calls were made (20 + 5) - only for mocks
      if (shouldUseMocks) {
        const batchCalls = (githubClient as MockGitHubClient).calls.filter((c: any) => c.method === 'createIssuesBatch');
        expect(batchCalls.length).toBe(2);
        expect(batchCalls[0].issues.length).toBe(20);
        expect(batchCalls[1].issues.length).toBe(5);
      }
    });
  });
  
  describe('Skip Existing Issues', () => {
    it('should skip issues that already have issue numbers', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addTask('task-1', 'Existing Task', null)
        .addTask('task-2', 'New Task', null)
        .withExistingIssue('task-1', 123)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      
      // Verify only the new task was created
      if (shouldUseMocks) {
        expectIssueCreated(githubClient as MockGitHubClient, 'New Task');
      }
      
      // Verify existing task was not created (only for mocks)
      if (shouldUseMocks) {
        const createCalls = (githubClient as MockGitHubClient).calls.filter((c: any) => 
          (c.method === 'createIssue' && c.issue.title === 'Existing Task') ||
          (c.method === 'createIssuesBatch' && c.issues.some((i: any) => i.title === 'Existing Task'))
        );
        expect(createCalls.length).toBe(0);
      }
    });
    
    it('should still create relationships for existing issues', async () => {
      // Arrange
      const builder = new TestPlanBuilder()
        .addPhase('phase-1', 'Existing Phase', ['epic-1'])
        .addEpic('epic-1', 'New Epic', 'phase-1')
        .withExistingIssue('phase-1', 100);
      
      // Build plan, modify it, then save
      const plan = builder.build();
      plan.items[0].github_id = 'existing-phase-id';
      fs.writeFileSync(testPlanPath, yaml.dump(plan));
      
      const creator = new BulkIssueCreator(testPlanPath, githubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1); // Only the epic
      expect(result.skipped).toBe(1); // The phase
      
      // Verify relationship was still created (only for mocks)
      if (shouldUseMocks) {
        const relationshipCalls = (githubClient as MockGitHubClient).calls.filter((c: any) => 
          c.method === 'createSubIssueRelationships'
        );
        expect(relationshipCalls.length).toBeGreaterThan(0);
      }
    });
  });
});