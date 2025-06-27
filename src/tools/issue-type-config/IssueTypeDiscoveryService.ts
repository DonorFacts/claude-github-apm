import { IGitHubClient } from '../bulk-issue-creator/interfaces';
import { IssueTypes } from '../bulk-issue-creator/types';

export class IssueTypeDiscoveryService {
  constructor(private githubClient: IGitHubClient) {}

  async discoverIssueTypes(owner: string, repo: string): Promise<IssueTypes> {
    try {
      const templates = await this.githubClient.discoverIssueTemplates(owner, repo);
      
      const issueTypes: IssueTypes = {};
      
      for (const template of templates) {
        const normalizedType = this.normalizeTemplateName(template.name);
        if (normalizedType) {
          issueTypes[normalizedType] = template.id;
        }
      }
      
      return issueTypes;
    } catch (error) {
      throw new Error(`Failed to discover issue types: ${error instanceof Error ? error.message : error}`);
    }
  }

  private normalizeTemplateName(name: string): string | null {
    const normalizedName = name.toLowerCase().trim();
    
    // Map common template names to standard types
    const typeMapping: Record<string, string> = {
      'phase': 'phase',
      'project': 'project', 
      'epic': 'epic',
      'feature': 'feature',
      'user story': 'story',
      'story': 'story',
      'task': 'task',
      'task - development': 'task',
      'bug': 'bug',
      'documentation': 'doc',
      'doc': 'doc'
    };

    // First try exact match
    if (typeMapping[normalizedName]) {
      return typeMapping[normalizedName];
    }

    // Then try partial matches
    for (const [pattern, type] of Object.entries(typeMapping)) {
      if (normalizedName.includes(pattern)) {
        return type;
      }
    }

    // If no match found, use the first word as the type
    const firstWord = normalizedName.split(/[\s-_]+/)[0];
    return firstWord || null;
  }
}