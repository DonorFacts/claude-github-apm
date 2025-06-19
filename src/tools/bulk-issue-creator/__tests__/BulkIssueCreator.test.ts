import { BulkIssueCreator } from '../BulkIssueCreator';
import { TestPlanBuilder, MockGitHubClient, expectIssueCreated, loadPlanFromFile } from './test-utils';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('BulkIssueCreator - Happy Path', () => {
  let mockGitHubClient: MockGitHubClient;
  let testPlanPath: string;
  let outputDir: string;
  
  beforeEach(() => {
    mockGitHubClient = new MockGitHubClient();
    outputDir = path.join(__dirname, 'output', Date.now().toString());
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
      const plan = new TestPlanBuilder()
        .addTask('task-1', 'Test Task', null)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      expectIssueCreated(mockGitHubClient, 'Test Task');
      
      // Verify plan file was updated
      const updatedPlan = fs.readFileSync(testPlanPath, 'utf-8');
      expect(updatedPlan).toContain('issue_number: 200');
    });
    
    it('should create backup before modifying plan', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addTask('task-1', 'Test Task', null)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
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
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
      
      // Verify creation order (level by level)
      const calls = mockGitHubClient.calls;
      const createCalls = calls.filter(c => c.method === 'createIssue' || c.method === 'createIssuesBatch');
      
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
    });
    
    it('should create parent-child relationships', async () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addPhase('phase-1', 'Test Phase', ['epic-1'])
        .addEpic('epic-1', 'Test Epic', 'phase-1', ['task-1'])
        .addTask('task-1', 'Test Task', 'epic-1')
        .saveToFile(testPlanPath);
      
      // Mock responses with GitHub IDs
      mockGitHubClient.setResponse('createIssue', { number: 100, id: 'phase-id' });
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      await creator.execute();
      
      // Assert - verify relationships were created
      const relationshipCalls = mockGitHubClient.calls.filter(c => 
        c.method === 'createSubIssueRelationships'
      );
      
      expect(relationshipCalls.length).toBeGreaterThan(0);
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
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(20);
      
      // Verify only one batch call was made
      const batchCalls = mockGitHubClient.calls.filter(c => c.method === 'createIssuesBatch');
      expect(batchCalls.length).toBe(1);
      expect(batchCalls[0].issues.length).toBe(20);
    });
    
    it('should handle multiple batches for 25 issues', async () => {
      // Arrange
      const builder = new TestPlanBuilder();
      
      // Add 25 tasks at the same level
      for (let i = 1; i <= 25; i++) {
        builder.addTask(`task-${i}`, `Task ${i}`, null);
      }
      
      builder.saveToFile(testPlanPath);
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(25);
      
      // Verify two batch calls were made (20 + 5)
      const batchCalls = mockGitHubClient.calls.filter(c => c.method === 'createIssuesBatch');
      expect(batchCalls.length).toBe(2);
      expect(batchCalls[0].issues.length).toBe(20);
      expect(batchCalls[1].issues.length).toBe(5);
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
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      
      // Verify only the new task was created
      expectIssueCreated(mockGitHubClient, 'New Task');
      
      // Verify existing task was not created
      const createCalls = mockGitHubClient.calls.filter(c => 
        (c.method === 'createIssue' && c.issue.title === 'Existing Task') ||
        (c.method === 'createIssuesBatch' && c.issues.some((i: any) => i.title === 'Existing Task'))
      );
      expect(createCalls.length).toBe(0);
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
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1); // Only the epic
      expect(result.skipped).toBe(1); // The phase
      
      // Verify relationship was still created
      const relationshipCalls = mockGitHubClient.calls.filter(c => 
        c.method === 'createSubIssueRelationships'
      );
      expect(relationshipCalls.length).toBeGreaterThan(0);
    });
  });
});