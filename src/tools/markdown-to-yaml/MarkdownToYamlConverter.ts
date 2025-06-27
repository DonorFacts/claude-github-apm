import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { 
  ImplementationPlan, 
  PlanItem, 
  IssueTypes,
  Repository 
} from '../bulk-issue-creator/types';
import { MarkdownHeader, MarkdownListItem, ParseContext } from './types';
import { IssueTypeConfigManager } from '../issue-type-config/IssueTypeConfigManager';

export class MarkdownToYamlConverter {
  private issueTypes: IssueTypes;
  private idMap: Map<string, string> = new Map();
  private configManager: IssueTypeConfigManager;
  
  constructor(issueTypes?: IssueTypes, configPath?: string) {
    this.configManager = new IssueTypeConfigManager(
      configPath || path.join(process.cwd(), 'apm', 'issue-types.json')
    );
    
    // Use provided issue types or fall back to defaults
    this.issueTypes = issueTypes || {
      phase: 'IT_kwDODIcSxM4BoTQQ',
      project: 'IT_kwDODIcSxM4BoTQm',
      epic: 'IT_kwDODIcSxM4BoSKl',
      feature: 'IT_kwDODIcSxM4Bl1xX',
      story: 'IT_kwDODIcSxM4Bofqc',
      task: 'IT_kwDODIcSxM4Bl1xV',
      bug: 'IT_kwDODIcSxM4Bl1xW',
      doc: 'IT_kwDODIcSxM4Bl1xV'
    };
  }
  
  async loadIssueTypesFromConfig(): Promise<void> {
    if (this.configManager.configExists()) {
      const configTypes = await this.configManager.loadConfig();
      if (Object.keys(configTypes).length > 0) {
        this.issueTypes = { ...this.issueTypes, ...configTypes };
      }
    }
  }

  parseMarkdown(markdown: string, repository: Repository): ImplementationPlan {
    const lines = markdown.split('\n');
    const items: PlanItem[] = [];
    const context: ParseContext = {
      parentStack: []
    };
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      
      // Parse headers (##, ###, ####)
      const headerMatch = line.match(/^(#{2,4})\s+(.+)$/);
      if (headerMatch) {
        const header = this.parseHeader(headerMatch[1], headerMatch[2]);
        const item = this.createItemFromHeader(header, context, headerMatch[2]);
        if (item) {
          items.push(item);
          this.updateContext(context, item, header.level);
        }
        i++;
        continue;
      }
      
      // Parse numbered list items
      const listMatch = line.match(/^(\d+)\.\s+\*\*(\w+)\*\*:\s+(.+)$/);
      if (listMatch) {
        const listItem = this.parseListItem(listMatch[2], listMatch[3], lines, i);
        const item = this.createItemFromListItem(listItem, context);
        items.push(item);
        i += listItem.description.length + 1;
        continue;
      }
      
      i++;
    }
    
    // Build parent-child relationships
    this.buildRelationships(items);
    
    return {
      version: '1.0',
      generated: new Date().toISOString().split('T')[0],
      project: {
        name: this.extractProjectName(markdown),
        description: this.extractProjectDescription(markdown),
        repository
      },
      issue_types: this.issueTypes,
      items
    };
  }
  
  private parseHeader(hashes: string, text: string): MarkdownHeader {
    const level = hashes.length;
    
    // Extract issue number [#123]
    const issueMatch = text.match(/\[#(\d+)\]/);
    const issueNumber = issueMatch ? parseInt(issueMatch[1]) : undefined;
    
    // Remove issue number from text
    let cleanText = text.replace(/\[#\d+\]\s*/, '');
    
    // Extract metadata from parentheses
    const metadata: Record<string, any> = {};
    const complexMatch = cleanText.match(/\(Complex\)/i);
    if (complexMatch) {
      metadata.complex = true;
      cleanText = cleanText.replace(/\(Complex\)/i, '').trim();
    }
    
    // Extract title (remove prefixes like "Phase 1:", "Epic 1.1 -", etc.)
    const titleMatch = cleanText.match(/^(?:Phase|Project|Epic|Feature|Story|Task|Bug|Doc)?\s*[\d.]*\s*[-:]?\s*(.+)$/);
    const title = titleMatch ? titleMatch[1].trim() : cleanText.trim();
    
    return { level, text: title, issueNumber, metadata };
  }
  
  private parseListItem(type: string, titleText: string, lines: string[], startIndex: number): MarkdownListItem {
    // Extract issue number
    const issueMatch = titleText.match(/\[#(\d+)\]/);
    const issueNumber = issueMatch ? parseInt(issueMatch[1]) : undefined;
    
    // Clean title
    let title = titleText.replace(/\[#\d+\]\s*/, '').trim();
    
    // Extract metadata from parentheses
    const metadata: Record<string, any> = {};
    const agentMatch = title.match(/^\(([^)]+)\)\s*/);
    if (agentMatch) {
      const agents = agentMatch[1].split(/,\s*/);
      if (agents.length === 1) {
        metadata.agent = agents[0];
      } else {
        metadata.agents = agents;
      }
      title = title.replace(/^\([^)]+\)\s*/, '');
    }
    
    // Collect description lines
    const description: string[] = [];
    let i = startIndex + 1;
    while (i < lines.length && (lines[i].match(/^\s*[-_]/) || lines[i].match(/^\s*$/))) {
      const line = lines[i].trim();
      if (line.startsWith('-')) {
        description.push(line);
      } else if (line.startsWith('_') && line.endsWith('_')) {
        // Handle guidance/notes
        description.push(line);
      }
      i++;
    }
    
    return {
      type: type.toLowerCase(),
      title,
      issueNumber,
      metadata,
      description
    };
  }
  
  private createItemFromHeader(header: MarkdownHeader, context: ParseContext, fullText?: string): PlanItem | null {
    const type = this.detectTypeFromHeader(header, context, fullText);
    if (!type) return null;
    
    const id = this.generateId(type, header.text);
    const parentId = this.getParentId(header.level, context);
    
    const item: PlanItem = {
      id,
      type,
      title: header.text,
      description: '',
      parent_id: parentId,
      children_ids: []
    };
    
    if (header.issueNumber) {
      item.issue_number = header.issueNumber;
    }
    
    if (header.metadata && Object.keys(header.metadata).length > 0) {
      item.metadata = header.metadata;
    }
    
    return item;
  }
  
  private createItemFromListItem(listItem: MarkdownListItem, context: ParseContext): PlanItem {
    const id = this.generateId(listItem.type, listItem.title);
    const parentId = this.getCurrentParent(context);
    
    const item: PlanItem = {
      id,
      type: listItem.type as string,
      title: listItem.title,
      description: this.formatDescription(listItem.description),
      parent_id: parentId,
      children_ids: []
    };
    
    if (listItem.issueNumber) {
      item.issue_number = listItem.issueNumber;
    }
    
    if (listItem.metadata && Object.keys(listItem.metadata).length > 0) {
      item.metadata = listItem.metadata;
    }
    
    return item;
  }
  
  private detectTypeFromHeader(header: MarkdownHeader, context: ParseContext, fullText?: string): string | null {
    const textToCheck = fullText || header.text;
    const level = header.level;
    
    // Check explicit type indicators in original text (case-insensitive)
    const typePatterns: { pattern: RegExp, type: string }[] = [
      { pattern: /\bphase\b/i, type: 'phase' },
      { pattern: /\bproject\b/i, type: 'project' },
      { pattern: /\bepic\b/i, type: 'epic' },
      { pattern: /\bfeature\b/i, type: 'feature' },
      { pattern: /\bstory\b/i, type: 'story' },
      { pattern: /\btask\b/i, type: 'task' },
      { pattern: /\bbug\b/i, type: 'bug' },
      { pattern: /\bdoc\b/i, type: 'doc' }
    ];
    
    // Check the full line text that might have been stripped
    for (const { pattern, type } of typePatterns) {
      if (pattern.test(textToCheck)) {
        return type;
      }
    }
    
    // Infer from header level if no explicit type found
    if (level === 2) return 'phase';
    if (level === 3) {
      // Could be project or epic depending on parent
      if (context.currentPhase && !context.currentProject) {
        return 'epic'; // Default to epic unless explicitly marked as project
      }
      return 'epic';
    }
    if (level === 4) return 'feature';
    
    return null;
  }
  
  private updateContext(context: ParseContext, item: PlanItem, level: number): void {
    // Update parent stack based on level
    const stackIndex = level - 2; // ## = 0, ### = 1, #### = 2
    context.parentStack = context.parentStack.slice(0, stackIndex);
    context.parentStack.push(item.id);
    
    // Update specific context fields
    switch (item.type) {
      case 'phase':
        context.currentPhase = item.id;
        context.currentProject = undefined;
        context.currentEpic = undefined;
        context.currentFeature = undefined;
        break;
      case 'project':
        context.currentProject = item.id;
        context.currentEpic = undefined;
        context.currentFeature = undefined;
        break;
      case 'epic':
        context.currentEpic = item.id;
        context.currentFeature = undefined;
        break;
      case 'feature':
        context.currentFeature = item.id;
        break;
    }
  }
  
  private getParentId(level: number, context: ParseContext): string | null {
    const parentIndex = level - 3; // ## = -1 (no parent), ### = 0, #### = 1
    if (parentIndex < 0 || parentIndex >= context.parentStack.length) {
      return null;
    }
    return context.parentStack[parentIndex];
  }
  
  private getCurrentParent(context: ParseContext): string | null {
    if (context.parentStack.length === 0) return null;
    return context.parentStack[context.parentStack.length - 1];
  }
  
  private generateId(type: string, title: string): string {
    // Create a base ID from type and title
    const baseId = `${type}-${title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30)}`;
    
    // Check for duplicates and append counter if needed
    let id = baseId;
    let counter = 1;
    while (this.idMap.has(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    
    this.idMap.set(id, title);
    return id;
  }
  
  private formatDescription(lines: string[]): string {
    return lines
      .map(line => {
        // Convert guidance format
        if (line.startsWith('_') && line.endsWith('_')) {
          return line.replace(/^_/, '').replace(/_$/, '');
        }
        return line;
      })
      .join('\n');
  }
  
  private buildRelationships(items: PlanItem[]): void {
    // Build a map for quick lookup
    const itemMap = new Map<string, PlanItem>();
    items.forEach(item => itemMap.set(item.id, item));
    
    // Build children_ids arrays
    items.forEach(item => {
      if (item.parent_id) {
        const parent = itemMap.get(item.parent_id);
        if (parent) {
          parent.children_ids.push(item.id);
        }
      }
    });
  }
  
  private extractProjectName(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m);
    if (match) {
      return match[1].replace(/Implementation Plan/i, '').trim() || 'Project';
    }
    return 'Project';
  }
  
  private extractProjectDescription(markdown: string): string {
    const lines = markdown.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/^#\s+/)) {
        // Look for description in next non-empty line
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          const line = lines[j].trim();
          if (line && !line.startsWith('#') && !line.startsWith('Project Goal:')) {
            return line;
          }
          if (line.startsWith('Project Goal:')) {
            return line.replace('Project Goal:', '').trim();
          }
        }
      }
    }
    return 'Implementation plan for the project';
  }
  
  async convertFile(
    inputPath: string, 
    outputPath?: string,
    repository?: Repository
  ): Promise<void> {
    // Read input file
    const markdown = fs.readFileSync(inputPath, 'utf-8');
    
    // Determine repository info
    if (!repository) {
      // Try to extract from git
      try {
        const { execSync } = require('child_process');
        const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
        const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
        if (match) {
          repository = {
            owner: match[1],
            name: match[2]
          };
        }
      } catch {
        // Default if git info not available
        repository = {
          owner: 'owner',
          name: 'repo'
        };
      }
    }
    
    // Parse markdown
    const plan = this.parseMarkdown(markdown, repository!);
    
    // Determine output path
    if (!outputPath) {
      outputPath = inputPath.replace(/\.md$/, '.yaml');
    }
    
    // Write YAML
    const yamlContent = yaml.dump(plan, { lineWidth: -1 });
    fs.writeFileSync(outputPath, yamlContent);
  }
}