import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { FileWatcher } from '../../src/command-sync/file-watcher';
import { PromptAnalyzer } from '../../src/command-sync/prompt-analyzer';
import { CommandClassifier } from '../../src/command-sync/command-classifier';
import { CommandNameTransformer } from '../../src/command-sync/command-name-transformer';

// Mock the dependencies
jest.mock('fs');
jest.mock('chokidar');
jest.mock('glob');

describe('FileWatcher', () => {
  let watcher: FileWatcher;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default dependencies', () => {
      watcher = new FileWatcher({
        sourcePath: 'src/prompts',
        targetPath: '.claude/commands',
        syncOnStart: false
      });

      expect(watcher).toBeDefined();
    });

    it('should accept custom dependencies', () => {
      const mockAnalyzer = {} as PromptAnalyzer;
      const mockClassifier = {} as CommandClassifier;
      const mockTransformer = {} as CommandNameTransformer;

      watcher = new FileWatcher(
        {
          sourcePath: 'src/prompts',
          targetPath: '.claude/commands',
          syncOnStart: false
        },
        mockAnalyzer,
        mockClassifier,
        mockTransformer
      );

      expect(watcher).toBeDefined();
    });
  });

  describe('basic functionality', () => {
    it('should have start method', () => {
      watcher = new FileWatcher({
        sourcePath: 'src/prompts',
        targetPath: '.claude/commands',
        syncOnStart: false
      });

      expect(typeof watcher.start).toBe('function');
    });

    it('should have stop method', () => {
      watcher = new FileWatcher({
        sourcePath: 'src/prompts',
        targetPath: '.claude/commands',
        syncOnStart: false
      });

      expect(typeof watcher.stop).toBe('function');
    });
  });
});