import { describe, it, expect, beforeEach } from '@jest/globals';
import { CommandClassifier } from '../../src/command-sync/command-classifier';
import { PromptFile } from '../../src/command-sync/types';

describe('CommandClassifier', () => {
  let classifier: CommandClassifier;
  let mockFiles: Map<string, PromptFile>;

  beforeEach(() => {
    classifier = new CommandClassifier();
    mockFiles = new Map();
  });

  describe('classifyPrompts', () => {
    it('should classify standalone files as public commands', () => {
      mockFiles.set('src/prompts/commit.md', {
        path: 'src/prompts/commit.md',
        content: '# Git Commit Helper\nHelps create git commits',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toContain('src/prompts/commit.md');
      expect(result.private).toHaveLength(0);
    });

    it('should classify files only imported by others as private', () => {
      mockFiles.set('src/prompts/agents/init.md', {
        path: 'src/prompts/agents/init.md',
        content: '# Generic Agent Init\n@import specific-init',
        imports: [],
        importedBy: ['src/prompts/agents/developer/init.md']
      });

      mockFiles.set('src/prompts/agents/developer/init.md', {
        path: 'src/prompts/agents/developer/init.md',
        content: '# Developer Init\n@src/prompts/agents/init.md',
        imports: ['src/prompts/agents/init.md'],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toContain('src/prompts/agents/developer/init.md');
      expect(result.private).toContain('src/prompts/agents/init.md');
    });

    it('should handle circular dependencies gracefully', () => {
      mockFiles.set('src/prompts/a.md', {
        path: 'src/prompts/a.md',
        content: '@import b.md',
        imports: ['src/prompts/b.md'],
        importedBy: ['src/prompts/b.md']
      });

      mockFiles.set('src/prompts/b.md', {
        path: 'src/prompts/b.md',
        content: '@import a.md',
        imports: ['src/prompts/a.md'],
        importedBy: ['src/prompts/a.md']
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      // Both should be private as they only import each other
      expect(result.private).toContain('src/prompts/a.md');
      expect(result.private).toContain('src/prompts/b.md');
      expect(result.public).toHaveLength(0);
    });

    it('should classify files imported but also used standalone as public', () => {
      mockFiles.set('src/prompts/shared-workflow.md', {
        path: 'src/prompts/shared-workflow.md',
        content: '# Shared Workflow\nThis workflow can be used standalone or imported.',
        imports: [],
        importedBy: ['src/prompts/agent-task.md']
      });

      mockFiles.set('src/prompts/agent-task.md', {
        path: 'src/prompts/agent-task.md',
        content: '# Agent Task\n@import shared-workflow.md',
        imports: ['src/prompts/shared-workflow.md'],
        importedBy: []
      });

      // If it has no imports and could be a command, it's public
      // even if imported by others
      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toContain('src/prompts/shared-workflow.md');
      expect(result.public).toContain('src/prompts/agent-task.md');
    });

    it('should identify deeply nested private includes', () => {
      mockFiles.set('src/prompts/base.md', {
        path: 'src/prompts/base.md',
        content: '# Base include',
        imports: [],
        importedBy: ['src/prompts/middle.md']
      });

      mockFiles.set('src/prompts/middle.md', {
        path: 'src/prompts/middle.md',
        content: '@import base.md',
        imports: ['src/prompts/base.md'],
        importedBy: ['src/prompts/top.md']
      });

      mockFiles.set('src/prompts/top.md', {
        path: 'src/prompts/top.md',
        content: '@import middle.md',
        imports: ['src/prompts/middle.md'],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toEqual(['src/prompts/top.md']);
      expect(result.private).toContain('src/prompts/base.md');
      expect(result.private).toContain('src/prompts/middle.md');
    });

    it('should handle files with no content as private', () => {
      mockFiles.set('src/prompts/empty.md', {
        path: 'src/prompts/empty.md',
        content: '',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.private).toContain('src/prompts/empty.md');
      expect(result.public).toHaveLength(0);
    });

    it('should exclude WIP and test files from public commands', () => {
      mockFiles.set('src/prompts/wip/experimental.md', {
        path: 'src/prompts/wip/experimental.md',
        content: '# Experimental feature',
        imports: [],
        importedBy: []
      });

      mockFiles.set('src/prompts/test/mock-prompt.md', {
        path: 'src/prompts/test/mock-prompt.md',
        content: '# Test prompt',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.private).toContain('src/prompts/wip/experimental.md');
      expect(result.private).toContain('src/prompts/test/mock-prompt.md');
      expect(result.public).toHaveLength(0);
    });
  });

  describe('isEligibleForPublic', () => {
    it('should return true for top-level command files', () => {
      const file: PromptFile = {
        path: 'src/prompts/commit.md',
        content: '# Commit helper',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(file)).toBe(true);
    });

    it('should return false for files in excluded directories', () => {
      const wipFile: PromptFile = {
        path: 'src/prompts/wip/draft.md',
        content: '# Draft',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(wipFile)).toBe(false);
    });

    it('should return false for empty files', () => {
      const emptyFile: PromptFile = {
        path: 'src/prompts/empty.md',
        content: '',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(emptyFile)).toBe(false);
    });

    it('should return false for files that only contain imports', () => {
      const importOnlyFile: PromptFile = {
        path: 'src/prompts/imports-only.md',
        content: '@import ./base.md\n@import ./utils.md',
        imports: ['src/prompts/base.md', 'src/prompts/utils.md'],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(importOnlyFile)).toBe(false);
    });
  });
});