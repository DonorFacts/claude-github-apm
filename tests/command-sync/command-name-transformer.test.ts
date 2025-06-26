import { describe, it, expect, beforeEach } from '@jest/globals';
import { CommandNameTransformer } from '../../src/scripts/command-sync/command-name-transformer';

describe('CommandNameTransformer', () => {
  let transformer: CommandNameTransformer;

  beforeEach(() => {
    transformer = new CommandNameTransformer();
  });

  describe('transform', () => {
    it('should keep root level filenames unchanged', () => {
      expect(transformer.transform('src/prompts/context-save.md'))
        .toBe('context-save.md');
      
      expect(transformer.transform('src/prompts/agent-ify.md'))
        .toBe('agent-ify.md');
      
      expect(transformer.transform('src/prompts/reflect-for-docs.md'))
        .toBe('reflect-for-docs.md');
    });

    it('should flatten nested paths with hyphens', () => {
      expect(transformer.transform('src/prompts/git/commit.md'))
        .toBe('git-commit.md');
      
      expect(transformer.transform('src/prompts/git/worktrees/create.md'))
        .toBe('git-worktree-create.md');
      
      expect(transformer.transform('src/prompts/agents/developer/init.md'))
        .toBe('agent-developer-init.md');
    });

    it('should convert plural directories to singular', () => {
      expect(transformer.transform('src/prompts/agents/init.md'))
        .toBe('agent-init.md');
      
      expect(transformer.transform('src/prompts/worktrees/verify.md'))
        .toBe('worktree-verify.md');
      
      expect(transformer.transform('src/prompts/issues/create-bulk.md'))
        .toBe('issue-create-bulk.md');
      
      expect(transformer.transform('src/prompts/patterns/collection.md'))
        .toBe('pattern-collection.md');
    });

    it('should handle deep nesting correctly', () => {
      expect(transformer.transform('src/prompts/agents/scrum-master/commands/index.md'))
        .toBe('agent-scrum-master-commands-index.md');
      
      expect(transformer.transform('src/prompts/git/worktrees/troubleshoot.md'))
        .toBe('git-worktree-troubleshoot.md');
    });

    it('should preserve hyphens in filenames', () => {
      expect(transformer.transform('src/prompts/agents/scrum-master/create-project-issues.md'))
        .toBe('agent-scrum-master-create-project-issues.md');
      
      expect(transformer.transform('src/prompts/team-knowledge-contribution.md'))
        .toBe('team-knowledge-contribution.md');
    });

    it('should handle edge cases', () => {
      // File without extension (shouldn't happen, but handle gracefully)
      expect(transformer.transform('src/prompts/test'))
        .toBe('test.md');
      
      // File with multiple dots
      expect(transformer.transform('src/prompts/test.backup.md'))
        .toBe('test.backup.md');
      
      // Empty path segments
      expect(transformer.transform('src/prompts//git//commit.md'))
        .toBe('git-commit.md');
    });

    it('should not transform directories that are not in plural map', () => {
      expect(transformer.transform('src/prompts/misc/helper.md'))
        .toBe('misc-helper.md');
      
      expect(transformer.transform('src/prompts/util/context.md'))
        .toBe('util-context.md');
    });
  });
});