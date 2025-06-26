import * as fs from 'fs';
import * as path from 'path';
import { PromptFile } from './types';

export class PromptAnalyzer {
  private fileCache = new Map<string, PromptFile>();
  
  async analyzeFile(filePath: string): Promise<PromptFile> {
    // Check cache first
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract imports from content
    const imports = this.extractImports(content, filePath);
    
    // Create prompt file object
    const promptFile: PromptFile = {
      path: filePath,
      content,
      imports,
      importedBy: [] // This will be populated when analyzing other files
    };
    
    // Cache the result
    this.fileCache.set(filePath, promptFile);
    
    return promptFile;
  }
  
  async analyzeDirectory(dirPath: string): Promise<Map<string, PromptFile>> {
    const { glob } = await import('glob');
    const pattern = path.join(dirPath, '**/*.md');
    const files = await glob(pattern, {
      ignore: ['**/_x_/**', '**/node_modules/**']
    });
    
    const fileMap = new Map<string, PromptFile>();
    
    // First pass: analyze all files
    for (const file of files) {
      const promptFile = await this.analyzeFile(file);
      fileMap.set(file, promptFile);
    }
    
    // Second pass: populate importedBy relationships
    for (const [filePath, promptFile] of fileMap) {
      for (const importPath of promptFile.imports) {
        const importedFile = fileMap.get(importPath);
        if (importedFile && !importedFile.importedBy.includes(filePath)) {
          importedFile.importedBy.push(filePath);
        }
      }
    }
    
    return fileMap;
  }
  
  private extractImports(content: string, filePath: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');
    const fileDir = path.dirname(filePath);
    
    // Pattern to match various import styles
    // @import file.md
    // @src/prompts/file.md
    // @../other/file.md
    const importPattern = /^@(import\s+|src\/|\.\.\/|\.\/)?(.+\.md)$/;
    
    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(importPattern);
      
      if (match) {
        const importPath = match[2];
        let resolvedPath: string;
        
        if (trimmed.startsWith('@src/')) {
          // Absolute path from src
          resolvedPath = importPath;
        } else if (trimmed.startsWith('@../') || trimmed.startsWith('@./')) {
          // Relative path
          const relativePath = trimmed.substring(1); // Remove @
          resolvedPath = path.resolve(fileDir, relativePath);
        } else {
          // @import style - assume relative to current directory
          resolvedPath = path.resolve(fileDir, importPath);
        }
        
        // Normalize the path
        resolvedPath = path.normalize(resolvedPath);
        
        // Convert to relative path from project root if needed
        if (path.isAbsolute(resolvedPath)) {
          const projectRoot = process.cwd();
          resolvedPath = path.relative(projectRoot, resolvedPath);
        }
        
        imports.push(resolvedPath);
      }
    }
    
    return imports;
  }
  
  clearCache(): void {
    this.fileCache.clear();
  }
}