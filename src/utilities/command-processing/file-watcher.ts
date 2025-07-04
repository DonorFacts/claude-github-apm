import watch from 'node-watch';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { PromptAnalyzer } from './prompt-analyzer';
import { CommandClassifier } from './command-classifier';
import { CommandNameTransformer } from './command-name-transformer';
import { PromptFile } from './types';

export interface FileWatcherOptions {
  sourcePath: string;
  targetPath: string;
  syncOnStart?: boolean;
  shortcutPath?: string;  // Optional custom shortcut path, defaults to '-'
}

export class FileWatcher {
  private watcher?: any; // node-watch watcher instance
  private analyzer: PromptAnalyzer;
  private classifier: CommandClassifier;
  private transformer: CommandNameTransformer;
  
  constructor(
    private options: FileWatcherOptions,
    analyzer?: PromptAnalyzer,
    classifier?: CommandClassifier,
    transformer?: CommandNameTransformer
  ) {
    this.analyzer = analyzer || new PromptAnalyzer();
    this.classifier = classifier || new CommandClassifier();
    this.transformer = transformer || new CommandNameTransformer();
  }
  
  async start(): Promise<void> {
    const sourcePath = path.resolve(this.options.sourcePath);
    console.log(`🔍 Setting up node-watch for: ${sourcePath}`);
    console.log(`📂 Current working directory: ${process.cwd()}`);
    
    // Set up watcher options
    const watchOptions = {
      recursive: true,
      filter: (filePath: string) => {
        // Return true to watch, false to ignore
        if (filePath.includes('/_x_/')) return false;
        if (filePath.endsWith('.md')) return true;
        // Also watch directories to detect new files
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) return true;
        return false;
      }
    };
    
    // Create the watcher
    this.watcher = watch(sourcePath, watchOptions, (eventType: string, filePath: string) => {
      console.log(`\n📍 Event: ${eventType} - File: ${filePath}`);
      console.log(`   Relative path: ${path.relative(sourcePath, filePath)}`);
      
      // Only process markdown files
      if (!filePath.endsWith('.md')) {
        console.log(`   ⏭️  Skipping non-markdown file`);
        return;
      }
      
      // Handle different event types
      if (eventType === 'update') {
        // Check if file exists to determine if it's add/change or delete
        if (fs.existsSync(filePath)) {
          console.log(`   📝 File ${fs.existsSync(filePath) ? 'changed' : 'added'}`);
          // Add a small delay to ensure file write is complete
          setTimeout(() => {
            console.log(`   ⏱️  Processing after 500ms delay...`);
            this.syncFile(filePath);
          }, 500);
        } else {
          console.log(`   🗑️  File removed`);
          this.removeCommand(filePath);
        }
      } else if (eventType === 'remove') {
        console.log(`   🗑️  File removed`);
        this.removeCommand(filePath);
      }
    });
    
    console.log('✅ node-watch is now watching for changes');
    console.log('👀 Watching for changes...');
    console.log('Press Ctrl+C to stop');
    
    // Sync all files on start if requested
    if (this.options.syncOnStart) {
      await this.syncAllFiles();
    }
  }
  
  async stop(): Promise<void> {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
      console.log('🛑 node-watch stopped');
    }
  }
  
  private async syncAllFiles(): Promise<void> {
    const pattern = path.join(this.options.sourcePath, '**/*.md');
    const files = await glob(pattern, {
      ignore: ['**/_x_/**']
    });
    
    // Build file map with fresh content
    const fileMap = new Map<string, PromptFile>();
    for (const file of files) {
      try {
        // Read fresh content directly
        const content = fs.readFileSync(file, 'utf-8');
        const promptFile: PromptFile = {
          path: file,
          content: content,
          imports: [],
          importedBy: []
        };
        fileMap.set(file, promptFile);
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
      }
    }
    
    // Classify files
    const classification = this.classifier.classifyPrompts(fileMap);
    
    // Sync only public files
    for (const publicFile of classification.public) {
      const file = fileMap.get(publicFile);
      if (file) {
        await this.syncFileContent(file);
      }
    }
  }
  
  private async syncFile(filePath: string): Promise<void> {
    try {
      console.log(`\n🔄 Syncing file: ${filePath}`);
      
      // Convert to relative path if it's absolute
      const relativePath = path.isAbsolute(filePath) 
        ? path.relative(process.cwd(), filePath)
        : filePath;
      
      console.log(`   📍 Relative path from cwd: ${relativePath}`);
      
      // Read fresh content directly - bypass analyzer cache for updates
      const content = fs.readFileSync(relativePath, 'utf-8');
      
      // Create a simple PromptFile object with fresh content
      const file: PromptFile = {
        path: relativePath,
        content: content,
        imports: [],
        importedBy: []
      };
      
      // Create a map with just this file for classification
      // Note: This is a simplified approach - in a real implementation,
      // we might want to maintain a cache of all files for accurate classification
      const fileMap = new Map<string, PromptFile>();
      fileMap.set(relativePath, file);
      
      // Classify
      const classification = this.classifier.classifyPrompts(fileMap);
      
      // Only sync if it's public
      if (classification.public.includes(relativePath)) {
        console.log(`   ✅ File is public, syncing...`);
        await this.syncFileContent(file);
        console.log(`   ✅ Sync complete`);
      } else {
        console.log(`   ⏭️  Skipping private file`);
      }
    } catch (error) {
      console.error(`Error syncing file ${filePath}:`, error);
    }
  }
  
  private async syncFileContent(file: PromptFile): Promise<void> {
    console.log(`   📄 Syncing content: ${file.content.length} bytes`);
    
    // Transform the filename
    const transformedName = this.transformer.transform(file.path);
    
    // Log only if different from original
    const originalName = path.basename(file.path);
    if (transformedName !== originalName) {
      console.log(`   📝 Transformed: ${originalName} → ${transformedName}`);
    }
    
    // Sync to both target directories
    const targetPaths = [
      this.options.targetPath,  // .claude/commands
      this.options.shortcutPath || '-'  // Shortcut folder
    ];
    
    for (const targetPath of targetPaths) {
      const targetFile = path.join(targetPath, transformedName);
      console.log(`   📝 Writing to: ${targetFile}`);
      
      // Ensure target directory exists
      const targetDir = path.dirname(targetFile);
      if (!fs.existsSync(targetDir)) {
        console.log(`   📁 Creating directory: ${targetDir}`);
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(targetFile, file.content);
      console.log(`   ✅ Written ${file.content.length} bytes to ${targetFile}`);
    }
  }
  
  private async removeCommand(filePath: string): Promise<void> {
    try {
      // Convert to relative path if it's absolute
      const relativePath = path.isAbsolute(filePath) 
        ? path.relative(process.cwd(), filePath)
        : filePath;
      
      // Transform the filename to get the target path
      const transformedName = this.transformer.transform(relativePath);
      
      // Remove from both target directories
      const targetPaths = [
        this.options.targetPath,  // .claude/commands
        this.options.shortcutPath || '-'  // Shortcut folder
      ];
      
      for (const targetPath of targetPaths) {
        const targetFile = path.join(targetPath, transformedName);
        
        // Remove the file if it exists
        if (fs.existsSync(targetFile)) {
          try {
            fs.unlinkSync(targetFile);
            console.log(`   🗑️  Removed: ${targetFile}`);
          } catch (unlinkError) {
            // Ignore if file doesn't exist
            if ((unlinkError as any).code !== 'ENOENT') {
              throw unlinkError;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error removing command:`, error);
    }
  }
}