import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { 
  ImplementationPlan, 
  PlanItem, 
  CreationResult
} from './types';
import { GitHubClient } from './GitHubClient';
import { IGitHubClient } from './interfaces';

export class BulkIssueCreator {
  private plan: ImplementationPlan;
  private planPath: string;
  private itemMap: Map<string, PlanItem>;
  private githubClient: IGitHubClient;
  private result: CreationResult;
  
  constructor(planPath: string, githubClient?: IGitHubClient) {
    this.planPath = planPath;
    this.githubClient = githubClient || new GitHubClient();
    this.result = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    // Load and validate plan
    this.plan = this.loadPlan();
    this.itemMap = this.buildItemMap();
    this.validatePlan();
  }
  
  private loadPlan(): ImplementationPlan {
    try {
      const content = fs.readFileSync(this.planPath, 'utf-8');
      return yaml.load(content) as ImplementationPlan;
    } catch (error) {
      throw new Error(`Failed to load plan: ${error}`);
    }
  }
  
  private buildItemMap(): Map<string, PlanItem> {
    const map = new Map<string, PlanItem>();
    for (const item of this.plan.items) {
      map.set(item.id, item);
    }
    return map;
  }
  
  private validatePlan(): void {
    // Validate parent references
    for (const item of this.plan.items) {
      if (item.parent_id && !this.itemMap.has(item.parent_id)) {
        throw new Error(`Item ${item.id} references non-existent parent ${item.parent_id}`);
      }
      
      // Validate required fields
      if (!item.title) {
        throw new Error(`Item ${item.id} is missing required field: title`);
      }
      if (!item.type) {
        throw new Error(`Item ${item.id} is missing required field: type`);
      }
      
      // Validate issue type
      if (!this.plan.issue_types[item.type]) {
        throw new Error(`Item ${item.id} has invalid issue type: ${item.type}`);
      }
    }
  }
  
  async execute(): Promise<CreationResult> {
    console.log('Starting bulk issue creation...');
    
    // Create backup
    this.createBackup();
    
    // Get repository ID
    const repoId = await this.githubClient.getRepositoryId();
    
    // Create issues level by level
    const levels = this.groupByLevel();
    for (const [level, items] of levels) {
      console.log(`\nCreating level ${level} issues (${items.length} items)...`);
      await this.createIssues(items, repoId);
    }
    
    // Create relationships
    console.log('\nCreating parent-child relationships...');
    await this.createRelationships();
    
    // Update plan file with issue numbers
    this.updatePlanFile();
    
    // Report results
    this.reportResults();
    
    return this.result;
  }
  
  private createBackup(): void {
    const backupPath = this.planPath.replace('.yaml', '.backup.yaml');
    fs.copyFileSync(this.planPath, backupPath);
    console.log(`Created backup at ${backupPath}`);
  }
  
  private groupByLevel(): Map<number, PlanItem[]> {
    const levels = new Map<number, PlanItem[]>();
    
    // Calculate level for each item
    const getLevel = (item: PlanItem): number => {
      if (!item.parent_id) return 0;
      const parent = this.itemMap.get(item.parent_id);
      if (!parent) return 0;
      return getLevel(parent) + 1;
    };
    
    // Group items by level
    for (const item of this.plan.items) {
      const level = getLevel(item);
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(item);
    }
    
    // Sort levels
    return new Map([...levels.entries()].sort((a, b) => a[0] - b[0]));
  }
  
  private async createIssues(items: PlanItem[], repoId: string): Promise<void> {
    // Filter out items that already have issue numbers
    const itemsToCreate = items.filter(item => !item.issue_number);
    
    if (itemsToCreate.length === 0) {
      console.log('All items at this level already have issue numbers');
      this.result.skipped += items.length;
      return;
    }
    
    // Update skipped count
    this.result.skipped += items.length - itemsToCreate.length;
    
    // Create in batches of 20
    const batchSize = 20;
    for (let i = 0; i < itemsToCreate.length; i += batchSize) {
      const batch = itemsToCreate.slice(i, i + batchSize);
      await this.createIssueBatch(batch, repoId);
    }
  }
  
  private async createIssueBatch(items: PlanItem[], repoId: string): Promise<void> {
    if (items.length === 0) return;
    
    try {
      if (items.length === 1) {
        // Single issue, use regular creation
        await this.createIssueSingle(items[0], repoId);
      } else {
        // Multiple issues, use batch creation
        const issues = items.map(item => {
          const issueType = this.plan.issue_types[item.type];
          if (!issueType) {
            throw new Error(`No issue type mapping for type: ${item.type}`);
          }
          return {
            title: item.title,
            body: this.formatIssueBody(item),
            issueType,
            repositoryId: repoId
          };
        });
        
        const result = await this.githubClient.createIssuesBatch(issues);
        
        // Process results
        items.forEach((item, index) => {
          const alias = `issue${index}`;
          const issueData = (result.data as any)[alias];
          if (issueData?.issue) {
            const issue = issueData.issue;
            item.issue_number = issue.number;
            item.github_id = issue.id;
            this.result.created++;
            console.log(`Created #${issue.number}: ${item.title}`);
          } else {
            this.result.failed++;
            this.result.errors.push(`Failed to create issue: ${item.title}`);
          }
        });
      }
    } catch (error) {
      console.error('Batch creation failed, falling back to individual creation:', error);
      
      // Fallback to individual creation
      for (const item of items) {
        await this.createIssueSingle(item, repoId);
      }
    }
  }
  
  private async createIssueSingle(item: PlanItem, repoId: string): Promise<void> {
    try {
      const issueType = this.plan.issue_types[item.type];
      if (!issueType) {
        throw new Error(`No issue type mapping for type: ${item.type}`);
      }
      const issue = await this.githubClient.createIssue({
        title: item.title,
        body: this.formatIssueBody(item),
        issueType,
        repositoryId: repoId
      });
      
      item.issue_number = issue.number;
      item.github_id = issue.id;
      this.result.created++;
      console.log(`Created #${issue.number}: ${item.title}`);
    } catch (error) {
      this.result.failed++;
      this.result.errors.push(`Failed to create issue "${item.title}": ${error}`);
      console.error(`Failed to create issue: ${item.title}`, error);
    }
  }
  
  private formatIssueBody(item: PlanItem): string {
    let body = item.description || '';
    
    // Add metadata section if present
    if (item.metadata && Object.keys(item.metadata).length > 0) {
      body += '\n\n## Metadata\n';
      for (const [key, value] of Object.entries(item.metadata)) {
        body += `- **${key}**: ${value}\n`;
      }
    }
    
    // Add hierarchy reference
    body += '\n\n---\n';
    body += `*Created by APM Bulk Issue Creator*\n`;
    body += `*Plan ID: ${item.id}*`;
    
    return body;
  }
  
  private async createRelationships(): Promise<void> {
    // Group children by parent
    const relationshipMap = new Map<string, string[]>();
    
    for (const item of this.plan.items) {
      if (item.parent_id && item.github_id) {
        const parent = this.itemMap.get(item.parent_id);
        if (parent?.github_id) {
          if (!relationshipMap.has(parent.github_id)) {
            relationshipMap.set(parent.github_id, []);
          }
          relationshipMap.get(parent.github_id)!.push(item.github_id);
        }
      }
    }
    
    // Create relationships in batches
    for (const [parentId, childIds] of relationshipMap) {
      try {
        await this.githubClient.createSubIssueRelationships(parentId, childIds);
        console.log(`Created relationships: parent ${parentId} -> ${childIds.length} children`);
      } catch (error) {
        this.result.errors.push(`Failed to create relationships for parent ${parentId}: ${error}`);
        console.error(`Failed to create relationships:`, error);
      }
    }
  }
  
  protected updatePlanFile(): void {
    try {
      // Write updated plan back to file
      const updatedYaml = yaml.dump(this.plan, { lineWidth: -1 });
      fs.writeFileSync(this.planPath, updatedYaml);
      console.log(`\nUpdated plan file with issue numbers`);
    } catch (error) {
      console.error('Failed to update plan file:', error);
      this.result.errors.push(`Failed to update plan file: ${error}`);
    }
  }
  
  private reportResults(): void {
    console.log('\n=== Creation Summary ===');
    console.log(`Created: ${this.result.created} issues`);
    console.log(`Skipped: ${this.result.skipped} issues (already exist)`);
    console.log(`Failed: ${this.result.failed} issues`);
    
    if (this.result.errors.length > 0) {
      console.log('\nErrors:');
      this.result.errors.forEach(error => console.log(`- ${error}`));
    }
  }
}