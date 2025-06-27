import { SingleIssueCreator } from '../SingleIssueCreator';
import { IssueTypeConfigManager } from '../IssueTypeConfigManager';
import { IGitHubClient } from '../../bulk-issue-creator/interfaces';
import { IssueTypes } from '../../bulk-issue-creator/types';

describe('SingleIssueCreator', () => {
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let mockConfigManager: jest.Mocked<IssueTypeConfigManager>;
  let singleIssueCreator: SingleIssueCreator;

  beforeEach(() => {
    mockGitHubClient = {
      getRepositoryId: jest.fn(),
      createIssue: jest.fn(),
      createIssuesBatch: jest.fn(),
      createSubIssueRelationships: jest.fn(),
      findExistingIssue: jest.fn(),
      getIssueTypes: jest.fn(),
      discoverIssueTemplates: jest.fn()
    };

    mockConfigManager = {
      saveConfig: jest.fn(),
      loadConfig: jest.fn(),
      configExists: jest.fn(),
      getConfigPath: jest.fn()
    } as any;

    singleIssueCreator = new SingleIssueCreator(mockGitHubClient, mockConfigManager);
  });

  describe('createIssue', () => {
    it('should create a single issue with specified type', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        task: 'IT_kwDODIcSxM4Bl1xV',
        bug: 'IT_kwDODIcSxM4Bl1xW'
      };
      mockConfigManager.loadConfig.mockResolvedValue(issueTypes);
      mockGitHubClient.getRepositoryId.mockResolvedValue('repo123');
      mockGitHubClient.createIssue.mockResolvedValue({
        id: 'issue123',
        number: 42,
        title: 'Test Task',
        url: 'https://github.com/owner/repo/issues/42'
      });

      const issueData = {
        title: 'Test Task',
        body: 'This is a test task',
        type: 'task',
        owner: 'test-owner',
        repo: 'test-repo'
      };

      // Act
      const result = await singleIssueCreator.createIssue(issueData);

      // Assert
      expect(mockConfigManager.loadConfig).toHaveBeenCalled();
      expect(mockGitHubClient.getRepositoryId).toHaveBeenCalled();
      expect(mockGitHubClient.createIssue).toHaveBeenCalledWith({
        title: 'Test Task',
        body: 'This is a test task',
        issueType: 'IT_kwDODIcSxM4Bl1xV',
        repositoryId: 'repo123'
      });
      expect(result).toEqual({
        id: 'issue123',
        number: 42,
        title: 'Test Task',
        url: 'https://github.com/owner/repo/issues/42'
      });
    });

    it('should throw error if issue type is not configured', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        task: 'IT_kwDODIcSxM4Bl1xV'
      };
      mockConfigManager.loadConfig.mockResolvedValue(issueTypes);

      const issueData = {
        title: 'Test Epic',
        body: 'This is a test epic',
        type: 'epic',
        owner: 'test-owner',
        repo: 'test-repo'
      };

      // Act & Assert
      await expect(singleIssueCreator.createIssue(issueData))
        .rejects.toThrow('Issue type "epic" not found in configuration. Available types: task');
    });

    it('should throw error if no issue types are configured', async () => {
      // Arrange
      mockConfigManager.loadConfig.mockResolvedValue({});

      const issueData = {
        title: 'Test Task',
        body: 'This is a test task',
        type: 'task',
        owner: 'test-owner',
        repo: 'test-repo'
      };

      // Act & Assert
      await expect(singleIssueCreator.createIssue(issueData))
        .rejects.toThrow('No issue types configured. Please run issue type discovery first.');
    });

    it('should handle GitHub API errors', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        task: 'IT_kwDODIcSxM4Bl1xV'
      };
      mockConfigManager.loadConfig.mockResolvedValue(issueTypes);
      mockGitHubClient.getRepositoryId.mockResolvedValue('repo123');
      mockGitHubClient.createIssue.mockRejectedValue(new Error('GitHub API error'));

      const issueData = {
        title: 'Test Task',
        body: 'This is a test task',
        type: 'task',
        owner: 'test-owner',
        repo: 'test-repo'
      };

      // Act & Assert
      await expect(singleIssueCreator.createIssue(issueData))
        .rejects.toThrow('Failed to create issue: GitHub API error');
    });
  });

  describe('listAvailableTypes', () => {
    it('should return list of available issue types', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        phase: 'IT_kwDODIcSxM4BoTQQ',
        epic: 'IT_kwDODIcSxM4BoSKl',
        task: 'IT_kwDODIcSxM4Bl1xV',
        bug: 'IT_kwDODIcSxM4Bl1xW'
      };
      mockConfigManager.loadConfig.mockResolvedValue(issueTypes);

      // Act
      const result = await singleIssueCreator.listAvailableTypes();

      // Assert
      expect(result).toEqual(['phase', 'epic', 'task', 'bug']);
    });

    it('should return empty array if no types configured', async () => {
      // Arrange
      mockConfigManager.loadConfig.mockResolvedValue({});

      // Act
      const result = await singleIssueCreator.listAvailableTypes();

      // Assert
      expect(result).toEqual([]);
    });
  });
});