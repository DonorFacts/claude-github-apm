import { 
  CreateIssueInput, 
  GitHubIssue, 
  BatchCreateResult,
  IssueTemplate
} from './types';

export interface IGitHubClient {
  getRepositoryId(): Promise<string>;
  createIssuesBatch(issues: CreateIssueInput[]): Promise<BatchCreateResult>;
  createIssue(input: CreateIssueInput): Promise<GitHubIssue>;
  findExistingIssue(title: string): Promise<number | null>;
  createSubIssueRelationships(parentId: string, childIds: string[]): Promise<void>;
  getIssueTypes(): Promise<Record<string, any>>;
  discoverIssueTemplates(owner: string, repo: string): Promise<IssueTemplate[]>;
}