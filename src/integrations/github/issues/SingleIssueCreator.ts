import { IGitHubClient } from '../api/interfaces';
import { IssueTypeConfigManager } from './IssueTypeConfigManager';
import { GitHubIssue } from '../api/types';

export interface SingleIssueData {
  title: string;
  body: string;
  type: string;
  owner: string;
  repo: string;
}

export class SingleIssueCreator {
  constructor(
    private githubClient: IGitHubClient,
    private configManager: IssueTypeConfigManager
  ) {}

  async createIssue(issueData: SingleIssueData): Promise<GitHubIssue> {
    try {
      // Load issue type configuration
      const issueTypes = await this.configManager.loadConfig();
      
      // Check if any issue types are configured
      const availableTypes = Object.keys(issueTypes);
      if (availableTypes.length === 0) {
        throw new Error('No issue types configured. Please run issue type discovery first.');
      }

      // Check if requested type exists
      if (!issueTypes[issueData.type]) {
        throw new Error(`Issue type "${issueData.type}" not found in configuration. Available types: ${availableTypes.join(', ')}`);
      }

      // Get repository ID
      const repositoryId = await this.githubClient.getRepositoryId();

      // Create the issue
      const issue = await this.githubClient.createIssue({
        title: issueData.title,
        body: issueData.body,
        issueType: issueTypes[issueData.type],
        repositoryId
      });

      return issue;
    } catch (error) {
      throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : error}`);
    }
  }

  async listAvailableTypes(): Promise<string[]> {
    const issueTypes = await this.configManager.loadConfig();
    return Object.keys(issueTypes);
  }
}