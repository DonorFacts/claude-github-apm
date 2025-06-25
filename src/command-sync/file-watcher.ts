import * as chokidar from 'chokidar';
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
}

export class FileWatcher {
  private watcher?: chokidar.FSWatcher;
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
    const pattern = path.join(this.options.sourcePath, '**/*.md');
    
    this.watcher = chokidar.watch(pattern, {
      ignored: (path: string) => path.includes('/_x_/'),
      persistent: true,
      ignoreInitial: true
    });
    
    // Set up event handlers
    this.watcher
      .on('add', (path: string) => this.syncFile(path))
      .on('change', (path: string) => this.syncFile(path))
      .on('unlink', (path: string) => this.removeCommand(path));
    
    // Sync all files on start if requested
    if (this.options.syncOnStart) {
      await this.syncAllFiles();
    }
  }
  
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }
  
  private async syncAllFiles(): Promise<void> {
    const pattern = path.join(this.options.sourcePath, '**/*.md');
    const files = await glob(pattern, {
      ignore: ['**/_x_/**']
    });
    
    // Analyze all files first to build the dependency graph
    const fileMap = new Map<string, PromptFile>();
    for (const file of files) {
      try {
        const analyzed = await this.analyzer.analyzeFile(file);
        fileMap.set(file, analyzed);
      } catch (error) {
        console.error(`Error analyzing file ${file}:`, error);
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
      // Analyze the file
      const file = await this.analyzer.analyzeFile(filePath);
      
      // Create a map with just this file for classification
      // Note: This is a simplified approach - in a real implementation,
      // we might want to maintain a cache of all files for accurate classification
      const fileMap = new Map<string, PromptFile>();
      fileMap.set(filePath, file);
      
      // Classify
      const classification = this.classifier.classifyPrompts(fileMap);
      
      // Only sync if it's public
      if (classification.public.includes(filePath)) {
        await this.syncFileContent(file);
      }
    } catch (error) {
      console.error(`Error syncing file ${filePath}:`, error);
    }
  }
  
  private async syncFileContent(file: PromptFile): Promise<void> {
    // Transform the filename
    const transformedName = this.transformer.transform(file.path);
    const targetFile = path.join(this.options.targetPath, transformedName);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(targetFile, file.content);
  }
  
  private async removeCommand(filePath: string): Promise<void> {
    try {
      // Transform the filename to get the target path
      const transformedName = this.transformer.transform(filePath);
      const targetFile = path.join(this.options.targetPath, transformedName);
      
      // Remove the file if it exists
      if (fs.existsSync(targetFile)) {
        fs.unlinkSync(targetFile);
      }
    } catch (error) {
      console.error(`Error removing command ${this.options.targetPath}/${this.transformer.transform(filePath)}:`, error);
    }
  }
}