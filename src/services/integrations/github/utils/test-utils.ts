import { ImplementationPlan, PlanItem } from '../types';
import { IGitHubClient } from '../interfaces';
import { shouldUseMocks, TEST_REPOSITORY } from '../../../test-setup';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Test plan builder for creating test fixtures
export class TestPlanBuilder {
  private plan: ImplementationPlan;
  
  constructor() {
    // Get repository info based on environment
    const repoInfo = this.getRepositoryInfo();
    
    this.plan = {
      version: '1.0',
      generated: new Date().toISOString().split('T')[0],
      project: {
        name: 'Test Project',
        description: 'Test project for bulk issue creator',
        repository: repoInfo
      },
      // Only include fake issue_types for mocks, let production discover them
      ...(shouldUseMocks ? {
        issue_types: {
          phase: 'IT_phase',
          project: 'IT_project',
          epic: 'IT_epic',
          feature: 'IT_feature',
          story: 'IT_story',
          task: 'IT_task',
          bug: 'IT_bug'
        }
      } : {}),
      items: []
    };
  }
  
  private getRepositoryInfo(): { owner: string; name: string } {
    if (shouldUseMocks) {
      return {
        owner: 'test-owner',
        name: 'test-repo'
      };
    }
    
    // For production, use the test repository
    const [owner, name] = TEST_REPOSITORY.split('/');
    return { owner, name };
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
    // Ensure file is written synchronously
    if (!fs.existsSync(filePath)) {
      throw new Error(`Failed to create test plan file: ${filePath}`);
    }
    return filePath;
  }
}

// Mock GitHub Client for unit tests
export class MockGitHubClient implements IGitHubClient {
  public calls: any[] = [];
  private responses: Map<string, any> = new Map();
  
  constructor() {
    console.log('=== MockGitHubClient Constructor Called ===');
    console.log('This is the MOCK client - no real API calls will be made');
  }
  
  reset(): void {
    this.calls = [];
    this.responses.clear();
  }
  
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
    console.log('\n>>> MockGitHubClient.createIssue called!');
    console.log('>>> This should NEVER happen in production mode!');
    console.log('>>> Input:', input);
    
    this.calls.push({ method: 'createIssue', issue: input });
    const response = this.responses.get('createIssue');
    if (response instanceof Error) throw response;
    
    // Simulate incrementing issue numbers even in mock
    const mockNumber = 200 + this.calls.filter(c => c.method === 'createIssue').length - 1;
    console.log('>>> Returning mock issue number:', mockNumber);
    
    return response || {
      number: mockNumber,
      id: `issue-id-${mockNumber}`
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

  async discoverIssueTemplates(owner: string, repo: string): Promise<any[]> {
    this.calls.push({ method: 'discoverIssueTemplates', owner, repo });
    return this.responses.get('discoverIssueTemplates') || [];
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