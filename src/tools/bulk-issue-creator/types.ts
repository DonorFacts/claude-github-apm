// Type definitions for the bulk issue creator

export interface Repository {
  owner: string;
  name: string;
}

export interface IssueTypes {
  phase: string;
  project: string;
  epic: string;
  feature: string;
  story: string;
  task: string;
  bug: string;
  doc?: string;
}

export interface PlanItem {
  id: string;
  type: keyof IssueTypes;
  title: string;
  description: string;
  parent_id: string | null;
  children_ids: string[];
  metadata?: Record<string, any>;
  issue_number?: number;
  github_id?: string;
}

export interface ExecutionLevel {
  level: number;
  items: string[];
}

export interface ExecutionPlan {
  create_order: ExecutionLevel[];
}

export interface ImplementationPlan {
  version: string;
  generated: string;
  project: {
    name: string;
    description: string;
    repository: Repository;
  };
  issue_types: IssueTypes;
  items: PlanItem[];
  execution?: ExecutionPlan;
}

export interface CreateIssueInput {
  title: string;
  body: string;
  issueType: string;
  repositoryId: string;
}

export interface GitHubIssue {
  number: number;
  id: string;
  title?: string;
  url?: string;
}

export interface BatchCreateResult {
  [alias: string]: {
    issue: GitHubIssue;
  };
}

export interface CreationResult {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}