# Prompt A-B Testing Framework

This directory contains automated tests for comparing prompt engineering approaches.

## Running the Tests

```bash
# Run all prompt A-B tests
pnpm test tests/prompts/prompt-ab-testing.test.ts

# Run with coverage
pnpm test -- --coverage tests/prompts/prompt-ab-testing.test.ts

# Run specific test scenario
pnpm test -- -t "Cold Initialization"
```

## Test Structure

### Main Test File
- `prompt-ab-testing.test.ts` - Jest test suite with 5 scenarios

### Utilities
- `utils/prompt-tester.ts` - Loads prompts, runs scenarios, measures performance
- `utils/token-counter.ts` - Estimates token usage for prompts and responses
- `utils/prompt-validator.ts` - Compares results and generates recommendations

## Test Scenarios

1. **Cold Initialization** - Fresh agent start with no existing memory
2. **Warm Initialization** - Agent resuming with existing context
3. **Prompt Optimization** - Optimizing a large prompt for token efficiency
4. **Create Agent Prompt** - Designing a new agent prompt from scratch
5. **Context Degradation** - Handling near-context-limit situations

## Metrics Evaluated

- **Token Efficiency** (40% weight)
  - Input tokens
  - Output tokens
  - Total token usage
  
- **Task Completion** (30% weight)
  - All required steps completed
  - Accuracy of implementation
  
- **Response Quality** (20% weight)
  - Clarity and structure
  - Actionability
  
- **User Experience** (10% weight)
  - Response time
  - Natural flow

## Expected Outcomes

The optimized Version B prompts should:
- Reduce token usage by 40%+ on average
- Maintain task completion rates
- Preserve response quality
- Improve response times

## Report Generation

After running tests, a detailed report is generated at:
`tests/prompts/ab-test-report.md`

This report includes:
- Scenario-by-scenario comparison
- Quantitative metrics
- Qualitative assessment
- Final recommendation
- Implementation guidance