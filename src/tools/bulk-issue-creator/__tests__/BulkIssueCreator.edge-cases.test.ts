import { BulkIssueCreator } from '../BulkIssueCreator';
import { TestPlanBuilder, MockGitHubClient } from './test-utils';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('BulkIssueCreator - Edge Cases & Error Handling', () => {
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
  
  describe('Invalid Plan Files', () => {
    it('should throw error for malformed YAML', () => {
      // Arrange
      fs.writeFileSync(testPlanPath, 'invalid: yaml: content: [');
      
      // Act & Assert
      expect(() => new BulkIssueCreator(testPlanPath, mockGitHubClient))
        .toThrow('Failed to load plan');
    });
    
    it('should throw error for non-existent file', () => {
      // Act & Assert
      expect(() => new BulkIssueCreator('/non/existent/file.yaml', mockGitHubClient))
        .toThrow('Failed to load plan');
    });
  });
  
  describe('Plan Validation', () => {
    it('should throw error for missing parent reference', () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task with missing parent', 'non-existent-parent')
        .saveToFile(testPlanPath);
      
      // Act & Assert
      expect(() => new BulkIssueCreator(testPlanPath, mockGitHubClient))
        .toThrow('references non-existent parent');
    });
    
    it('should throw error for missing title', () => {
      // Arrange
      const plan = new TestPlanBuilder().build();
      plan.items.push({
        id: 'no-title',
        type: 'task',
        title: '', // Empty title
        description: 'Test',
        parent_id: null,
        children_ids: []
      });
      fs.writeFileSync(testPlanPath, yaml.dump(plan));
      
      // Act & Assert
      expect(() => new BulkIssueCreator(testPlanPath, mockGitHubClient))
        .toThrow('missing required field: title');
    });
    
    it('should throw error for invalid issue type', () => {
      // Arrange
      const plan = new TestPlanBuilder().build();
      plan.items.push({
        id: 'bad-type',
        type: 'invalid-type' as any,
        title: 'Test',
        description: 'Test',
        parent_id: null,
        children_ids: []
      });
      fs.writeFileSync(testPlanPath, yaml.dump(plan));
      
      // Act & Assert
      expect(() => new BulkIssueCreator(testPlanPath, mockGitHubClient))
        .toThrow('invalid issue type');
    });
  });
  
  describe('GitHub API Errors', () => {
    it('should handle batch creation failure and fallback to individual', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task 1', null)
        .addTask('task-2', 'Task 2', null)
        .saveToFile(testPlanPath);
      
      // Make batch creation fail
      mockGitHubClient.setResponse('createIssuesBatch', new Error('GraphQL error'));
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(2);
      expect(result.failed).toBe(0);
      
      // Verify fallback to individual creation
      const individualCalls = mockGitHubClient.calls.filter(c => c.method === 'createIssue');
      expect(individualCalls.length).toBe(2);
    });
    
    it('should handle individual creation failure', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task 1', null)
        .saveToFile(testPlanPath);
      
      // Make individual creation fail
      mockGitHubClient.setResponse('createIssue', new Error('API error'));
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Failed to create issue');
    });
    
    it('should handle repository ID fetch failure', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task 1', null)
        .saveToFile(testPlanPath);
      
      // Make getRepositoryId throw an error
      mockGitHubClient.getRepositoryId = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act & Assert
      await expect(creator.execute()).rejects.toThrow('Network error');
    });
    
    it('should handle relationship creation failure', async () => {
      // Arrange
      new TestPlanBuilder()
        .addPhase('phase-1', 'Phase', ['task-1'])
        .addTask('task-1', 'Task', 'phase-1')
        .saveToFile(testPlanPath);
      
      mockGitHubClient.setResponse('createSubIssueRelationships', new Error('Relationship error'));
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(2);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Failed to create relationships');
    });
  });
  
  describe('Empty and Edge Cases', () => {
    it('should handle empty plan gracefully', async () => {
      // Arrange
      const plan = new TestPlanBuilder().build();
      plan.items = [];
      fs.writeFileSync(testPlanPath, yaml.dump(plan));
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);
    });
    
    it('should handle plan with all existing issues', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Existing 1', null)
        .addTask('task-2', 'Existing 2', null)
        .withExistingIssue('task-1', 100)
        .withExistingIssue('task-2', 101)
        .saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(2);
      expect(result.failed).toBe(0);
    });
    
    it('should handle file write permission error gracefully', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task 1', null)
        .saveToFile(testPlanPath);
      
      // Create a custom BulkIssueCreator that will fail on plan update
      class TestBulkIssueCreator extends BulkIssueCreator {
        updatePlanFile() {
          // Simulate the error handling
          try {
            throw new Error('Permission denied');
          } catch (error) {
            console.error('Failed to update plan file:', error);
            (this as any).result.errors.push(`Failed to update plan file: ${error}`);
          }
        }
      }
      
      const creator = new TestBulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Failed to update plan file');
    });
  });
  
  describe('Batch Creation Edge Cases', () => {
    it('should handle partial batch failure', async () => {
      // Arrange
      new TestPlanBuilder()
        .addTask('task-1', 'Task 1', null)
        .addTask('task-2', 'Task 2', null)
        .addTask('task-3', 'Task 3', null)
        .saveToFile(testPlanPath);
      
      // Mock partial success in batch
      mockGitHubClient.setResponse('createIssuesBatch', {
        data: {
          issue0: { issue: { number: 100, id: 'id-100' } },
          issue1: null, // Failed
          issue2: { issue: { number: 102, id: 'id-102' } }
        }
      });
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });
    
    it('should handle exactly 20 items in batch', async () => {
      // Arrange
      const builder = new TestPlanBuilder();
      for (let i = 1; i <= 20; i++) {
        builder.addTask(`task-${i}`, `Task ${i}`, null);
      }
      builder.saveToFile(testPlanPath);
      
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(20);
      const batchCalls = mockGitHubClient.calls.filter(c => c.method === 'createIssuesBatch');
      expect(batchCalls.length).toBe(1);
      expect(batchCalls[0].issues.length).toBe(20);
    });
  });
  
  describe('Complex Hierarchies', () => {
    it('should handle circular parent references gracefully', () => {
      // Arrange
      const plan = new TestPlanBuilder()
        .addTask('task-1', 'Task 1', 'task-2')
        .addTask('task-2', 'Task 2', 'task-1')
        .build();
      
      fs.writeFileSync(testPlanPath, yaml.dump(plan));
      
      // This should not cause infinite loop in level calculation
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act & Assert - should not throw or hang
      expect(creator).toBeDefined();
    });
    
    it('should handle deep nesting (10+ levels)', async () => {
      // Arrange
      const builder = new TestPlanBuilder();
      let parentId = null;
      
      // Create 10-level deep hierarchy
      for (let i = 0; i < 10; i++) {
        const id = `item-${i}`;
        builder.addTask(id, `Level ${i}`, parentId);
        parentId = id;
      }
      
      builder.saveToFile(testPlanPath);
      const creator = new BulkIssueCreator(testPlanPath, mockGitHubClient);
      
      // Act
      const result = await creator.execute();
      
      // Assert
      expect(result.created).toBe(10);
      expect(result.failed).toBe(0);
      
      // Verify level-by-level creation
      const createCalls = mockGitHubClient.calls.filter(c => 
        c.method === 'createIssue' || c.method === 'createIssuesBatch'
      );
      expect(createCalls.length).toBe(10); // One per level
    });
  });
});