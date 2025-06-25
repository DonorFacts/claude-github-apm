import { TransformRule, DomainMapping } from './types';

export class CommandNameTransformer {
  private readonly domainMappings: DomainMapping[] = [
    { keywords: ['test', 'tdd', 'testing'], domain: 'test' },
    { keywords: ['git', 'commit', 'branch'], domain: 'git' },
    { keywords: ['code', 'pattern', 'patterns'], domain: 'code' },
    { keywords: ['review', 'security', 'checklist'], domain: 'review' },
    { keywords: ['project', 'issue', 'plan'], domain: 'project' },
    { keywords: ['docs', 'documentation', 'reflect'], domain: 'docs' },
    { keywords: ['debug', 'error', 'troubleshoot'], domain: 'debug' },
    { keywords: ['deploy', 'deployment', 'ci', 'cd'], domain: 'deploy' },
    { keywords: ['refactor', 'extract', 'clean'], domain: 'refactor' },
    { keywords: ['context', 'memory', 'sync'], domain: 'util' },
    { keywords: ['agent-ify', 'meta'], domain: 'meta' }
  ];
  
  private readonly specificMappings: Record<string, string> = {
    // Agent files
    'src/prompts/agents/init.md': 'agent-init-generic.md',
    'src/prompts/agents/developer/init.md': 'agent-init-developer.md',
    'src/prompts/agents/scrum-master/init.md': 'agent-init-scrum-master.md',
    'src/prompts/agents/prompt-engineer/init.md': 'agent-init-prompt-engineer.md',
    
    // Workflows
    'src/prompts/agents/developer/tdd-workflow.md': 'test-tdd-workflow.md',
    'src/prompts/commit.md': 'git-workflow-commit.md',
    'src/prompts/agents/developer/code-patterns.md': 'code-pattern-collection.md',
    'src/prompts/agents/developer/security-checklist.md': 'review-code-security.md',
    
    // Project management
    'src/prompts/agents/scrum-master/create-project-issues.md': 'project-issue-create-bulk.md',
    'src/prompts/agents/scrum-master/breakdown-project-plan.md': 'project-plan-breakdown.md',
    'src/prompts/agents/scrum-master/github-link-sub-issue.md': 'project-issue-link-github.md',
    
    // Utilities
    'src/prompts/context-save.md': 'util-context-save.md',
    'src/prompts/agent-ify.md': 'meta-agent-create.md',
    'src/prompts/reflect-for-docs.md': 'docs-generate-reflection.md',
    'src/prompts/team-knowledge-contribution.md': 'docs-knowledge-contribute.md',
    
    // Collaboration
    'src/prompts/agents/handover-quality.md': 'agent-handover-quality.md',
    'src/prompts/agents/inter-agent-collaboration.md': 'agent-collab-guidelines.md'
  };
  
  transform(sourcePath: string): string {
    // Check specific mappings first
    if (this.specificMappings[sourcePath]) {
      return this.specificMappings[sourcePath];
    }
    
    // Extract domain, category, and action
    const domain = this.getDomain(sourcePath);
    const category = this.getCategory(sourcePath, domain);
    const action = this.getAction(sourcePath);
    
    // Build the command name
    const parts = [domain];
    
    if (category !== 'general') {
      parts.push(category);
    }
    
    // Special handling for agents with role subdirectories
    if (domain === 'agent' && sourcePath.includes('/agents/') && !sourcePath.endsWith('/agents/init.md')) {
      const pathParts = sourcePath.split('/');
      const agentsIndex = pathParts.indexOf('agents');
      const roleIndex = agentsIndex + 1;
      
      // If there's a role directory between 'agents' and the filename
      if (roleIndex < pathParts.length - 1) {
        const role = pathParts[roleIndex];
        // Don't duplicate if role is already in the action
        if (!action.includes(role)) {
          parts.push(role);
        }
      }
    }
    
    parts.push(action);
    
    // Clean up and join
    const commandName = parts
      .filter(part => part && part !== 'general')
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${commandName}.md`;
  }
  
  getDomain(path: string): string {
    const normalizedPath = path.toLowerCase();
    const filename = this.getFilename(path);
    
    // Check if it's in agents directory first
    if (normalizedPath.includes('/agents/')) {
      // But check for specific domains within agent files
      for (const mapping of this.domainMappings) {
        for (const keyword of mapping.keywords) {
          const keywordRegex = new RegExp(`\\b${keyword}\\b`);
          if (keywordRegex.test(normalizedPath) || keywordRegex.test(filename)) {
            return mapping.domain;
          }
        }
      }
      return 'agent';
    }
    
    // Check keywords in path and filename with word boundaries
    for (const mapping of this.domainMappings) {
      for (const keyword of mapping.keywords) {
        // Use word boundary matching to avoid partial matches
        const keywordRegex = new RegExp(`\\b${keyword}\\b`);
        if (keywordRegex.test(normalizedPath) || keywordRegex.test(filename)) {
          return mapping.domain;
        }
      }
    }
    
    return 'misc';
  }
  
  getCategory(path: string, domain: string): string {
    const filename = this.getFilename(path);
    const parts = path.split('/');
    
    switch (domain) {
      case 'agent':
        if (filename === 'init.md') return 'init';
        if (path.includes('handover')) return 'handover';
        if (path.includes('collab')) return 'collab';
        if (path.includes('memory')) return 'memory';
        if (path.includes('inter-agent')) return 'collab';
        return 'general';
        
      case 'test':
        if (path.includes('tdd')) return 'tdd';
        if (path.includes('unit')) return 'unit';
        if (path.includes('integration')) return 'integration';
        if (path.includes('e2e')) return 'e2e';
        return 'general';
        
      case 'git':
        if (path.includes('workflow') || filename === 'commit.md') return 'workflow';
        if (path.includes('branch')) return 'branch';
        return 'general';
        
      case 'code':
        if (path.includes('pattern')) return 'pattern';
        if (path.includes('review')) return 'review';
        if (path.includes('generate')) return 'generate';
        return 'general';
        
      case 'project':
        if (path.includes('issue')) return 'issue';
        if (path.includes('plan')) return 'plan';
        return 'general';
        
      case 'docs':
        if (path.includes('generate') || path.includes('reflect')) return 'generate';
        if (path.includes('knowledge')) return 'knowledge';
        return 'general';
        
      default:
        return 'general';
    }
  }
  
  getAction(path: string): string {
    const filename = this.getFilename(path);
    const nameWithoutExt = filename.replace('.md', '');
    
    // For init files, use the role name
    if (filename === 'init.md') {
      const parts = path.split('/');
      const roleIndex = parts.indexOf('agents') + 1;
      if (roleIndex < parts.length - 1) {
        return parts[roleIndex].replace(/-/g, '-');
      }
      return 'generic';
    }
    
    // Extract action from filename
    const actionPatterns = [
      { pattern: /create-project-issues/, action: 'create' },
      { pattern: /breakdown-project-plan/, action: 'breakdown' },
      { pattern: /github-link-sub-issue/, action: 'link-github' },
      { pattern: /reflect-for-docs/, action: 'reflection' },
      { pattern: /team-knowledge-contribution/, action: 'contribute' },
      { pattern: /agent-ify/, action: 'create' },
      { pattern: /context-save/, action: 'save' },
      { pattern: /handover-quality/, action: 'quality' },
      { pattern: /inter-agent-collaboration/, action: 'guidelines' },
      { pattern: /tdd-workflow/, action: 'workflow' },
      { pattern: /code-patterns/, action: 'collection' },
      { pattern: /security-checklist/, action: 'security' },
      { pattern: /commit/, action: 'commit' }
    ];
    
    for (const { pattern, action } of actionPatterns) {
      if (pattern.test(nameWithoutExt)) {
        return action;
      }
    }
    
    // Default to the filename without extension
    return nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }
  
  private getFilename(path: string): string {
    return path.split('/').pop() || '';
  }
}