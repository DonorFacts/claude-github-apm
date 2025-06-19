import { ImplementationPlan, PlanItem } from '../types';
import { IGitHubClient } from '../interfaces';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Test plan builder for creating test fixtures
export class TestPlanBuilder {
  private plan: ImplementationPlan;
  
  constructor() {
    this.plan = {
      version: '1.0',
      generated: new Date().toISOString().split('T')[0],
      project: {
        name: 'Test Project',
        description: 'Test project for bulk issue creator',
        repository: {
          owner: 'test-owner',
          name: 'test-repo'
        }
      },
      issue_types: {
        phase: 'IT_phase',
        project: 'IT_project',
        epic: 'IT_epic',
        feature: 'IT_feature',
        story: 'IT_story',
        task: 'IT_task',
        bug: 'IT_bug'
      },
      items: []
    };
  }
  
  addItem(item: Partial<PlanItem> & { id: string; type: string; title: string }): this {
    this.plan.items.push({
      description: '',
      parent_id: null,
      children_ids: [],
      metadata: {},
      ...item
    } as PlanItem);
    return this;
  }
  
  addPhase(id: string, title: string, childIds: string[] = []): this {
    return this.addItem({
      id,
      type: 'phase',
      title,
      children_ids: childIds
    });
  }
  
  addEpic(id: string, title: string, parentId: string, childIds: string[] = []): this {
    return this.addItem({
      id,
      type: 'epic',
      title,
      parent_id: parentId,
      children_ids: childIds
    });
  }
  
  addTask(id: string, title: string, parentId: string | null): this {
    return this.addItem({
      id,
      type: 'task',
      title,
      parent_id: parentId
    });
  }
  
  withExistingIssue(id: string, issueNumber: number): this {
    const item = this.plan.items.find(i => i.id === id);
    if (item) {
      item.issue_number = issueNumber;
    }
    return this;
  }
  
  build(): ImplementationPlan {
    return JSON.parse(JSON.stringify(this.plan));
  }
  
  toYaml(): string {
    return yaml.dump(this.plan);
  }
  
  saveToFile(filePath: string): string {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, this.toYaml());
    return filePath;
  }
}

// Mock GitHub Client for unit tests
export class MockGitHubClient implements IGitHubClient {
  public calls: any[] = [];
  private responses: Map<string, any> = new Map();
  
  setResponse(method: string, response: any): void {
    this.responses.set(method, response);
  }
  
  async getRepositoryId(): Promise<string> {
    this.calls.push({ method: 'getRepositoryId' });
    return this.responses.get('getRepositoryId') || 'test-repo-id';
  }
  
  async createIssuesBatch(issues: any[]): Promise<any> {
    this.calls.push({ method: 'createIssuesBatch', issues });
    const response = this.responses.get('createIssuesBatch');
    if (response instanceof Error) throw response;
    
    // Default successful response
    return response || {
      data: issues.reduce((acc, issue, index) => {
        acc[`issue${index}`] = {
          issue: {
            number: 100 + index,
            id: `issue-id-${100 + index}`
          }
        };
        return acc;
      }, {})
    };
  }
  
  async createIssue(input: any): Promise<any> {
    this.calls.push({ method: 'createIssue', issue: input });
    const response = this.responses.get('createIssue');
    if (response instanceof Error) throw response;
    
    return response || {
      number: 200,
      id: 'issue-id-200'
    };
  }
  
  async findExistingIssue(title: string): Promise<number | null> {
    this.calls.push({ method: 'findExistingIssue', title });
    return this.responses.get('findExistingIssue') || null;
  }
  
  async createSubIssueRelationships(parentId: string, childIds: string[]): Promise<void> {
    this.calls.push({ method: 'createSubIssueRelationships', parentId, childIds });
    const response = this.responses.get('createSubIssueRelationships');
    if (response instanceof Error) throw response;
  }
  
  async getIssueTypes(): Promise<Record<string, any>> {
    this.calls.push({ method: 'getIssueTypes' });
    return this.responses.get('getIssueTypes') || {};
  }
}

// Test file utilities
export const TEST_FIXTURES_DIR = path.join(__dirname, 'fixtures');
export const TEST_OUTPUT_DIR = path.join(__dirname, 'output');

export function setupTestDirectories(): void {
  [TEST_FIXTURES_DIR, TEST_OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

export function cleanupTestDirectories(): void {
  [TEST_FIXTURES_DIR, TEST_OUTPUT_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

// Assertion helpers
export function expectIssueCreated(mockClient: MockGitHubClient, title: string): void {
  const createCalls = mockClient.calls.filter(c => 
    c.method === 'createIssue' || c.method === 'createIssuesBatch'
  );
  
  const found = createCalls.some((call: any) => {
    if (call.method === 'createIssue') {
      return call.issue.title === title;
    } else {
      return call.issues.some((i: any) => i.title === title);
    }
  });
  
  expect(found).toBe(true);
}

export function expectRelationshipCreated(
  mockClient: MockGitHubClient, 
  parentId: string, 
  childId: string
): void {
  const relationshipCalls = mockClient.calls.filter(c => 
    c.method === 'createSubIssueRelationships'
  );
  
  const found = relationshipCalls.some(call => 
    call.parentId === parentId && call.childIds.includes(childId)
  );
  
  expect(found).toBe(true);
}

export function loadPlanFromFile(filePath: string): ImplementationPlan {
  const content = fs.readFileSync(filePath, 'utf-8');
  return yaml.load(content) as ImplementationPlan;
}