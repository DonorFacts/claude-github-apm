import { execSync } from 'child_process';
import { 
  CreateIssueInput, 
  GitHubIssue, 
  BatchCreateResult,
  IssueTemplate
} from '../api/types';
import { IGitHubClient } from '../api/interfaces';

export class GitHubClient implements IGitHubClient {
  private repoOwner: string;
  private repoName: string;
  
  constructor(repo?: string) {
    console.log('=== GitHubClient Constructor Called ===');
    console.log('APM_TEST_PROD in GitHubClient:', process.env.APM_TEST_PROD);
    console.log('This is the REAL GitHub client!');
    
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
    console.log(`GitHubClient initialized for: ${this.repoOwner}/${this.repoName}`);
  }
  
  async getRepositoryId(): Promise<string> {
    console.log(`GitHubClient.getRepositoryId called for: ${this.repoOwner}/${this.repoName}`);
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
      const repoId = data.data.repository.id;
      console.log(`Repository ID for ${this.repoOwner}/${this.repoName}: ${repoId}`);
      return repoId;
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
    console.log('=== GitHubClient.createIssue Called ===');
    console.log('Title:', input.title);
    console.log('About to make REAL GitHub API call!');
    
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
      console.log('Executing gh api graphql command...');
      
      // Add a timestamp to verify this is a real network call
      const timestamp = new Date().toISOString();
      console.log('Request timestamp:', timestamp);
      
      const result = execSync(
        `gh api graphql -H "GraphQL-Features: issue_types" -f query='${query}'`,
        { encoding: 'utf-8' }
      );
      
      console.log('API call succeeded, parsing result...');
      const data = JSON.parse(result);
      console.log('Created issue number:', data.data.createIssue.issue.number);
      console.log('Issue URL:', data.data.createIssue.issue.url || 'No URL in response');
      return data.data.createIssue.issue;
    } catch (error: any) {
      console.log('\n>>> GitHubClient.createIssue FAILED');
      console.log('>>> API call FAILED with error:', error.message);
      console.log('>>> Error type:', error.constructor.name);
      console.log('>>> Error code:', error.code);
      console.log('>>> Error status:', error.status);
      
      if (error.stderr) {
        console.log('>>> Error stderr:', error.stderr.toString());
      }
      
      // Critical: Check if this is a network error
      if (error.message.includes('fetch failed') || 
          error.message.includes('ENOTFOUND') || 
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('connect')) {
        console.log('>>> This appears to be a NETWORK ERROR - likely offline!');
      }
      
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
          `./create-sub-issue.sh "${childId}" "${parentId}"`,
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

  async discoverIssueTemplates(owner: string, repo: string): Promise<IssueTemplate[]> {
    try {
      const query = `
        query {
          repository(owner: "${owner}", name: "${repo}") {
            issueTypes(first: 20) {
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
      const templates: IssueTemplate[] = [];
      
      if (data.data.repository.issueTypes && data.data.repository.issueTypes.nodes) {
        for (const type of data.data.repository.issueTypes.nodes) {
          templates.push({
            id: type.id,
            name: type.name
          });
        }
      }
      
      return templates;
    } catch (error) {
      throw new Error(`Failed to discover issue templates: ${error}`);
    }
  }
  
  private escapeQuotes(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}