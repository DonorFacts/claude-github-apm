# Debugging Methodology for Claude

## Core Principles

### 1. **Verify, Don't Assume**
- NEVER say "this should fix it" without testing
- ALWAYS validate both success AND failure cases
- If user says it's not working, BELIEVE THEM

### 2. **Start Simple**
- Minimal reproduction case first
- Add complexity only when simple case works
- One change at a time

### 3. **Read Everything**
- User's EXACT error messages
- User's EXACT commands
- User's EXACT file paths
- Small details matter (e.g., "single" vs "BulkIssueCreator")

## Debugging Workflow

### Step 1: Understand the Problem
```
1. What is the expected behavior?
2. What is the actual behavior?
3. What is the EXACT command/code that reproduces it?
4. What is the user's environment?
```

### Step 2: Minimal Reproduction
```javascript
// Before diving deep, create simplest test:
console.log('Key variable:', theVariable);
console.log('Key condition:', theCondition);
// If this is wrong, fix this first
```

### Step 3: Systematic Investigation
```
1. Start at the beginning of execution flow
2. Add logging at each decision point
3. Verify assumptions at each step
4. Don't skip ahead
```

### Step 4: Validate Solutions
```
1. Test the success case
2. Test the failure case
3. Test edge cases
4. Ask: "How do I KNOW this is fixed?"
```

## Common Pitfalls to Avoid

1. **Adding Complexity**: Don't add features/checks to "fix" undefined behavior
2. **Assumption Stacking**: Each assumption multiplies debugging time
3. **Partial Information**: Always get complete error messages and logs
4. **Wrong Layer**: Start debugging at the highest level, work down
5. **Celebrating Early**: Don't claim victory until validated

## Remember

- User's time is valuable - be efficient
- Admitting uncertainty is better than false confidence
- Simple solutions are usually correct
- When stuck, step back and reconsider approach