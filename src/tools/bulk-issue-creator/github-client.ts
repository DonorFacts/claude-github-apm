/**
 * GitHub API client with batching capabilities for efficient issue creation
 */

import { execSync } from 'child_process';
import { GitHubIssueInput, CreateIssueResult, BatchCreateResult, IssueTypeMapping } from './types';

export class GitHubClient {
  private repositoryId: string;
  private owner: string;
  private repo: string;

  constructor(owner: string, repo: string) {
    this.owner = owner;
    this.repo = repo;
    this.repositoryId = this.getRepositoryId();
  }

  /**
   * Get repository ID using GitHub CLI
   */
  private getRepositoryId(): string {
    try {
      const result = execSync(
        `gh api graphql -f query='query { repository(owner: "${this.owner}", name: "${this.repo}") { id }}' -q .data.repository.id`,
        { encoding: 'utf8' }
      ).trim();
      return result;
    } catch (error) {
      throw new Error(`Failed to get repository ID: ${error}`);
    }
  }

  /**
   * Create multiple issues in a single GraphQL request using aliases
   * GitHub allows up to 100 aliases per request
   */
  async createIssuesBatch(inputs: Array<{ alias: string; input: GitHubIssueInput }>): Promise<BatchCreateResult> {
    if (inputs.length === 0) return {};
    
    // Build GraphQL mutation with aliases
    const mutations = inputs.map(({ alias, input }) => {
      const mutation = `
        ${alias}: createIssue(input: {
          repositoryId: "${input.repositoryId}"
          title: "${this.escapeQuotes(input.title)}"
          body: "${this.escapeQuotes(input.body)}"
          ${input.issueTypeId ? `issueTypeId: "${input.issueTypeId}"` : ''}
        }) {
          issue {
            id
            number
          }
        }`;
      return mutation;
    }).join('\n');

    const query = `
      mutation CreateMultipleIssues {
        ${mutations}
      }
    `;

    try {
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='${query}'`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large responses
      );
      
      const data = JSON.parse(result);
      return data.data as BatchCreateResult;
    } catch (error) {
      console.error('Batch creation failed:', error);
      throw new Error(`Failed to create issues batch: ${error}`);
    }
  }

  /**
   * Create a single issue (fallback method)
   */
  async createIssue(input: GitHubIssueInput): Promise<CreateIssueResult> {
    const query = `
      mutation CreateIssue {
        createIssue(input: {
          repositoryId: "${input.repositoryId}"
          title: "${this.escapeQuotes(input.title)}"
          body: "${this.escapeQuotes(input.body)}"
          ${input.issueTypeId ? `issueTypeId: "${input.issueTypeId}"` : ''}
        }) {
          issue {
            id
            number
          }
        }
      }
    `;

    try {
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='${query}' -q .data.createIssue`,
        { encoding: 'utf8' }
      );
      
      return JSON.parse(result) as CreateIssueResult;
    } catch (error) {
      throw new Error(`Failed to create issue "${input.title}": ${error}`);
    }
  }

  /**
   * Create sub-issue relationships in batch
   */
  async createSubIssueRelationships(relationships: Array<{ parentNumber: number; childNumber: number }>): Promise<void> {
    // GitHub doesn't support batch relationship creation via GraphQL yet,
    // so we'll use the shell script for now
    for (const { parentNumber, childNumber } of relationships) {
      try {
        execSync(`./src/scripts/create-sub-issue.sh ${parentNumber} ${childNumber}`, {
          encoding: 'utf8',
          stdio: 'pipe' // Suppress output for bulk operations
        });
      } catch (error) {
        console.error(`Failed to link #${childNumber} to #${parentNumber}: ${error}`);
        // Continue with other relationships even if one fails
      }
    }
  }

  /**
   * Check if an issue already exists with the given title
   */
  async findExistingIssue(title: string): Promise<number | null> {
    try {
      const result = execSync(
        `gh issue list --search "${title}" --limit 1 --json number,title`,
        { encoding: 'utf8' }
      );
      
      const issues = JSON.parse(result);
      if (issues.length > 0 && issues[0].title === title) {
        return issues[0].number;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Escape quotes for GraphQL
   */
  private escapeQuotes(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * Get issue type IDs from the organization
   */
  async getIssueTypes(): Promise<IssueTypeMapping> {
    try {
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='query { organization(login: "${this.owner}") { issueTypes(first: 20) { nodes { id name }}}}' -q '.data.organization.issueTypes.nodes'`,
        { encoding: 'utf8' }
      );
      
      const types = JSON.parse(result);
      const mapping: Partial<IssueTypeMapping> = {};
      
      for (const type of types) {
        const key = type.name.toLowerCase() as keyof IssueTypeMapping;
        if (key in mapping) {
          mapping[key] = type.id;
        }
      }
      
      return mapping as IssueTypeMapping;
    } catch (error) {
      throw new Error(`Failed to get issue types: ${error}`);
    }
  }
}