import { Repository, IssueTypes } from '../bulk-issue-creator/types';

export interface MarkdownHeader {
  level: number;
  text: string;
  issueNumber?: number;
  metadata?: Record<string, any>;
}

export interface MarkdownListItem {
  type: string;
  title: string;
  issueNumber?: number;
  metadata?: Record<string, any>;
  description: string[];
}

export interface ParseContext {
  currentPhase?: string;
  currentProject?: string;
  currentEpic?: string;
  currentFeature?: string;
  parentStack: string[];
}