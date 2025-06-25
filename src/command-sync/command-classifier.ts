import { PromptFile, ClassificationResult } from './types';

export class CommandClassifier {
  private readonly excludedDirs = ['wip', 'test', '_x_', 'templates', 'includes'];
  
  classifyPrompts(files: Map<string, PromptFile>): ClassificationResult {
    const publicCommands: string[] = [];
    const privateIncludes: string[] = [];
    
    // First pass: identify obvious private files
    const obviouslyPrivate = new Set<string>();
    
    for (const [path, file] of files) {
      // Check excluded directories
      if (this.isInExcludedDirectory(path)) {
        obviouslyPrivate.add(path);
        continue;
      }
      
      // Check if file is empty
      if (!file.content.trim()) {
        obviouslyPrivate.add(path);
        continue;
      }
    }
    
    // Simple algorithm:
    // 1. Files not imported by anyone are public (entry points)
    // 2. Files imported by others are private (dependencies)
    // Exception: Files with substantial content and no imports might be public even if imported
    
    for (const [path, file] of files) {
      // Skip obviously private files
      if (obviouslyPrivate.has(path)) {
        privateIncludes.push(path);
        continue;
      }
      
      // Not imported by anyone = public command
      if (file.importedBy.length === 0) {
        publicCommands.push(path);
        continue;
      }
      
      // Imported by others = usually private
      // Exception: substantial content with no imports could be dual-use
      if (file.imports.length === 0 && this.hasSubstantialContent(file)) {
        // File can be both imported AND used standalone
        publicCommands.push(path);
        continue;
      }
      
      // Default: imported files are private
      privateIncludes.push(path);
    }
    
    // Handle circular dependencies - if two files only import each other, both are private
    const finalPublic = publicCommands.filter(path => {
      const file = files.get(path)!;
      if (file.imports.length > 0 && file.importedBy.length > 0) {
        // Check if it's a circular dependency
        const isCircular = file.imports.every(imp => 
          files.get(imp)?.importedBy.includes(path)
        );
        return !isCircular;
      }
      return true;
    });
    
    const finalPrivate = [
      ...privateIncludes,
      ...publicCommands.filter(p => !finalPublic.includes(p))
    ];
    
    return {
      public: finalPublic.sort(),
      private: finalPrivate.sort()
    };
  }
  
  isEligibleForPublic(file: PromptFile): boolean {
    // Check if in excluded directory
    if (this.isInExcludedDirectory(file.path)) {
      return false;
    }
    
    // Check if empty
    if (!file.content.trim()) {
      return false;
    }
    
    // Check if only contains imports
    if (this.isImportOnly(file)) {
      return false;
    }
    
    return true;
  }
  
  private isInExcludedDirectory(path: string): boolean {
    const normalizedPath = path.toLowerCase();
    return this.excludedDirs.some(dir => 
      normalizedPath.includes(`/${dir}/`)
    );
  }
  
  private isImportOnly(file: PromptFile): boolean {
    // Get all non-empty lines
    const lines = file.content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) return false;
    
    // Check if file ONLY contains imports (no headers, no other content)
    const importPattern = /^(@import|@src\/|@[\w/]+\.md)/;
    
    // Count imports and non-imports
    let importCount = 0;
    let nonImportCount = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (importPattern.test(trimmed)) {
        importCount++;
      } else {
        nonImportCount++;
      }
    }
    
    // File is import-only if it has imports and nothing else
    return importCount > 0 && nonImportCount === 0;
  }
  
  private hasSubstantialContent(file: PromptFile): boolean {
    // Remove imports and empty lines, but keep headers and content
    const lines = file.content.split('\n');
    const contentLines = lines.filter(line => {
      const trimmed = line.trim();
      // Skip empty lines and import statements
      return trimmed && 
             !trimmed.startsWith('@import') &&
             !trimmed.startsWith('@src/') &&
             !trimmed.match(/^@[\w/]+\.md/);
    });
    
    // If we have at least one non-import line, consider it substantial
    return contentLines.length > 0;
  }
}