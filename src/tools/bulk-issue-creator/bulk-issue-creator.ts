/**
 * Bulk Issue Creator - Creates GitHub issues from Implementation Plan YAML
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { GitHubClient } from './github-client';
import { 
  ImplementationPlan, 
  PlanItem, 
  CreationProgress, 
  GitHubIssueInput,
  RelationshipBatch 
} from './types';

export class BulkIssueCreator {
  private plan: ImplementationPlan;
  private githubClient: GitHubClient;
  private progress: CreationProgress;
  private itemMap: Map<string, PlanItem>;
  private BATCH_SIZE = 20; // GitHub performs better with smaller batches

  constructor(planPath: string) {
    this.loadPlan(planPath);
    this.githubClient = new GitHubClient(
      this.plan.project.repository.owner,
      this.plan.project.repository.name
    );
    this.progress = {
      total: this.plan.items.length,
      created: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    // Create a map for quick item lookup
    this.itemMap = new Map(this.plan.items.map(item => [item.id, item]));
  }

  /**
   * Load and validate the implementation plan
   */
  private loadPlan(planPath: string): void {
    try {
      const fileContent = fs.readFileSync(planPath, 'utf8');
      this.plan = yaml.load(fileContent) as ImplementationPlan;
      this.validatePlan();
    } catch (error) {
      throw new Error(`Failed to load plan: ${error}`);
    }
  }

  /**
   * Validate plan structure and relationships
   */
  private validatePlan(): void {
    // Check all parent references exist
    for (const item of this.plan.items) {
      if (item.parent_id && !this.itemMap.has(item.parent_id)) {
        throw new Error(`Item ${item.id} references non-existent parent ${item.parent_id}`);
      }
    }

    // Validate execution plan references
    for (const level of this.plan.execution.create_order) {
      for (const itemId of level.items) {
        if (!this.itemMap.has(itemId)) {
          throw new Error(`Execution plan references non-existent item ${itemId}`);
        }
      }
    }
  }

  /**
   * Main execution method
   */
  async execute(): Promise<void> {
    console.log(`🚀 Starting bulk issue creation for ${this.plan.items.length} items\n`);

    // Phase 1: Create all issues
    await this.createIssues();

    // Phase 2: Create relationships
    await this.createRelationships();

    // Phase 3: Update plan file with issue numbers
    await this.updatePlanFile();

    // Report results
    this.reportResults();
  }

  /**
   * Create issues level by level
   */
  private async createIssues(): Promise<void> {
    for (const level of this.plan.execution.create_order) {
      console.log(`\n📋 Creating Level ${level.level} issues (${level.items.length} items)`);
      
      // Process items in batches
      for (let i = 0; i < level.items.length; i += this.BATCH_SIZE) {
        const batch = level.items.slice(i, i + this.BATCH_SIZE);
        await this.createIssueBatch(batch);
      }
    }
  }

  /**
   * Create a batch of issues
   */
  private async createIssueBatch(itemIds: string[]): Promise<void> {
    const inputs: Array<{ alias: string; input: GitHubIssueInput }> = [];

    for (const itemId of itemIds) {
      const item = this.itemMap.get(itemId)!;
      
      // Skip if already has issue number
      if (item.issue_number) {
        console.log(`⏭️  Skipping ${item.title} (already created as #${item.issue_number})`);
        this.progress.skipped++;
        continue;
      }

      // Check if issue already exists
      const existingNumber = await this.githubClient.findExistingIssue(item.title);
      if (existingNumber) {
        console.log(`✅ Found existing issue #${existingNumber} for "${item.title}"`);
        item.issue_number = existingNumber;
        this.progress.skipped++;
        continue;
      }

      // Prepare input for creation
      const input: GitHubIssueInput = {
        repositoryId: this.githubClient['repositoryId'],
        title: item.title,
        body: this.formatIssueBody(item),
        issueTypeId: this.plan.issue_types[item.type]
      };

      inputs.push({
        alias: `issue_${itemId.replace(/-/g, '_')}`, // GraphQL aliases can't have hyphens
        input
      });
    }

    if (inputs.length === 0) return;

    try {
      console.log(`\n🔄 Creating batch of ${inputs.length} issues...`);
      const results = await this.githubClient.createIssuesBatch(inputs);
      
      // Update items with issue numbers
      for (const { alias } of inputs) {
        const itemId = alias.replace('issue_', '').replace(/_/g, '-');
        const item = this.itemMap.get(itemId)!;
        const result = results[alias];
        
        if (result?.issue) {
          item.issue_number = result.issue.number;
          console.log(`✅ Created #${result.issue.number}: ${item.title}`);
          this.progress.created++;
        } else {
          console.error(`❌ Failed to create issue for ${item.title}`);
          this.progress.failed++;
          this.progress.errors.push({
            itemId,
            error: 'No issue number returned'
          });
        }
      }
    } catch (error) {
      console.error(`❌ Batch creation failed:`, error);
      
      // Fall back to individual creation
      console.log(`🔄 Falling back to individual creation...`);
      for (const { alias, input } of inputs) {
        const itemId = alias.replace('issue_', '').replace(/_/g, '-');
        await this.createIssueSingle(itemId, input);
      }
    }
  }

  /**
   * Create a single issue (fallback)
   */
  private async createIssueSingle(itemId: string, input: GitHubIssueInput): Promise<void> {
    const item = this.itemMap.get(itemId)!;
    
    try {
      const result = await this.githubClient.createIssue(input);
      item.issue_number = result.issue.number;
      console.log(`✅ Created #${result.issue.number}: ${item.title}`);
      this.progress.created++;
    } catch (error) {
      console.error(`❌ Failed to create issue for ${item.title}: ${error}`);
      this.progress.failed++;
      this.progress.errors.push({
        itemId,
        error: String(error)
      });
    }
  }

  /**
   * Format issue body with all metadata
   */
  private formatIssueBody(item: PlanItem): string {
    let body = item.description;

    // Add metadata section if present
    if (item.metadata) {
      body += '\n\n---\n\n## Metadata\n';
      
      if (item.metadata.agent) {
        body += `\n**Assigned Agent:** ${item.metadata.agent}`;
      }
      if (item.metadata.priority) {
        body += `\n**Priority:** ${item.metadata.priority}`;
      }
      if (item.metadata.estimate) {
        body += `\n**Estimate:** ${item.metadata.estimate}`;
      }
    }

    // Add relationship info
    if (item.parent_id) {
      const parent = this.itemMap.get(item.parent_id);
      if (parent) {
        body += `\n\n---\n\n*Part of: ${parent.title}*`;
      }
    }

    return body;
  }

  /**
   * Create parent-child relationships
   */
  private async createRelationships(): Promise<void> {
    console.log('\n\n🔗 Creating issue relationships...\n');

    const relationships: Array<{ parentNumber: number; childNumber: number }> = [];

    // Collect all relationships
    for (const item of this.plan.items) {
      if (item.parent_id && item.issue_number) {
        const parent = this.itemMap.get(item.parent_id);
        if (parent?.issue_number) {
          relationships.push({
            parentNumber: parent.issue_number,
            childNumber: item.issue_number
          });
        }
      }
    }

    // Group by parent for efficiency
    const byParent = new Map<number, number[]>();
    for (const rel of relationships) {
      if (!byParent.has(rel.parentNumber)) {
        byParent.set(rel.parentNumber, []);
      }
      byParent.get(rel.parentNumber)!.push(rel.childNumber);
    }

    // Create relationships
    console.log(`Creating ${relationships.length} relationships across ${byParent.size} parent issues`);
    
    for (const [parentNumber, children] of byParent) {
      console.log(`\n🔗 Linking ${children.length} sub-issues to #${parentNumber}`);
      const rels = children.map(childNumber => ({ parentNumber, childNumber }));
      await this.githubClient.createSubIssueRelationships(rels);
    }
  }

  /**
   * Update the YAML plan file with issue numbers
   */
  private async updatePlanFile(): Promise<void> {
    console.log('\n\n📝 Updating plan file with issue numbers...');

    // Update the plan object
    this.plan.items = Array.from(this.itemMap.values());

    // Update relationships in execution plan
    const relationshipBatches: RelationshipBatch[] = [];
    const parentMap = new Map<number, number[]>();

    for (const item of this.plan.items) {
      if (item.parent_id && item.issue_number) {
        const parent = this.itemMap.get(item.parent_id);
        if (parent?.issue_number) {
          if (!parentMap.has(parent.issue_number)) {
            parentMap.set(parent.issue_number, []);
          }
          parentMap.get(parent.issue_number)!.push(item.issue_number);
        }
      }
    }

    for (const [parentIssue, childIssues] of parentMap) {
      relationshipBatches.push({ parent_issue: parentIssue, child_issues: childIssues });
    }

    this.plan.execution.relationships = relationshipBatches;

    // Save updated plan
    const updatedYaml = yaml.dump(this.plan, { lineWidth: -1 });
    const backupPath = this.planPath.replace('.yaml', '.backup.yaml');
    
    // Create backup
    fs.copyFileSync(this.planPath, backupPath);
    
    // Write updated plan
    fs.writeFileSync(this.planPath, updatedYaml);
    
    console.log(`✅ Plan file updated (backup saved to ${backupPath})`);
  }

  /**
   * Report creation results
   */
  private reportResults(): void {
    console.log('\n\n📊 Issue Creation Summary');
    console.log('========================\n');
    console.log(`Total items:    ${this.progress.total}`);
    console.log(`Created:        ${this.progress.created} ✅`);
    console.log(`Skipped:        ${this.progress.skipped} ⏭️`);
    console.log(`Failed:         ${this.progress.failed} ❌`);

    if (this.progress.errors.length > 0) {
      console.log('\n\n❌ Errors:');
      for (const error of this.progress.errors) {
        const item = this.itemMap.get(error.itemId);
        console.log(`\n- ${item?.title || error.itemId}`);
        console.log(`  ${error.error}`);
      }
    }

    // List all created issues by level
    console.log('\n\n📋 Created Issues by Level:');
    for (const level of this.plan.execution.create_order) {
      console.log(`\nLevel ${level.level}:`);
      for (const itemId of level.items) {
        const item = this.itemMap.get(itemId);
        if (item?.issue_number) {
          console.log(`  #${item.issue_number} - ${item.title}`);
        }
      }
    }

    console.log('\n\n✅ Bulk issue creation completed!');
    console.log(`\nView all issues: https://github.com/${this.plan.project.repository.owner}/${this.plan.project.repository.name}/issues`);
  }

  private get planPath(): string {
    return 'src/tools/implementation-plan.yaml';
  }
}