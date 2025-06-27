# Testing Strategy

## Overview
This project uses a layered testing approach with safe defaults and explicit configuration for external API testing.

## Test Modes

### Unit Tests (Default)
```bash
npm test
```
- ✅ **Default behavior** - no environment variables needed
- Uses mocks for all GitHub API calls
- Fast execution (~17 seconds)
- Safe - no external API calls or data creation

### Production Tests
```bash
npm run test:prod
# OR
APM_TEST_PROD=true TEST_REPO=myuser/test-repo npm test
```
- ⚠️ **Requires explicit environment variables**
- Hits real GitHub APIs
- Creates and deletes actual issues
- Requires GitHub CLI (`gh`) authentication
- **Safety**: Refuses to run against production repositories

## Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `APM_TEST_PROD` | Enable real GitHub API calls | `false` | For production tests |
| `TEST_REPO` | Target repository for production tests | `test-user/test-repo` | For production tests |

## Safety Features

### Production Protection
The test suite automatically refuses to run production tests against known production repositories:
- `DonorFacts/claude-github-apm`
- `anthropics/claude-code`

### Automatic Cleanup
Production tests automatically clean up any created issues after each test to prevent repository pollution.

### Mock by Default
All tests use mocks unless explicitly configured otherwise, preventing accidental external API calls during development.

## Examples

### Running unit tests (everyday development)
```bash
# Default: silent output
pnpm test

# Run specific files/patterns with verbose output
pnpm test edge --verbose
pnpm test BulkIssueCreator --verbose
pnpm test src/tools/issue-type-config/ --verbose

# Common Jest flags (all work with file patterns)
pnpm test --watch                      # Watch mode
pnpm test pattern --coverage          # Coverage report
pnpm test --testNamePattern="create"   # Test name matching
```

### Running production tests against a test repository
```bash
# Default: silent against test repository  
pnpm run test:prod

# Production tests with verbose output
pnpm run test:prod edge --verbose
pnpm run test:prod src/tools/issue-type-config/ --verbose

# Custom repository
APM_TEST_PROD=true TEST_REPO=myusername/my-test-repo pnpm test pattern --verbose
```

### Running specific test suites
```bash
npm test src/tools/issue-type-config/
npm test -- --testNamePattern="IssueTypeDiscoveryService"
```

## Best Practices

1. **Always run unit tests first** during development
2. **Use production tests sparingly** - only when testing actual GitHub API integration
3. **Never run production tests against production** repositories
4. **Set up a dedicated test repository** for production testing
5. **Ensure GitHub CLI is authenticated** before running production tests