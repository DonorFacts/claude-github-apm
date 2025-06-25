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

export interface TransformRule {
  pattern: RegExp;
  transform: (match: RegExpMatchArray) => string;
}

export interface DomainMapping {
  keywords: string[];
  domain: string;
}