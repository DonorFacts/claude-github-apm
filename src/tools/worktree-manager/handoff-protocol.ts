/**
 * Business logic for git worktree handoff protocol
 */

export interface WorktreeInfo {
  path: string;
  branch: string;
  createdAt?: Date;
}

export interface HandoffDecision {
  action: 'redirect' | 'create-new' | 'continue-here';
  targetWorktree?: string;
  reason: string;
}

/**
 * Determines what action to take based on existing worktrees and user request
 */
export function determineHandoffAction(
  existingWorktrees: WorktreeInfo[],
  userRequest: string
): HandoffDecision {
  // No worktrees exist - continue in current window
  if (existingWorktrees.length === 0) {
    return {
      action: 'continue-here',
      reason: 'No active worktrees found'
    };
  }

  // Get most recent worktree
  const mostRecent = getMostRecentWorktree(existingWorktrees);
  
  // Check if user explicitly mentions different scope
  if (isExplicitlyDifferentScope(userRequest)) {
    return {
      action: 'create-new',
      reason: 'User explicitly mentioned different feature or scope'
    };
  }

  // Default: redirect to most recent worktree
  return {
    action: 'redirect',
    targetWorktree: mostRecent.path,
    reason: 'Assuming work relates to active feature in worktree'
  };
}

/**
 * Gets the most recent worktree based on creation time or path
 */
export function getMostRecentWorktree(worktrees: WorktreeInfo[]): WorktreeInfo {
  if (worktrees.length === 0) {
    throw new Error('No worktrees provided');
  }

  // If we have creation dates, use them
  if (worktrees.some(w => w.createdAt)) {
    return worktrees
      .filter(w => w.createdAt)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())[0];
  }

  // Otherwise, return the last one (assuming order matters)
  return worktrees[worktrees.length - 1];
}

/**
 * Detects if user is explicitly asking about different work
 */
export function isExplicitlyDifferentScope(userRequest: string): boolean {
  const differentScopeIndicators = [
    'different bug',
    'different feature',
    'unrelated',
    'separate issue',
    'another problem',
    'switch to',
    'new feature',
    'different task'
  ];

  const lowerRequest = userRequest.toLowerCase();
  return differentScopeIndicators.some(indicator => 
    lowerRequest.includes(indicator)
  );
}

/**
 * Checks if a branch name indicates uncommitted work that should be moved
 */
export function shouldMoveUncommittedWork(
  currentBranch: string,
  hasUncommittedChanges: boolean
): boolean {
  if (!hasUncommittedChanges) {
    return false;
  }

  // Never move changes from feature branches
  if (currentBranch.match(/^(feature|fix|hotfix|bugfix)[-/]/)) {
    return false;
  }

  // Move changes from main/master/develop
  if (['main', 'master', 'develop', 'development'].includes(currentBranch)) {
    return true;
  }

  return false;
}

/**
 * Determines if changes are likely general maintenance
 */
export function isGeneralMaintenance(changedFiles: string[]): boolean {
  const maintenancePatterns = [
    /^package\.json$/,
    /^package-lock\.json$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    /^\.gitignore$/,
    /^README\.md$/,
    /^CHANGELOG\.md$/,
    /^\.github\//,
    /^docs?\//,
    /tsconfig\.json$/,
    /jest\.config\./,
    /\.eslintrc/
  ];

  // If more than 50% of changes are maintenance files, it's likely maintenance
  const maintenanceCount = changedFiles.filter(file =>
    maintenancePatterns.some(pattern => pattern.test(file))
  ).length;

  return maintenanceCount > changedFiles.length / 2;
}