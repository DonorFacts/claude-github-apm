import {
  determineHandoffAction,
  getMostRecentWorktree,
  isExplicitlyDifferentScope,
  shouldMoveUncommittedWork,
  isGeneralMaintenance,
  WorktreeInfo
} from './handoff-protocol';

describe('Handoff Protocol', () => {
  describe('determineHandoffAction', () => {
    it('should continue in current window when no worktrees exist', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [];
      const userRequest = 'Add authentication feature';
      const currentBranch = 'main';

      // Act
      const decision = determineHandoffAction(worktrees, userRequest);

      // Assert
      expect(decision.action).toBe('continue-here');
      expect(decision.reason).toBe('No active worktrees found');
    });

    it('should redirect to most recent worktree by default', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [
        { path: '../worktrees/feature-auth', branch: 'feature-auth' },
        { path: '../worktrees/feature-ui', branch: 'feature-ui' }
      ];
      const userRequest = 'Add password validation';
      const currentBranch = 'main';

      // Act
      const decision = determineHandoffAction(worktrees, userRequest);

      // Assert
      expect(decision.action).toBe('redirect');
      expect(decision.targetWorktree).toBe('../worktrees/feature-ui');
      expect(decision.reason).toBe('Assuming work relates to active feature in worktree');
    });

    it('should suggest creating new worktree for explicitly different scope', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [
        { path: '../worktrees/feature-auth', branch: 'feature-auth' }
      ];
      const userRequest = 'I need to fix a different bug in the payment system';
      const currentBranch = 'main';

      // Act
      const decision = determineHandoffAction(worktrees, userRequest);

      // Assert
      expect(decision.action).toBe('create-new');
      expect(decision.reason).toBe('User explicitly mentioned different feature or scope');
    });
  });

  describe('getMostRecentWorktree', () => {
    it('should throw error when no worktrees provided', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [];

      // Act & Assert
      expect(() => getMostRecentWorktree(worktrees)).toThrow('No worktrees provided');
    });

    it('should return most recent by creation date when available', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [
        { 
          path: '../worktrees/old-feature', 
          branch: 'old-feature',
          createdAt: new Date('2024-01-01')
        },
        { 
          path: '../worktrees/new-feature', 
          branch: 'new-feature',
          createdAt: new Date('2024-01-02')
        }
      ];

      // Act
      const result = getMostRecentWorktree(worktrees);

      // Assert
      expect(result.branch).toBe('new-feature');
    });

    it('should return last worktree when no creation dates', () => {
      // Arrange
      const worktrees: WorktreeInfo[] = [
        { path: '../worktrees/first', branch: 'first' },
        { path: '../worktrees/second', branch: 'second' },
        { path: '../worktrees/third', branch: 'third' }
      ];

      // Act
      const result = getMostRecentWorktree(worktrees);

      // Assert
      expect(result.branch).toBe('third');
    });
  });

  describe('isExplicitlyDifferentScope', () => {
    it.each([
      ['I need to work on a different feature', true],
      ['Fix a different bug', true],
      ['This is unrelated to the current work', true],
      ['Switch to the login feature', true],
      ['I have another problem to solve', true],
      ['Can you add tests?', false],
      ['Update the documentation', false],
      ['Refactor this code', false]
    ])('should detect "%s" as different scope: %s', (request, expected) => {
      expect(isExplicitlyDifferentScope(request)).toBe(expected);
    });
  });

  describe('shouldMoveUncommittedWork', () => {
    it('should not move when no uncommitted changes', () => {
      // Arrange & Act & Assert
      expect(shouldMoveUncommittedWork('main', false)).toBe(false);
      expect(shouldMoveUncommittedWork('feature-123', false)).toBe(false);
    });

    it('should move uncommitted changes from main/master/develop', () => {
      // Arrange & Act & Assert
      expect(shouldMoveUncommittedWork('main', true)).toBe(true);
      expect(shouldMoveUncommittedWork('master', true)).toBe(true);
      expect(shouldMoveUncommittedWork('develop', true)).toBe(true);
    });

    it('should indicate changes CAN be moved from feature branches', () => {
      // Arrange & Act & Assert
      // Changed: now returns true to indicate moving is POSSIBLE
      // The actual decision requires more context
      expect(shouldMoveUncommittedWork('feature-auth', true)).toBe(true);
      expect(shouldMoveUncommittedWork('fix-bug-123', true)).toBe(true);
      expect(shouldMoveUncommittedWork('hotfix/security', true)).toBe(true);
      expect(shouldMoveUncommittedWork('bugfix/memory-leak', true)).toBe(true);
    });
  });

  describe('isGeneralMaintenance', () => {
    it('should identify maintenance-heavy changesets', () => {
      // Arrange
      const files = [
        'package.json',
        'pnpm-lock.yaml',
        'README.md',
        '.gitignore',
        'src/index.ts' // Only 1 non-maintenance file
      ];

      // Act & Assert
      expect(isGeneralMaintenance(files)).toBe(true);
    });

    it('should not identify feature work as maintenance', () => {
      // Arrange
      const files = [
        'src/auth/login.ts',
        'src/auth/register.ts',
        'src/auth/types.ts',
        'tests/auth.test.ts',
        'package.json' // Only 1 maintenance file
      ];

      // Act & Assert
      expect(isGeneralMaintenance(files)).toBe(false);
    });

    it('should handle edge case of 50/50 split', () => {
      // Arrange
      const files = [
        'package.json',
        'README.md',
        'src/feature.ts',
        'src/feature.test.ts'
      ];

      // Act & Assert
      expect(isGeneralMaintenance(files)).toBe(false); // Exactly 50% is not > 50%
    });

    it('should recognize various config files as maintenance', () => {
      // Arrange
      const files = [
        'tsconfig.json',
        'jest.config.js',
        '.eslintrc.json',
        '.github/workflows/test.yml',
        'docs/api.md'
      ];

      // Act & Assert
      expect(isGeneralMaintenance(files)).toBe(true);
    });
  });
});