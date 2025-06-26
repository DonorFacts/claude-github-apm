# Test-Driven Development Workflow

## TDD Cycle Overview

<tdd_cycle>
The TDD cycle consists of three phases that must be followed in strict order:

1. **RED**: Write a failing test
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while keeping tests green
</tdd_cycle>

## Detailed TDD Process

<process>
### Step 1: Understand Requirements
Before writing any test:
- Clarify acceptance criteria
- Identify happy paths
- List edge cases
- Consider error scenarios
- Define expected behaviors

### Step 2: Write Failing Tests
```typescript
// Example: User authentication feature
describe('UserAuthentication', () => {
  describe('login', () => {
    it('should authenticate valid credentials', async () => {
      const result = await auth.login('user@example.com', 'password123');
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('user@example.com');
    });

    it('should reject invalid credentials', async () => {
      const result = await auth.login('user@example.com', 'wrongpassword');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle rate limiting', async () => {
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await auth.login('user@example.com', 'wrong');
      }
      
      const result = await auth.login('user@example.com', 'password123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many attempts. Please try again later.');
    });
  });
});
```

### Step 3: Run Tests (Verify Failure)
```bash
pnpm test UserAuthentication
# All tests should fail with clear error messages
```

### Step 4: Implement Minimal Code
```typescript
// Only write enough code to make tests pass
class UserAuthentication {
  private attempts = new Map<string, number>();
  
  async login(email: string, password: string) {
    // Check rate limiting
    const attemptCount = this.attempts.get(email) || 0;
    if (attemptCount >= 5) {
      return {
        success: false,
        error: 'Too many attempts. Please try again later.'
      };
    }
    
    // Validate credentials
    const user = await this.validateCredentials(email, password);
    if (!user) {
      this.attempts.set(email, attemptCount + 1);
      return {
        success: false,
        error: 'Invalid credentials'
      };
    }
    
    // Reset attempts on success
    this.attempts.delete(email);
    
    // Generate token
    const token = await this.generateToken(user);
    
    return {
      success: true,
      token,
      user: { email: user.email }
    };
  }
}
```

### Step 5: Run Tests Again (Verify Pass)
```bash
pnpm test UserAuthentication
# All tests should now pass
```

### Step 6: Refactor
```typescript
// Improve code structure while keeping tests green
class UserAuthentication {
  private rateLimiter: RateLimiter;
  private tokenService: TokenService;
  
  constructor(
    rateLimiter: RateLimiter,
    tokenService: TokenService
  ) {
    this.rateLimiter = rateLimiter;
    this.tokenService = tokenService;
  }
  
  async login(email: string, password: string): Promise<AuthResult> {
    // Check rate limiting
    if (await this.rateLimiter.isLimited(email)) {
      return AuthResult.rateLimited();
    }
    
    // Validate credentials
    const user = await this.validateCredentials(email, password);
    if (!user) {
      await this.rateLimiter.recordFailure(email);
      return AuthResult.invalidCredentials();
    }
    
    // Success flow
    await this.rateLimiter.reset(email);
    const token = await this.tokenService.generate(user);
    
    return AuthResult.success(token, user);
  }
}
```

### Step 7: Verify Tests Still Pass
```bash
pnpm test UserAuthentication
# Ensure refactoring didn't break anything
```
</process>

## Test Categories

<test_categories>
### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Fast execution (< 100ms per test)
- High coverage of business logic

### Integration Tests
- Test component interactions
- Use real dependencies where possible
- Test database operations
- Verify API contracts

### End-to-End Tests
- Test complete user workflows
- Run in browser environment
- Verify UI interactions
- Test critical paths only (expensive)

### Performance Tests
- Measure response times
- Check memory usage
- Verify scalability
- Profile bottlenecks
</test_categories>

## Testing Best Practices

<best_practices>
### Test Naming Convention
```typescript
// Format: should_expectedBehavior_when_condition
it('should_return_user_data_when_valid_token_provided', () => {});
it('should_throw_error_when_token_expired', () => {});
it('should_retry_three_times_when_network_fails', () => {});
```

### Arrange-Act-Assert Pattern
```typescript
it('should calculate total with tax', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];
  const taxRate = 0.1;
  
  // Act
  const total = calculateTotal(items, taxRate);
  
  // Assert
  expect(total).toBe(38.5); // (20 + 15) * 1.1
});
```

### Test Data Builders
```typescript
// Create reusable test data factories
class UserBuilder {
  private user = {
    id: 'test-id',
    email: 'test@example.com',
    role: 'user'
  };
  
  withEmail(email: string) {
    this.user.email = email;
    return this;
  }
  
  withRole(role: string) {
    this.user.role = role;
    return this;
  }
  
  build() {
    return { ...this.user };
  }
}

// Usage in tests
const adminUser = new UserBuilder()
  .withRole('admin')
  .withEmail('admin@example.com')
  .build();
```

### Mock Strategies
```typescript
// Mock external services
jest.mock('./emailService');

// Spy on methods
const sendEmailSpy = jest.spyOn(emailService, 'send');

// Verify interactions
expect(sendEmailSpy).toHaveBeenCalledWith({
  to: 'user@example.com',
  subject: 'Welcome',
  body: expect.stringContaining('Thank you')
});
```
</best_practices>

## Common TDD Pitfalls

<pitfalls>
### Pitfall 1: Writing Implementation First
❌ Never write code before tests
✅ Always start with a failing test

### Pitfall 2: Testing Implementation Details
❌ Don't test private methods directly
✅ Test public interfaces and behaviors

### Pitfall 3: Overly Coupled Tests
❌ Avoid tests that break with refactoring
✅ Test behaviors, not implementations

### Pitfall 4: Ignoring Test Maintenance
❌ Don't let tests become outdated
✅ Refactor tests alongside code

### Pitfall 5: Incomplete Coverage
❌ Don't skip edge cases
✅ Test error paths and boundaries
</pitfalls>

## TDD Checklist

<checklist>
Before marking any feature complete:

- [ ] All acceptance criteria have corresponding tests
- [ ] Happy path scenarios are tested
- [ ] Edge cases are covered
- [ ] Error scenarios are handled
- [ ] Tests are readable and maintainable
- [ ] No test is testing implementation details
- [ ] Coverage report shows > 80%
- [ ] All tests pass consistently
- [ ] Performance tests pass (if applicable)
- [ ] Integration tests verify external interactions
</checklist>

## Advanced TDD Techniques

<advanced>
### Property-Based Testing
```typescript
import fc from 'fast-check';

describe('sorting algorithm', () => {
  it('should maintain array length', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = sortArray([...arr]);
        expect(sorted.length).toBe(arr.length);
      })
    );
  });
  
  it('should produce ordered output', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (arr) => {
        const sorted = sortArray([...arr]);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
        }
      })
    );
  });
});
```

### Mutation Testing
```typescript
// Use Stryker or similar to verify test quality
// Mutations should cause tests to fail
// High mutation score = robust tests
```

### Contract Testing
```typescript
// Define contracts between services
interface UserServiceContract {
  getUser(id: string): Promise<{
    id: string;
    email: string;
    createdAt: Date;
  }>;
}

// Test both provider and consumer
describe('UserService Contract', () => {
  it('provider should fulfill contract', async () => {
    const user = await userService.getUser('123');
    expect(user).toMatchObject({
      id: expect.any(String),
      email: expect.stringMatching(/^.+@.+$/),
      createdAt: expect.any(Date)
    });
  });
});
```
</advanced>