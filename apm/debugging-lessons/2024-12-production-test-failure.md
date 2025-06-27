# Debugging Lessons: Production Test Failure (December 2024)

## Executive Summary
A supposedly simple issue - "production tests pass offline when they should fail" - took excessive time to resolve due to multiple debugging missteps and false assumptions.

## Timeline of Mistakes

### 1. **Assumption-Based "Solutions" Without Validation**
- **What I did**: Repeatedly claimed "the issue is fixed" after making changes
- **What went wrong**: Never actually validated the fix by testing offline scenarios
- **What I should have done**: After EVERY change, explicitly test the failure case

### 2. **Overcomplicating the Problem**
- **What I did**: Added network connectivity checks, theorized about gh CLI caching, created complex wrapper scripts
- **What went wrong**: Added layers of complexity instead of finding root cause
- **What I should have done**: Start with minimal reproduction case and systematically eliminate variables

### 3. **Missing Critical Details in Test Output**
- **What I did**: Focused on test success/failure without examining WHICH test was running
- **What went wrong**: User ran `pnpm test:prod:verbose single` which matched `SingleIssueCreator.test.ts`, not `BulkIssueCreator.test.ts`
- **What I should have done**: Always verify the exact test file being executed

### 4. **Not Understanding the Test Environment**
- **What I did**: Assumed environment variables would "just work" in npm scripts
- **What went wrong**: Jest runs tests in child processes; env vars weren't propagating
- **What I should have done**: Research Jest's architecture before making assumptions

### 5. **Debugging in the Wrong Direction**
- **What I did**: Added debugging to GitHubClient, error handlers, network checks
- **What went wrong**: The issue was earlier in the stack - env var not being set at all
- **What I should have done**: Start debugging from the earliest point (env var definition) and trace forward

## Root Cause Analysis

**The Actual Issue**: `APM_TEST_PROD=true` in npm scripts wasn't propagating to Jest's test environment

**Why It Happened**: 
1. `package.json` script: `"test:prod": "APM_TEST_PROD=true tsc --noEmit && jest"`
2. The env var was set for `tsc` but not passed to `jest`
3. Jest's child processes didn't inherit the env var
4. Tests always ran with `shouldUseMocks = true`

**The Fix**: Use Jest's `setupFiles` to set env vars before any test code loads

## Debugging Best Practices (What I Should Have Done)

### 1. **Validate at Every Step**
```bash
# After any change:
1. Run the test in normal mode - verify it passes
2. Run the test in failure mode - verify it fails
3. Check the specific failure reason matches expectations
```

### 2. **Trace Execution Path**
```javascript
// Add logging at EVERY decision point:
console.log('[Location] Variable =', variable);
console.log('[Location] Condition =', condition);
console.log('[Location] Path taken =', path);
```

### 3. **Minimal Reproduction**
```javascript
// Create the simplest possible test case:
console.log('ENV VAR:', process.env.APM_TEST_PROD);
console.log('Should use mocks:', !process.env.APM_TEST_PROD);
// If this is wrong, everything else is irrelevant
```

### 4. **Read Error Messages Carefully**
- User showed `SingleIssueCreator.test.ts` was running, not `BulkIssueCreator.test.ts`
- This critical detail was in the logs but I missed it

### 5. **Research Before Assuming**
- Should have looked up "Jest environment variables" immediately
- Would have found the `setupFiles` vs `setupFilesAfterEnv` issue

## Specific Improvements for Future Debugging

### 1. **Systematic Validation Checklist**
- [ ] What is the EXACT command being run?
- [ ] What is the EXACT file being tested?
- [ ] What are the EXACT values of all relevant variables?
- [ ] Does the test fail when it should fail?
- [ ] Does the test pass when it should pass?

### 2. **Environment Variable Debugging**
```javascript
// Always add this when debugging env vars:
console.log('=== ENVIRONMENT DEBUG ===');
console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('APM')));
console.log('Target var:', process.env.YOUR_VAR);
console.log('Type:', typeof process.env.YOUR_VAR);
console.log('======================');
```

### 3. **Test Framework Architecture**
- Jest runs tests in child processes
- Environment variables need special handling
- `setupFiles` runs BEFORE module imports
- `setupFilesAfterEnv` runs AFTER module imports

### 4. **Issue Number Tracking Pattern**
The issue number tracking solution was good and should be reused:
- GitHub issues have sequential, never-reused numbers
- Tracking these numbers definitively proves if real API calls occurred
- This pattern works for any incrementing ID system

## Key Takeaway

**When debugging, start with the simplest possible verification and work up. Don't add complexity until you understand the problem.**

## References for Future
- Jest Environment Variables: https://jestjs.io/docs/environment-variables
- Jest Configuration: https://jestjs.io/docs/configuration
- This debugging session: December 2024, production tests passing offline