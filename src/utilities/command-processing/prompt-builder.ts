#!/usr/bin/env tsx

/**
 * Modern TypeScript version of the prompt build system
 * Migrated from create-command-files.js
 */

import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

interface BuildConfig {
  sourceDir: string;
  postProcessDir: string;
  outputDir: string;
  githubTemplatesDir: string;
}

export class PromptBuilder {
  private config: BuildConfig;

  constructor() {
    this.config = {
      sourceDir: '.apm/prompts',
      postProcessDir: 'lib/post-processing',
      outputDir: 'dist/prompts',
      githubTemplatesDir: 'lib/github-templates'
    };
  }

  async build(): Promise<void> {
    console.log('🔨 Building GitHub-enhanced APM prompts...\n');
    
    // Clean output directory
    await fs.emptyDir(this.config.outputDir);
    
    // Process original prompts
    await this.processPromptDirectory('originals');
    
    // Process ez commands
    await this.processPromptDirectory('ez');
    
    console.log('\n✅ Build complete! Prompts available in dist/prompts/');
  }

  private async processPromptDirectory(type: string): Promise<void> {
    const sourcePattern = path.join(this.config.sourceDir, type, '**/*.md');
    const files = await glob(sourcePattern);
    
    console.log(`\n📁 Processing ${type} prompts (${files.length} files)...`);
    
    for (const file of files) {
      await this.processPromptFile(file, type);
    }
  }

  private async processPromptFile(filePath: string, type: string): Promise<void> {
    // Read original prompt
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = matter(content);
    
    // Get relative path for matching post-processor
    const relativePath = path.relative(path.join(this.config.sourceDir, type), filePath);
    const postProcessPath = path.join(this.config.postProcessDir, type, relativePath);
    
    // Apply transformations
    let transformed = content;
    
    // 1. Apply post-processing if exists
    if (await fs.pathExists(postProcessPath)) {
      transformed = await this.applyPostProcessor(parsed, postProcessPath);
    }
    
    // 2. Inject GitHub context based on prompt type
    transformed = await this.injectGitHubContext(transformed, parsed.data);
    
    // 3. Add issue type awareness
    transformed = await this.addIssueTypeAwareness(transformed, relativePath);
    
    // Write to output
    const outputPath = path.join(this.config.outputDir, type, relativePath);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, transformed);
    
    console.log(`  ✓ ${relativePath}`);
  }

  private async applyPostProcessor(parsed: matter.GrayMatterFile<string>, postProcessPath: string): Promise<string> {
    const postProcess = await fs.readFile(postProcessPath, 'utf8');
    const postMatter = matter(postProcess);
    
    // Merge frontmatter
    const mergedData = { ...parsed.data, ...postMatter.data };
    
    // Apply transformations defined in post-processor
    let content = parsed.content;
    
    // Insert sections marked with {{INJECT:section_name}}
    const injections = postMatter.content.match(/## INJECT:(\w+)\n([\s\S]*?)(?=## |$)/g);
    if (injections) {
      for (const injection of injections) {
        const match = injection.match(/## INJECT:(\w+)\n([\s\S]*?)(?=## |$)/);
        if (match) {
          const [, sectionName, sectionContent] = match;
          content = content.replace(`{{${sectionName}}}`, sectionContent.trim());
        }
      }
    }
    
    // Prepend/append content
    if (postMatter.data.prepend) {
      content = postMatter.data.prepend + '\n\n' + content;
    }
    if (postMatter.data.append) {
      content = content + '\n\n' + postMatter.data.append;
    }
    
    return matter.stringify(content, mergedData);
  }

  private async injectGitHubContext(content: string, metadata: Record<string, any>): Promise<string> {
    // Add GitHub-specific context based on prompt metadata
    const githubContext: string[] = [];
    
    if (metadata.agent_type === 'manager') {
      githubContext.push(`
## GitHub Integration Context

- Use \`gh project\` commands to view project board status
- Create issues with appropriate type (phase/project/epic/feature)
- Link issues using parent-child relationships
- Update project board columns as work progresses
`);
    }
    
    if (metadata.agent_type === 'implementation') {
      githubContext.push(`
## GitHub Workflow

1. Check assigned issue: \`gh issue view <number>\`
2. Create feature branch: \`git checkout -b <issue-type>/<issue-number>-<brief-description>\`
3. Make atomic commits with conventional format
4. Create PR when ready: \`gh pr create --assignee @me --base main\`
5. Link PR to issue: Include "Closes #<issue-number>" in PR body
`);
    }
    
    if (githubContext.length > 0) {
      content = content.replace('{{GITHUB_CONTEXT}}', githubContext.join('\n'));
    }
    
    return content;
  }

  private async addIssueTypeAwareness(content: string, filePath: string): Promise<string> {
    // Map prompt types to issue types
    const issueTypeMap: Record<string, string[]> = {
      'manager-plan': ['phase', 'project', 'epic'],
      'task-prompt': ['feature', 'task'],
      'implement-': ['task'],
      'debug': ['bug'],
      'review': ['feature', 'epic']
    };
    
    for (const [pattern, types] of Object.entries(issueTypeMap)) {
      if (filePath.includes(pattern)) {
        const typeContext = `
### Relevant GitHub Issue Types

This workflow primarily creates/manages these issue types:
${types.map(t => `- **${t}**: ${this.getIssueTypeDescription(t)}`).join('\n')}

Use the appropriate issue type when creating GitHub issues.
`;
        content = content.replace('{{ISSUE_TYPES}}', typeContext);
        break;
      }
    }
    
    return content;
  }

  private getIssueTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      phase: 'Strategic milestone (e.g., "Phase 1: MVP")',
      project: 'Major initiative within a phase',
      epic: 'Collection of related features',
      feature: 'User-facing capability',
      task: 'Implementation work unit',
      bug: 'Defect to be fixed'
    };
    return descriptions[type] || type;
  }
}

/**
 * Export for use by other modules
 */
export async function createCommandFiles(workingDir: string, packageRoot: string): Promise<void> {
  const builder = new PromptBuilder();
  // Set working directory context if needed
  process.chdir(workingDir);
  await builder.build();
}

// Run if called directly
if (require.main === module) {
  const builder = new PromptBuilder();
  builder.build().catch(console.error);
}