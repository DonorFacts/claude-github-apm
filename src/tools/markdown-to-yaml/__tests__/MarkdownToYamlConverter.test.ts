import { MarkdownToYamlConverter } from '../MarkdownToYamlConverter';
import { ImplementationPlan, PlanItem } from '../../bulk-issue-creator/types';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('MarkdownToYamlConverter', () => {
  const testOutputDir = path.join(__dirname, 'test-output');
  
  beforeEach(() => {
    if (!fs.existsSync(testOutputDir)) {
      fs.mkdirSync(testOutputDir, { recursive: true });
    }
  });
  
  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('constructor', () => {
    it('should initialize with default issue types', () => {
      const converter = new MarkdownToYamlConverter();
      expect(converter).toBeDefined();
    });

    it('should accept custom issue types', () => {
      const customTypes = {
        phase: 'CUSTOM_PHASE',
        project: 'CUSTOM_PROJECT',
        epic: 'CUSTOM_EPIC',
        feature: 'CUSTOM_FEATURE',
        story: 'CUSTOM_STORY',
        task: 'CUSTOM_TASK',
        bug: 'CUSTOM_BUG',
        doc: 'CUSTOM_DOC'
      };
      const converter = new MarkdownToYamlConverter(customTypes);
      expect(converter).toBeDefined();
    });
  });

  describe('parseMarkdown', () => {
    it('should parse a simple phase with tasks', () => {
      const markdown = `# Implementation Plan

## Phase 1: Foundation

### Epic 1.1: Setup
      
1. **Task**: Configure environment
   - Install dependencies
   - Set up configuration files
   - Initialize repository
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(plan.items).toHaveLength(3);
      
      // Phase
      expect(plan.items[0].type).toBe('phase');
      expect(plan.items[0].title).toBe('Foundation');
      expect(plan.items[0].parent_id).toBeNull();
      
      // Epic
      expect(plan.items[1].type).toBe('epic');
      expect(plan.items[1].title).toBe('Setup');
      expect(plan.items[1].parent_id).toBe(plan.items[0].id);
      
      // Task
      expect(plan.items[2].type).toBe('task');
      expect(plan.items[2].title).toBe('Configure environment');
      expect(plan.items[2].parent_id).toBe(plan.items[1].id);
      expect(plan.items[2].description).toContain('Install dependencies');
    });

    it('should handle issue numbers in brackets', () => {
      const markdown = `## Phase 1: [#2] Foundation Phase

### Epic 1.1 - [#3] Setup Epic

1. **Task**: [#7] Configure environment
   - Install dependencies
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(plan.items[0].issue_number).toBe(2);
      expect(plan.items[0].title).toBe('Foundation Phase');
      
      expect(plan.items[1].issue_number).toBe(3);
      expect(plan.items[1].title).toBe('Setup Epic');
      
      expect(plan.items[2].issue_number).toBe(7);
      expect(plan.items[2].title).toBe('Configure environment');
    });

    it('should detect issue types from content', () => {
      const markdown = `## Phase 1: Infrastructure

### Project 1.1: Backend Services

#### Epic 1.1.1: API Development

1. **Story**: User authentication flow
   - Implement login endpoint
   - Add JWT token generation

2. **Task**: Database setup
   - Create schema
   - Add migrations

3. **Bug**: Fix memory leak
   - Investigate issue
   - Apply patch

4. **Feature**: Add search functionality
   - Implement search API
   - Add indexing
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      const types = plan.items.map(item => item.type);
      expect(types).toContain('phase');
      expect(types).toContain('project');
      expect(types).toContain('epic');
      expect(types).toContain('story');
      expect(types).toContain('task');
      expect(types).toContain('bug');
      expect(types).toContain('feature');
    });

    it('should maintain parent-child relationships', () => {
      const markdown = `## Phase 1: Foundation

### Epic 1.1: Backend
      
1. **Task**: Setup database

### Epic 1.2: Frontend

1. **Task**: Setup React
2. **Task**: Configure webpack

## Phase 2: Development

### Epic 2.1: Features

1. **Story**: User management
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      // Check relationships
      const phase1 = plan.items.find(i => i.title === 'Foundation');
      const phase2 = plan.items.find(i => i.title === 'Development');
      const epic11 = plan.items.find(i => i.title === 'Backend');
      const epic12 = plan.items.find(i => i.title === 'Frontend');
      const epic21 = plan.items.find(i => i.title === 'Features');

      expect(epic11!.parent_id).toBe(phase1!.id);
      expect(epic12!.parent_id).toBe(phase1!.id);
      expect(epic21!.parent_id).toBe(phase2!.id);

      // Check children_ids
      expect(phase1!.children_ids).toContain(epic11!.id);
      expect(phase1!.children_ids).toContain(epic12!.id);
      expect(phase2!.children_ids).toContain(epic21!.id);
    });

    it('should extract metadata from parentheses', () => {
      const markdown = `## Phase 1: Foundation

### Epic 1.1 (Complex) - Backend Services

1. **Task**: (Agent_Developer) Implement API
   - Create endpoints
   - Add validation

2. **Story**: (Agent_QA, Agent_Developer) Integration testing
   - Write test cases
   - Set up CI/CD
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      const epic = plan.items.find(i => i.title === 'Backend Services');
      expect(epic!.metadata).toEqual({ complex: true });

      const task = plan.items.find(i => i.title === 'Implement API');
      expect(task!.metadata).toEqual({ agent: 'Agent_Developer' });

      const story = plan.items.find(i => i.title === 'Integration testing');
      expect(story!.metadata).toEqual({ 
        agents: ['Agent_QA', 'Agent_Developer'] 
      });
    });

    it('should handle multi-line descriptions with guidance', () => {
      const markdown = `## Phase 1: Foundation

1. **Task**: Configure build system
   - Set up TypeScript compilation
   - Configure webpack
   _Guidance: Use strict mode for better type safety_
   - Add hot module replacement
   _Note: This improves developer experience_
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      const task = plan.items.find(i => i.type === 'task');
      expect(task!.description).toContain('Set up TypeScript compilation');
      expect(task!.description).toContain('Guidance: Use strict mode');
      expect(task!.description).toContain('Note: This improves developer experience');
    });

    it('should generate unique IDs for items', () => {
      const markdown = `## Phase 1: Setup
### Epic 1.1: Backend
1. **Task**: Database setup

## Phase 2: Setup
### Epic 2.1: Frontend  
1. **Task**: Database setup
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      const ids = plan.items.map(i => i.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('convertFile', () => {
    it('should read markdown file and write YAML output', async () => {
      const mdPath = path.join(testOutputDir, 'test-plan.md');
      const yamlPath = path.join(testOutputDir, 'test-plan.yaml');
      
      const markdown = `# Test Plan

## Phase 1: Testing

1. **Task**: Write tests
   - Create unit tests
   - Add integration tests
`;

      fs.writeFileSync(mdPath, markdown);

      const converter = new MarkdownToYamlConverter();
      await converter.convertFile(mdPath, yamlPath, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(fs.existsSync(yamlPath)).toBe(true);
      
      const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
      const plan = yaml.load(yamlContent) as ImplementationPlan;
      
      expect(plan.project.repository.owner).toBe('test-owner');
      expect(plan.project.repository.name).toBe('test-repo');
      expect(plan.items).toHaveLength(2);
    });

    it('should use markdown filename for output if not specified', async () => {
      const mdPath = path.join(testOutputDir, 'my-plan.md');
      
      const markdown = `## Phase 1: Testing`;
      fs.writeFileSync(mdPath, markdown);

      const converter = new MarkdownToYamlConverter();
      await converter.convertFile(mdPath, undefined, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      const expectedYamlPath = path.join(testOutputDir, 'my-plan.yaml');
      expect(fs.existsSync(expectedYamlPath)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty markdown', () => {
      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown('', {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(plan.items).toHaveLength(0);
    });

    it('should handle markdown with only headers', () => {
      const markdown = `# Implementation Plan
## Phase 1: Empty Phase
### Epic 1.1: Empty Epic
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(plan.items).toHaveLength(2); // Phase and Epic
      plan.items.forEach(item => {
        expect(item.description).toBe('');
      });
    });

    it('should handle special characters in titles', () => {
      const markdown = `## Phase 1: Setup & Configuration

1. **Task**: Install "dependencies" & configure 'environment'
   - Run \`npm install\`
   - Set NODE_ENV="production"
`;

      const converter = new MarkdownToYamlConverter();
      const plan = converter.parseMarkdown(markdown, {
        owner: 'test-owner',
        name: 'test-repo'
      });

      expect(plan.items[0].title).toBe('Setup & Configuration');
      expect(plan.items[1].title).toBe('Install "dependencies" & configure \'environment\'');
    });
  });
});