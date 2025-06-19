import { execSync } from 'child_process';
import { 
  CreateIssueInput, 
  GitHubIssue, 
  BatchCreateResult 
} from './types';
import { IGitHubClient } from './interfaces';

export class GitHubClient implements IGitHubClient {
  private repoOwner: string;
  private repoName: string;
  
  constructor(repo?: string) {
    if (repo) {
      const [owner, name] = repo.split('/');
      this.repoOwner = owner;
      this.repoName = name;
    } else {
      // Get from current repo
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
      const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
      if (!match) {
        throw new Error('Could not determine repository from git remote');
      }
      this.repoOwner = match[1];
      this.repoName = match[2];
    }
  }
  
  async getRepositoryId(): Promise<string> {
    try {
      const query = `
        query {
          repository(owner: "${this.repoOwner}", name: "${this.repoName}") {
            id
          }
        }
      `;
      
      const result = execSync(
        `gh api graphql -f query='${query}'`,
        { encoding: 'utf-8' }
      );
      
      const data = JSON.parse(result);
      return data.data.repository.id;
    } catch (error) {
      throw new Error(`Failed to get repository ID: ${error}`);
    }
  }
  
  async createIssuesBatch(issues: CreateIssueInput[]): Promise<BatchCreateResult> {
    const mutations = issues.map((issue, index) => `
      issue${index}: createIssue(input: {
        repositoryId: "${issue.repositoryId}"
        title: "${this.escapeQuotes(issue.title)}"
        body: "${this.escapeQuotes(issue.body)}"
        issueTypeId: "${issue.issueType}"
      }) {
        issue {
          number
          id
        }
      }
    `).join('\n');
    
    const query = `
      mutation CreateIssuesBatch {
        ${mutations}
      }
    `;
    
    try {
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='${query}'`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
      );
      
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to create issues batch: ${error}`);
    }
  }
  
  async createIssue(input: CreateIssueInput): Promise<GitHubIssue> {
    const query = `
      mutation CreateIssue {
        createIssue(input: {
          repositoryId: "${input.repositoryId}"
          title: "${this.escapeQuotes(input.title)}"
          body: "${this.escapeQuotes(input.body)}"
          issueTypeId: "${input.issueType}"
        }) {
          issue {
            number
            id
            title
            url
          }
        }
      }
    `;
    
    try {
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='${query}'`,
        { encoding: 'utf-8' }
      );
      
      const data = JSON.parse(result);
      return data.data.createIssue.issue;
    } catch (error) {
      throw new Error(`Failed to create issue: ${error}`);
    }
  }
  
  async findExistingIssue(title: string): Promise<number | null> {
    try {
      const searchQuery = `repo:${this.repoOwner}/${this.repoName} is:issue "${title}"`;
      const result = execSync(
        `gh search issues "${searchQuery}" --json number,title --limit 1`,
        { encoding: 'utf-8' }
      );
      
      const issues = JSON.parse(result);
      if (issues.length > 0 && issues[0].title === title) {
        return issues[0].number;
      }
      return null;
    } catch (error) {
      console.error(`Error searching for existing issue: ${error}`);
      return null;
    }
  }
  
  async createSubIssueRelationships(parentId: string, childIds: string[]): Promise<void> {
    // Use the shell script for now
    // TODO: Replace with direct GraphQL when API is available
    for (const childId of childIds) {
      try {
        execSync(
          `${__dirname}/../../create-sub-issue.sh "${childId}" "${parentId}"`,
          { stdio: 'pipe' }
        );
      } catch (error) {
        console.error(`Failed to create relationship ${parentId} -> ${childId}:`, error);
        throw error;
      }
    }
  }
  
  async getIssueTypes(): Promise<Record<string, any>> {
    try {
      const query = `
        query {
          repository(owner: "${this.repoOwner}", name: "${this.repoName}") {
            issueTypes {
              nodes {
                id
                name
                description
              }
            }
          }
        }
      `;
      
      const result = execSync(
        `gh api graphql -f query='${query}'`,
        { encoding: 'utf-8' }
      );
      
      const data = JSON.parse(result);
      const types: Record<string, any> = {};
      
      for (const type of data.data.repository.issueTypes.nodes) {
        types[type.name.toLowerCase()] = type;
      }
      
      return types;
    } catch (error) {
      throw new Error(`Failed to get issue types: ${error}`);
    }
  }
  
  private escapeQuotes(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}