export interface PromptFile {
  path: string;
  content: string;
  imports: string[];
  importedBy: string[];
}

export interface ClassificationResult {
  public: string[];
  private: string[];
}

export interface FileWatcherConfig {
  sourcePath: string;
  targetPath: string;
  syncOnStart?: boolean;
}

