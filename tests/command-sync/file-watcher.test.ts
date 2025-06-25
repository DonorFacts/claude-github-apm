import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { FileWatcher } from '../../src/command-sync/file-watcher';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('chokidar');

describe('FileWatcher', () => {
  let watcher: FileWatcher;
  let mockChokidar: any;
  let mockWatcherInstance: EventEmitter;

  beforeEach(() => {
    mockWatcherInstance = new EventEmitter();
    mockChokidar = {
      watch: jest.fn(() => mockWatcherInstance)
    };
    
    jest.doMock('chokidar', () => mockChokidar);
    
    watcher = new FileWatcher({
      sourcePath: 'src/prompts',
      targetPath: '.claude/commands',
      syncOnStart: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should initialize watcher with correct path and options', async () => {
      await watcher.start();

      expect(mockChokidar.watch).toHaveBeenCalledWith('src/prompts/**/*.md', {
        ignored: expect.any(Function),
        persistent: true,
        ignoreInitial: true
      });
    });

    it('should ignore _x_ directories', async () => {
      await watcher.start();

      const ignoreFn = mockChokidar.watch.mock.calls[0][1].ignored;
      expect(ignoreFn('src/prompts/_x_/test.md')).toBe(true);
      expect(ignoreFn('src/prompts/normal/test.md')).toBe(false);
    });

    it('should handle file add events', async () => {
      const syncSpy = jest.spyOn(watcher as any, 'syncFile');
      
      await watcher.start();
      mockWatcherInstance.emit('add', 'src/prompts/new-command.md');

      expect(syncSpy).toHaveBeenCalledWith('src/prompts/new-command.md');
    });

    it('should handle file change events', async () => {
      const syncSpy = jest.spyOn(watcher as any, 'syncFile');
      
      await watcher.start();
      mockWatcherInstance.emit('change', 'src/prompts/existing.md');

      expect(syncSpy).toHaveBeenCalledWith('src/prompts/existing.md');
    });

    it('should handle file unlink events', async () => {
      const removeSpy = jest.spyOn(watcher as any, 'removeCommand');
      
      await watcher.start();
      mockWatcherInstance.emit('unlink', 'src/prompts/deleted.md');

      expect(removeSpy).toHaveBeenCalledWith('src/prompts/deleted.md');
    });

    it('should sync all files on start when syncOnStart is true', async () => {
      watcher = new FileWatcher({
        sourcePath: 'src/prompts',
        targetPath: '.claude/commands',
        syncOnStart: true
      });

      const syncAllSpy = jest.spyOn(watcher as any, 'syncAllFiles');
      await watcher.start();

      expect(syncAllSpy).toHaveBeenCalled();
    });
  });

  describe('syncFile', () => {
    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockReturnValue('# Test Content');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    it('should sync public files to target directory', async () => {
      const analyzer = {
        analyzeFile: jest.fn().mockResolvedValue({
          path: 'src/prompts/commit.md',
          content: '# Commit Helper',
          imports: [],
          importedBy: []
        })
      };

      const classifier = {
        classifyPrompts: jest.fn().mockReturnValue({
          public: ['src/prompts/commit.md'],
          private: []
        })
      };

      const transformer = {
        transform: jest.fn().mockReturnValue('git-workflow-commit.md')
      };

      (watcher as any).analyzer = analyzer;
      (watcher as any).classifier = classifier;
      (watcher as any).transformer = transformer;

      await (watcher as any).syncFile('src/prompts/commit.md');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join('.claude/commands', 'git-workflow-commit.md'),
        '# Commit Helper'
      );
    });

    it('should not sync private files', async () => {
      const analyzer = {
        analyzeFile: jest.fn().mockResolvedValue({
          path: 'src/prompts/private.md',
          content: '# Private Include',
          imports: [],
          importedBy: ['src/prompts/public.md']
        })
      };

      const classifier = {
        classifyPrompts: jest.fn().mockReturnValue({
          public: [],
          private: ['src/prompts/private.md']
        })
      };

      (watcher as any).analyzer = analyzer;
      (watcher as any).classifier = classifier;

      await (watcher as any).syncFile('src/prompts/private.md');

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should create target directory if it does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const analyzer = {
        analyzeFile: jest.fn().mockResolvedValue({
          path: 'src/prompts/test.md',
          content: '# Test',
          imports: [],
          importedBy: []
        })
      };

      const classifier = {
        classifyPrompts: jest.fn().mockReturnValue({
          public: ['src/prompts/test.md'],
          private: []
        })
      };

      const transformer = {
        transform: jest.fn().mockReturnValue('misc-test.md')
      };

      (watcher as any).analyzer = analyzer;
      (watcher as any).classifier = classifier;
      (watcher as any).transformer = transformer;

      await (watcher as any).syncFile('src/prompts/test.md');

      expect(fs.mkdirSync).toHaveBeenCalledWith('.claude/commands', { recursive: true });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const analyzer = {
        analyzeFile: jest.fn().mockRejectedValue(new Error('Read error'))
      };

      (watcher as any).analyzer = analyzer;

      await (watcher as any).syncFile('src/prompts/error.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error syncing file src/prompts/error.md:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('removeCommand', () => {
    it('should remove corresponding command file', async () => {
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      
      const transformer = {
        transform: jest.fn().mockReturnValue('git-workflow-commit.md')
      };

      (watcher as any).transformer = transformer;

      await (watcher as any).removeCommand('src/prompts/commit.md');

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        path.join('.claude/commands', 'git-workflow-commit.md')
      );
    });

    it('should handle removal errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      const transformer = {
        transform: jest.fn().mockReturnValue('test.md')
      };

      (watcher as any).transformer = transformer;

      await (watcher as any).removeCommand('src/prompts/test.md');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error removing command .claude/commands/test.md:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should close the watcher', async () => {
      const closeSpy = jest.fn();
      mockWatcherInstance.close = closeSpy;

      await watcher.start();
      await watcher.stop();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle stop when not started', async () => {
      await expect(watcher.stop()).resolves.not.toThrow();
    });
  });
});