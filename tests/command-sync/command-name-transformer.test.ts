import { describe, it, expect } from '@jest/globals';
import { CommandNameTransformer } from '../../src/command-sync/command-name-transformer';

describe('CommandNameTransformer', () => {
  let transformer: CommandNameTransformer;

  beforeEach(() => {
    transformer = new CommandNameTransformer();
  });

  describe('transform', () => {
    it('should transform agent init files correctly', () => {
      expect(transformer.transform('src/prompts/agents/init.md'))
        .toBe('agent-init-generic.md');
      
      expect(transformer.transform('src/prompts/agents/developer/init.md'))
        .toBe('agent-init-developer.md');
      
      expect(transformer.transform('src/prompts/agents/scrum-master/init.md'))
        .toBe('agent-init-scrum-master.md');
    });

    it('should transform workflow files to appropriate domains', () => {
      expect(transformer.transform('src/prompts/agents/developer/tdd-workflow.md'))
        .toBe('test-tdd-workflow.md');
      
      expect(transformer.transform('src/prompts/commit.md'))
        .toBe('git-workflow-commit.md');
      
      expect(transformer.transform('src/prompts/agents/developer/code-patterns.md'))
        .toBe('code-pattern-collection.md');
    });

    it('should handle security and review files', () => {
      expect(transformer.transform('src/prompts/agents/developer/security-checklist.md'))
        .toBe('review-code-security.md');
    });

    it('should handle project management files', () => {
      expect(transformer.transform('src/prompts/agents/scrum-master/create-project-issues.md'))
        .toBe('project-issue-create-bulk.md');
      
      expect(transformer.transform('src/prompts/agents/scrum-master/breakdown-project-plan.md'))
        .toBe('project-plan-breakdown.md');
    });

    it('should handle utility and meta files', () => {
      expect(transformer.transform('src/prompts/context-save.md'))
        .toBe('util-context-save.md');
      
      expect(transformer.transform('src/prompts/agent-ify.md'))
        .toBe('meta-agent-create.md');
    });

    it('should handle documentation generation files', () => {
      expect(transformer.transform('src/prompts/reflect-for-docs.md'))
        .toBe('docs-generate-reflection.md');
      
      expect(transformer.transform('src/prompts/team-knowledge-contribution.md'))
        .toBe('docs-knowledge-contribute.md');
    });

    it('should handle collaboration files', () => {
      expect(transformer.transform('src/prompts/agents/handover-quality.md'))
        .toBe('agent-handover-quality.md');
      
      expect(transformer.transform('src/prompts/agents/inter-agent-collaboration.md'))
        .toBe('agent-collab-guidelines.md');
    });

    it('should handle unknown files with fallback naming', () => {
      expect(transformer.transform('src/prompts/unknown-new-file.md'))
        .toBe('misc-unknown-new-file.md');
      
      expect(transformer.transform('src/prompts/agents/mystery-agent/special.md'))
        .toBe('agent-mystery-agent-special.md');
    });

    it('should preserve hyphens and handle edge cases', () => {
      expect(transformer.transform('src/prompts/test-driven-development.md'))
        .toBe('test-test-driven-development.md'); // 'test' keyword is detected
      
      expect(transformer.transform('src/prompts/UPPERCASE-File.md'))
        .toBe('misc-uppercase-file.md');
    });
  });

  describe('getDomain', () => {
    it('should identify agent domain', () => {
      expect(transformer.getDomain('src/prompts/agents/developer/init.md'))
        .toBe('agent');
    });

    it('should identify test domain from keywords', () => {
      expect(transformer.getDomain('src/prompts/agents/developer/tdd-workflow.md'))
        .toBe('test');
    });

    it('should identify git domain from keywords', () => {
      expect(transformer.getDomain('src/prompts/commit.md'))
        .toBe('git');
    });

    it('should identify project domain from keywords', () => {
      expect(transformer.getDomain('src/prompts/create-project-issues.md'))
        .toBe('project');
    });

    it('should return misc for unknown domains', () => {
      expect(transformer.getDomain('src/prompts/random-file.md'))
        .toBe('misc');
    });
  });

  describe('getCategory', () => {
    it('should extract category from agent paths', () => {
      expect(transformer.getCategory('src/prompts/agents/developer/init.md', 'agent'))
        .toBe('init');
      
      expect(transformer.getCategory('src/prompts/agents/handover-quality.md', 'agent'))
        .toBe('handover');
    });

    it('should identify workflow category', () => {
      expect(transformer.getCategory('src/prompts/commit.md', 'git'))
        .toBe('workflow');
      
      expect(transformer.getCategory('src/prompts/tdd-workflow.md', 'test'))
        .toBe('tdd');
    });

    it('should handle pattern files', () => {
      expect(transformer.getCategory('src/prompts/code-patterns.md', 'code'))
        .toBe('pattern');
    });

    it('should return general for unmatched categories', () => {
      expect(transformer.getCategory('src/prompts/something.md', 'misc'))
        .toBe('general');
    });
  });

  describe('getAction', () => {
    it('should extract action from filename', () => {
      expect(transformer.getAction('src/prompts/create-project-issues.md'))
        .toBe('create');
      
      expect(transformer.getAction('src/prompts/breakdown-project-plan.md'))
        .toBe('breakdown');
      
      expect(transformer.getAction('src/prompts/reflect-for-docs.md'))
        .toBe('reflection');
    });

    it('should handle init files', () => {
      expect(transformer.getAction('src/prompts/agents/developer/init.md'))
        .toBe('developer');
    });

    it('should use full filename for unmatched patterns', () => {
      expect(transformer.getAction('src/prompts/unknown.md'))
        .toBe('unknown');
    });
  });
});