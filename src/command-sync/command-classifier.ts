import { PromptFile, ClassificationResult } from './types';

export class CommandClassifier {
  classifyPrompts(files: Map<string, PromptFile>): ClassificationResult {
    const publicCommands: string[] = [];
    const privateIncludes: string[] = [];
    
    // Simple rule: Include all files except those with underscore prefix
    for (const [path, file] of files) {
      // Check if any part of the path contains underscore prefix
      if (this.hasUnderscorePrefix(path)) {
        privateIncludes.push(path);
        continue;
      }
      
      // Check if file is empty
      if (!file.content.trim()) {
        privateIncludes.push(path);
        continue;
      }
      
      // All other files are public commands
      publicCommands.push(path);
    }
    
    return {
      public: publicCommands.sort(),
      private: privateIncludes.sort()
    };
  }
  
  isEligibleForPublic(file: PromptFile): boolean {
    // Check if has underscore prefix
    if (this.hasUnderscorePrefix(file.path)) {
      return false;
    }
    
    // Check if empty
    if (!file.content.trim()) {
      return false;
    }
    
    return true;
  }
  
  private hasUnderscorePrefix(path: string): boolean {
    // Split path into parts and check each segment
    const parts = path.split('/');
    return parts.some(part => part.startsWith('_'));
  }
}