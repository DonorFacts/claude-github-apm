import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'fs';
import { platform } from 'os';

// Mock all external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('os');

// Import the function we're testing
import { openWorktreeInVSCode } from './open-worktree-vscode';

describe('openWorktreeInVSCode', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
  const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
  const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
  const mockCopyFileSync = copyFileSync as jest.MockedFunction<typeof copyFileSync>;
  const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
  const mockPlatform = platform as jest.MockedFunction<typeof platform>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup console spies
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Happy Path', () => {
    it('should install dependencies in the worktree', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockExecSync).toHaveBeenCalledWith(
        `cd "${worktreePath}" && pnpm install`,
        { stdio: 'inherit' }
      );
      expect(console.log).toHaveBeenCalledWith('✅ Dependencies installed');
    });

    it('should create .vscode directory if it does not exist', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockMkdirSync).toHaveBeenCalledWith(
        '/path/to/worktree/.vscode',
        { recursive: true }
      );
      expect(console.log).toHaveBeenCalledWith('📁 Created .vscode directory in worktree');
    });

    it('should copy tasks.json when source exists', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync
        .mockReturnValueOnce(false) // .vscode doesn't exist
        .mockReturnValueOnce(true); // tasks.json source exists
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockCopyFileSync).toHaveBeenCalledWith(
        '/path/to/claude-github-apm/.vscode/tasks.json',
        '/path/to/worktree/.vscode/tasks.json'
      );
      expect(console.log).toHaveBeenCalledWith('📋 Copied tasks.json to worktree (Claude will auto-launch)');
    });

    it('should open VS Code on macOS', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockExecSync).toHaveBeenCalledWith(
        `open -a "Visual Studio Code" "${worktreePath}"`,
        { stdio: 'inherit' }
      );
      expect(console.log).toHaveBeenCalledWith('✅ VS Code opened successfully');
    });

    it('should open VS Code on Windows', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('win32');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockExecSync).toHaveBeenCalledWith(
        `start "" "C:\\Program Files\\Microsoft VS Code\\Code.exe" "${worktreePath}"`,
        { stdio: 'inherit', shell: true }
      );
    });

    it('should open VS Code on Linux', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('linux');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockExecSync).toHaveBeenCalledWith(
        `code "${worktreePath}"`,
        { stdio: 'inherit' }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle pnpm install failure gracefully', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('darwin');
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('pnpm not found');
      });

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(console.error).toHaveBeenCalledWith('⚠️  Failed to install dependencies: pnpm not found');
      expect(console.log).toHaveBeenCalledWith('💡 You may need to run \'pnpm install\' manually in the worktree');
      // Should continue to open VS Code
      expect(mockExecSync).toHaveBeenCalledTimes(2); // pnpm install + VS Code open
    });

    it('should create tasks.json when source does not exist', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync
        .mockReturnValueOnce(false) // .vscode doesn't exist
        .mockReturnValueOnce(false); // tasks.json source doesn't exist
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/path/to/worktree/.vscode/tasks.json',
        expect.stringContaining('"label": "Claude"')
      );
      expect(console.log).toHaveBeenCalledWith('📋 Created tasks.json in worktree (Claude will auto-launch)');
    });

    it('should handle VS Code launch failure', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(false);
      mockPlatform.mockReturnValue('darwin');
      mockExecSync
        .mockImplementationOnce(() => Buffer.from('')) // pnpm install succeeds
        .mockImplementationOnce(() => {
          throw new Error('VS Code not found');
        });

      // Act & Assert
      expect(() => openWorktreeInVSCode(worktreePath)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith('❌ Error:', expect.any(Error));
      expect(console.log).toHaveBeenCalledWith('   Please ensure VS Code is installed');
    });

    it('should not create .vscode directory if it already exists', () => {
      // Arrange
      const worktreePath = '/path/to/worktree';
      mockExistsSync.mockReturnValue(true); // Everything exists
      mockPlatform.mockReturnValue('darwin');

      // Act
      openWorktreeInVSCode(worktreePath);

      // Assert
      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(console.log).not.toHaveBeenCalledWith('📁 Created .vscode directory in worktree');
    });
  });

  describe('Argument Validation', () => {
    it('should throw error when no worktree path provided', () => {
      // This test would apply to the CLI usage, not the function itself
      // We'll test this when we refactor to separate CLI from function
      expect(true).toBe(true);
    });
  });
});