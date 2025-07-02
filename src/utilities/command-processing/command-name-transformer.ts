export class CommandNameTransformer {
  transform(filePath: string): string {
    // Remove src/prompts/ prefix and .md extension
    const cleanPath = filePath
      .replace(/^src\/prompts\//, '')
      .replace(/\.md$/, '');
    
    // For root level files, just return the filename
    if (!cleanPath.includes('/')) {
      return `${cleanPath}.md`;
    }
    
    // For nested files, flatten the path with hyphens
    // e.g., git/worktrees/create -> git-worktree-create
    const parts = cleanPath.split('/').filter(p => p.length > 0); // Remove empty segments
    
    // Special handling for pluralization
    // Convert plural directory names to singular for better command names
    const transformedParts = parts.map((part, index) => {
      // Don't transform the last part (filename)
      if (index === parts.length - 1) return part;
      
      // Common plural to singular transformations
      const pluralToSingular: Record<string, string> = {
        'worktrees': 'worktree',
        'issues': 'issue',
        'agents': 'agent',
        'patterns': 'pattern',
        'prompts': 'prompt',
        'commits': 'commit',
        'branches': 'branch'
      };
      
      return pluralToSingular[part] || part;
    });
    
    // Join all parts with hyphens
    return `${transformedParts.join('-')}.md`;
  }
}