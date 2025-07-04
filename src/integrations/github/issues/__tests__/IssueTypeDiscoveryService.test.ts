import { IssueTypeDiscoveryService } from '../IssueTypeDiscoveryService';
import { IGitHubClient } from '../../api/interfaces';

describe('IssueTypeDiscoveryService', () => {
  let mockGitHubClient: jest.Mocked<IGitHubClient>;
  let discoveryService: IssueTypeDiscoveryService;

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
    discoveryService = new IssueTypeDiscoveryService(mockGitHubClient);
  });

  describe('discoverIssueTypes', () => {
    it('should discover issue templates from GitHub repository', async () => {
      // Arrange
      const mockTemplates = [
        { id: 'IT_kwDODIcSxM4BoTQQ', name: 'Phase' },
        { id: 'IT_kwDODIcSxM4BoTQm', name: 'Project' },
        { id: 'IT_kwDODIcSxM4BoSKl', name: 'Epic' },
        { id: 'IT_kwDODIcSxM4Bl1xX', name: 'Feature' },
        { id: 'IT_kwDODIcSxM4Bofqc', name: 'Story' },
        { id: 'IT_kwDODIcSxM4Bl1xV', name: 'Task' },
        { id: 'IT_kwDODIcSxM4Bl1xW', name: 'Bug' }
      ];
      mockGitHubClient.discoverIssueTemplates.mockResolvedValue(mockTemplates);

      const owner = 'test-owner';
      const repo = 'test-repo';

      // Act
      const result = await discoveryService.discoverIssueTypes(owner, repo);

      // Assert
      expect(mockGitHubClient.discoverIssueTemplates).toHaveBeenCalledWith(owner, repo);
      expect(result).toEqual({
        phase: 'IT_kwDODIcSxM4BoTQQ',
        project: 'IT_kwDODIcSxM4BoTQm',
        epic: 'IT_kwDODIcSxM4BoSKl',
        feature: 'IT_kwDODIcSxM4Bl1xX',
        story: 'IT_kwDODIcSxM4Bofqc',
        task: 'IT_kwDODIcSxM4Bl1xV',
        bug: 'IT_kwDODIcSxM4Bl1xW'
      });
    });

    it('should handle repositories with no issue templates', async () => {
      // Arrange
      mockGitHubClient.discoverIssueTemplates.mockResolvedValue([]);
      const owner = 'test-owner';
      const repo = 'test-repo';

      // Act
      const result = await discoveryService.discoverIssueTypes(owner, repo);

      // Assert
      expect(result).toEqual({});
    });

    it('should handle GitHub API errors gracefully', async () => {
      // Arrange
      mockGitHubClient.discoverIssueTemplates.mockRejectedValue(new Error('GitHub API error'));
      const owner = 'test-owner';
      const repo = 'test-repo';

      // Act & Assert
      await expect(discoveryService.discoverIssueTypes(owner, repo))
        .rejects.toThrow('Failed to discover issue types: GitHub API error');
    });

    it('should normalize template names to lowercase types', async () => {
      // Arrange
      const mockTemplates = [
        { id: 'IT_123', name: 'EPIC' },
        { id: 'IT_456', name: 'User Story' },
        { id: 'IT_789', name: 'Task - Development' }
      ];
      mockGitHubClient.discoverIssueTemplates.mockResolvedValue(mockTemplates);

      const owner = 'test-owner';
      const repo = 'test-repo';

      // Act
      const result = await discoveryService.discoverIssueTypes(owner, repo);

      // Assert
      expect(result).toEqual({
        epic: 'IT_123',
        story: 'IT_456',
        task: 'IT_789'
      });
    });
  });
});