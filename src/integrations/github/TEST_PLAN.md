# Bulk Issue Creator Test Plan

## Test Strategy

Following TDD practices:
1. Write failing tests first
2. Watch them fail
3. Write minimal implementation to pass
4. Refactor for quality

## Test Categories

### 1. Happy Path Tests

#### Test: Create Single Issue
- Load plan with one task
- Create issue successfully
- Verify issue number saved to plan
- Verify backup created

#### Test: Create Issue Hierarchy (Phase > Epic > Task)
- Load plan with 3-level hierarchy
- Create issues level by level
- Verify parent-child relationships created
- Verify all issue numbers saved

#### Test: Batch Creation (20 issues)
- Load plan with exactly 20 tasks at same level
- Verify GraphQL batch mutation used
- Verify all issues created in single API call
- Verify issue numbers saved correctly

#### Test: Multiple Batches (25 issues)
- Load plan with 25 tasks (needs 2 batches)
- Verify 2 GraphQL calls made (20 + 5)
- Verify all issues created successfully

#### Test: Skip Existing Issues
- Load plan with some issues already having numbers
- Verify existing issues are skipped
- Verify only new issues created
- Verify relationships still created

### 2. Edge Cases & Error Handling

#### Test: Invalid YAML File
- Test with malformed YAML
- Expect graceful error message
- Verify no GitHub API calls made

#### Test: Missing Parent Reference
- Plan with task referencing non-existent parent
- Expect validation error
- Verify helpful error message

#### Test: GitHub API Rate Limit
- Mock API to return rate limit error
- Verify exponential backoff retry
- Verify eventual success or graceful failure

#### Test: Batch Creation Partial Failure
- Mock batch API to fail partially
- Verify fallback to individual creation
- Verify all issues eventually created

#### Test: Network Failure
- Mock network timeout
- Verify retry logic
- Verify error reporting

#### Test: Duplicate Issue Detection
- Create issue, then try to create again
- Verify duplicate detected via search
- Verify existing issue reused

#### Test: Missing Required Fields
- Plan with items missing title/type
- Expect validation error
- Verify specific error messages

#### Test: Invalid Issue Type
- Plan with unknown issue type
- Expect helpful error about valid types
- Verify no creation attempted

#### Test: File Write Permission Error
- Mock file system to fail on write
- Verify error handling
- Verify no partial state left

#### Test: Empty Plan
- Load plan with no items
- Verify graceful handling
- Verify appropriate message

### 3. Integration Tests

#### Test: Real GitHub API (with test repo)
- Use dedicated test repository
- Create small hierarchy
- Verify actual GitHub issues created
- Clean up issues after test

#### Test: Cross-Level Dependencies
- Complex plan with multiple cross-references
- Verify correct creation order
- Verify all relationships established

### 4. Performance Tests

#### Test: Large Plan (100+ issues)
- Load plan with 100+ items
- Verify efficient batching
- Measure execution time
- Verify memory usage reasonable

### 5. CLI Tests

#### Test: Command Line Arguments
- Test with explicit plan file path
- Test with default path
- Test with non-existent file
- Test help output

## Test Implementation Order

1. **Setup Phase**
   - Configure Jest for TypeScript
   - Create test utilities and mocks
   - Set up test fixtures

2. **Unit Tests First**
   - Test individual methods in isolation
   - Mock all external dependencies
   - Focus on business logic

3. **Integration Tests**
   - Test with real file system
   - Mock only GitHub API
   - Test error scenarios

4. **E2E Tests (Limited)**
   - Use test GitHub repo
   - Create minimal test issues
   - Always clean up

## Test Utilities Needed

```typescript
// Mock implementations
- MockGitHubClient
- MockFileSystem
- TestPlanBuilder (for creating test fixtures)

// Cleanup utilities
- deleteTestIssues(repo, issueNumbers)
- cleanupTestFiles()

// Assertion helpers
- expectIssueCreated(issue)
- expectRelationshipCreated(parent, child)
- expectPlanUpdated(planPath, issueNumbers)
```

## Cleanup Strategy

1. Track all created test issues
2. Use unique label for test issues (e.g., "test-bulk-creator")
3. Delete issues after each test
4. Verify cleanup in afterEach/afterAll hooks
5. Have manual cleanup script as backup

## Success Criteria

- 100% code coverage for business logic
- All happy path scenarios pass
- All error cases handled gracefully
- No test issues left in GitHub
- Tests run in < 30 seconds
- Clear test output for debugging