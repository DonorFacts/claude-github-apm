# Test Plan: Git Worktree Handoff Protocol

## Overview
This test plan covers the handoff protocol behavior when creating worktrees and transferring work between VS Code windows.

## Test Categories

### 1. Worktree Creation Tests

#### Happy Path Tests
- **Test 1.1**: Create worktree from clean main branch
  - Given: User is on main branch with no uncommitted changes
  - When: User requests new feature worktree
  - Then: Worktree is created, dependencies installed, VS Code opens with Claude

- **Test 1.2**: Create worktree with uncommitted changes
  - Given: User has uncommitted changes on main
  - When: User requests new feature worktree
  - Then: Changes are moved to feature branch, worktree created

#### Edge Cases
- **Test 1.3**: Create worktree when directory already exists
  - Given: Worktree directory already exists
  - When: User attempts to create same worktree
  - Then: Error is shown with recovery instructions

- **Test 1.4**: Create worktree without pnpm available
  - Given: pnpm is not installed
  - When: Worktree creation attempts pnpm install
  - Then: Warning shown, manual install instructions provided

### 2. Handoff Protocol Tests

#### Happy Path Tests
- **Test 2.1**: Original agent redirects after handoff
  - Given: Worktree has been created and handed off
  - When: User requests code changes in original window
  - Then: Agent refocuses worktree window, refuses to make changes

- **Test 2.2**: Multiple worktrees with correct redirection
  - Given: Multiple worktrees exist
  - When: User requests work in original window
  - Then: Agent redirects to most recent worktree

#### Edge Cases
- **Test 2.3**: User explicitly requests different scope
  - Given: Active worktree exists
  - When: User says "I need to fix a different bug"
  - Then: Agent asks if new worktree should be created

- **Test 2.4**: Worktree deleted but agent checks
  - Given: Worktree was created then manually deleted
  - When: Agent checks for worktree existence
  - Then: Agent allows work in original window

### 3. VS Code Integration Tests

#### Happy Path Tests
- **Test 3.1**: VS Code opens with Claude auto-launch
  - Given: Valid worktree path
  - When: open-worktree-vscode.ts is executed
  - Then: VS Code opens, Claude starts in terminal

- **Test 3.2**: tasks.json copied correctly
  - Given: tasks.json exists in main .vscode
  - When: Worktree is opened
  - Then: tasks.json is copied to worktree .vscode

#### Edge Cases
- **Test 3.3**: VS Code not installed
  - Given: VS Code command not available
  - When: Script tries to open VS Code
  - Then: Error with installation instructions

- **Test 3.4**: Different OS platforms
  - Given: Running on Windows/Linux/macOS
  - When: Opening VS Code
  - Then: Correct platform-specific command used

### 4. File Transfer Tests

#### Happy Path Tests
- **Test 4.1**: Transfer uncommitted changes to worktree
  - Given: Changes on wrong branch
  - When: File transfer process initiated
  - Then: Files correctly moved to worktree

- **Test 4.2**: Handover file execution
  - Given: Handover file exists for branch
  - When: New Claude session starts
  - Then: Handover instructions executed

## Acceptance Criteria

### For Worktree Creation
- [ ] Worktree directory created in correct location
- [ ] Git branch checked out in worktree
- [ ] Dependencies installed via pnpm
- [ ] VS Code opens at worktree path
- [ ] Claude launches in terminal

### For Handoff Protocol
- [ ] Original agent detects worktree existence
- [ ] Redirects ALL code requests to worktree window
- [ ] Only asks about new worktree for explicit different scope
- [ ] Maintains one-feature-one-window principle

### For Error Handling
- [ ] Clear error messages for all failure modes
- [ ] Recovery instructions provided
- [ ] No data loss during transfers
- [ ] Graceful degradation when tools missing

## Test Implementation Order

1. **Phase 1**: Core functionality tests (1.1, 1.2, 2.1)
2. **Phase 2**: Integration tests (3.1, 3.2, 4.1)
3. **Phase 3**: Edge cases and error handling (1.3, 1.4, 2.3, 2.4, 3.3)
4. **Phase 4**: Platform-specific tests (3.4)

## Mock Requirements

- File system operations (mkdirSync, existsSync, copyFileSync)
- Child process execution (execSync)
- Platform detection (os.platform)
- VS Code availability check

## Performance Criteria

- Worktree creation: < 30 seconds including pnpm install
- VS Code launch: < 5 seconds
- Handoff detection: < 100ms