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
    it('should classify all non-underscore files as public commands', () => {
      mockFiles.set('src/prompts/commit.md', {
        path: 'src/prompts/commit.md',
        content: '# Git Commit Helper\nHelps create git commits',
        imports: [],
        importedBy: []
      });
      
      mockFiles.set('src/prompts/context-save.md', {
        path: 'src/prompts/context-save.md',
        content: '# Context Save',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toContain('src/prompts/commit.md');
      expect(result.public).toContain('src/prompts/context-save.md');
      expect(result.private).toHaveLength(0);
    });

    it('should exclude files with underscore prefix', () => {
      mockFiles.set('src/prompts/_draft.md', {
        path: 'src/prompts/_draft.md',
        content: '# Draft content',
        imports: [],
        importedBy: []
      });

      mockFiles.set('src/prompts/public.md', {
        path: 'src/prompts/public.md',
        content: '# Public content',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.private).toContain('src/prompts/_draft.md');
      expect(result.public).toContain('src/prompts/public.md');
    });

    it('should exclude files in underscore directories', () => {
      mockFiles.set('src/prompts/_utils/helper.md', {
        path: 'src/prompts/_utils/helper.md',
        content: '# Helper utilities',
        imports: [],
        importedBy: []
      });

      mockFiles.set('src/prompts/_includes/base.md', {
        path: 'src/prompts/_includes/base.md',
        content: '# Base include',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.private).toContain('src/prompts/_utils/helper.md');
      expect(result.private).toContain('src/prompts/_includes/base.md');
      expect(result.public).toHaveLength(0);
    });

    it('should include files regardless of import status', () => {
      // File that imports others
      mockFiles.set('src/prompts/workflow.md', {
        path: 'src/prompts/workflow.md',
        content: '# Workflow\n@import base.md',
        imports: ['src/prompts/base.md'],
        importedBy: []
      });

      // File that is imported by others
      mockFiles.set('src/prompts/base.md', {
        path: 'src/prompts/base.md',
        content: '# Base content',
        imports: [],
        importedBy: ['src/prompts/workflow.md']
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      // Both should be public (no underscore)
      expect(result.public).toContain('src/prompts/workflow.md');
      expect(result.public).toContain('src/prompts/base.md');
    });

    it('should handle files with no content as private', () => {
      mockFiles.set('src/prompts/empty.md', {
        path: 'src/prompts/empty.md',
        content: '',
        imports: [],
        importedBy: []
      });

      mockFiles.set('src/prompts/whitespace.md', {
        path: 'src/prompts/whitespace.md',
        content: '   \n\n   ',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.private).toContain('src/prompts/empty.md');
      expect(result.private).toContain('src/prompts/whitespace.md');
    });

    it('should handle mixed scenarios correctly', () => {
      // Public file
      mockFiles.set('src/prompts/git/worktrees/create.md', {
        path: 'src/prompts/git/worktrees/create.md',
        content: '# Create worktree',
        imports: [],
        importedBy: []
      });

      // Private file (underscore prefix)
      mockFiles.set('src/prompts/_experimental/test.md', {
        path: 'src/prompts/_experimental/test.md',
        content: '# Test content',
        imports: [],
        importedBy: []
      });

      // Empty file
      mockFiles.set('src/prompts/agents/empty.md', {
        path: 'src/prompts/agents/empty.md',
        content: '',
        imports: [],
        importedBy: []
      });

      const result = classifier.classifyPrompts(mockFiles);
      
      expect(result.public).toEqual(['src/prompts/git/worktrees/create.md']);
      expect(result.private).toContain('src/prompts/_experimental/test.md');
      expect(result.private).toContain('src/prompts/agents/empty.md');
    });
  });

  describe('isEligibleForPublic', () => {
    it('should return true for files without underscore', () => {
      const file: PromptFile = {
        path: 'src/prompts/command.md',
        content: '# Command',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(file)).toBe(true);
    });

    it('should return false for files with underscore prefix', () => {
      const file: PromptFile = {
        path: 'src/prompts/_private.md',
        content: '# Private',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(file)).toBe(false);
    });

    it('should return false for files in underscore directories', () => {
      const file: PromptFile = {
        path: 'src/prompts/_utils/helper.md',
        content: '# Helper',
        imports: [],
        importedBy: []
      };

      expect(classifier.isEligibleForPublic(file)).toBe(false);
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
  });
});