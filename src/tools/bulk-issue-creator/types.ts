/**
 * Type definitions for the Implementation Plan and GitHub API
 */

export interface ImplementationPlan {
  version: string;
  generated: string;
  project: ProjectInfo;
  issue_types: IssueTypeMapping;
  items: PlanItem[];
  execution: ExecutionPlan;
}

export interface ProjectInfo {
  name: string;
  description: string;
  repository: {
    owner: string;
    name: string;
  };
}

export interface IssueTypeMapping {
  phase: string;
  project: string;
  epic: string;
  feature: string;
  story: string;
  task: string;
  bug: string;
}

export type IssueType = keyof IssueTypeMapping;

export interface PlanItem {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  parent_id: string | null;
  children_ids?: string[];
  assignee?: string;
  labels?: string[];
  issue_number?: number;
  metadata?: {
    agent?: string;
    priority?: 'high' | 'medium' | 'low';
    estimate?: string;
    acceptance_criteria?: string[];
    guidance?: string;
  };
}

export interface ExecutionPlan {
  create_order: ExecutionLevel[];
  relationships?: RelationshipBatch[];
}

export interface ExecutionLevel {
  level: number;
  items: string[];
}

export interface RelationshipBatch {
  parent_issue: number;
  child_issues: number[];
}

// GitHub API types
export interface GitHubIssueInput {
  repositoryId: string;
  title: string;
  body: string;
  issueTypeId?: string;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface CreateIssueResult {
  issue: {
    id: string;
    number: number;
  };
}

export interface BatchCreateResult {
  [alias: string]: CreateIssueResult;
}

// Progress tracking
export interface CreationProgress {
  total: number;
  created: number;
  failed: number;
  skipped: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}