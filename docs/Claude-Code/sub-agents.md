# Claude Code Sub-Agents User Guide

## Overview

Claude Code features a powerful native Task tool (also known as AgentTool) that enables recursive problem-solving through sub-agents. These sub-agents can perform complex operations like searching codebases, analyzing files, and executing tasks without consuming your main conversation's context window. This guide covers both Claude Code's native Task tool and project-specific agent patterns.

## What Are Sub-Agents?

Sub-agents are specialized Claude instances that:
- Focus on specific domains or tasks
- Operate with their own context and memory
- Can work in parallel with other agents
- Return only the final results (preserving your main context)
- Are invoked through Claude Code's native Task tool
- Can use tools like Read, Grep, Glob, and Bash within their isolated context

## When to Use Sub-Agents

According to the project's `CLAUDE.md` guidelines, use a sub-agent when:

1. **Specialized Expertise Needed**: A task requires deep domain knowledge that a specialized agent would handle more efficiently
2. **Context Window Management**: You need only the final result of a long task and want to avoid cluttering your main context with implementation details
3. **Parallel Processing**: Multiple independent tasks can be handled simultaneously by different agents
4. **Outside Current Context**: The task falls outside your current expertise or working context

## Claude Code's Native Task Tool

### How It Works
The Task tool enables Claude to spawn sub-agents that operate independently:

```python
# Example: Claude using Task tool to search for authentication logic
Task(
    description="Find authentication implementation",
    prompt="Search the codebase for authentication-related code, including login, logout, token validation, and session management. Return a summary of key files and their purposes."
)
```

### Key Features
- **Recursive Problem-Solving**: Sub-agents can spawn their own sub-agents if needed
- **Tool Access**: Sub-agents have access to Read, Grep, Glob, Bash, and other tools
- **Context Isolation**: Work performed by sub-agents doesn't consume main context
- **Parallel Execution**: Multiple sub-agents can run concurrently
- **Smart Summarization**: Only relevant results are returned to main conversation

### Task Tool Parameters
- `description`: A short (3-5 word) description of the task
- `prompt`: Detailed instructions for the sub-agent to follow autonomously

## Best Practices for Using the Task Tool

### 1. Be Explicit and Detailed
Provide comprehensive instructions in the prompt:
```python
Task(
    description="Analyze test coverage",
    prompt="""
    1. Find all test files in the project (*.test.ts, *.spec.ts)
    2. Identify which components/modules have tests
    3. List components/modules without test coverage
    4. Calculate approximate test coverage percentage
    5. Return a summary with recommendations for improving coverage
    """
)
```

### 2. Leverage Parallel Processing
Launch multiple sub-agents for independent tasks:
```python
# Claude can invoke these simultaneously
Task(description="Analyze frontend", prompt="...")
Task(description="Analyze backend", prompt="...")
Task(description="Check dependencies", prompt="...")
```

### 3. Use for Research-Heavy Tasks
Ideal for tasks requiring extensive file exploration:
- Finding where specific functionality is implemented
- Understanding code architecture
- Gathering information across multiple files
- Analyzing patterns and conventions

### 4. Avoid for Simple Operations
Don't use sub-agents for tasks you can do directly:
- Reading a specific file (use Read tool)
- Simple grep searches (use Grep tool)
- Running a single command (use Bash tool)

## Common Sub-Agent Patterns

### Pattern 1: Codebase Explorer
```python
Task(
    description="Map authentication flow",
    prompt="""
    Trace the complete authentication flow in this application:
    1. Find where users log in (UI components)
    2. Locate API endpoints for authentication
    3. Identify middleware/guards protecting routes
    4. Find token/session management code
    5. Create a flow diagram showing how these components interact
    """
)
```

### Pattern 2: Multi-File Analyzer
```python
Task(
    description="Analyze component usage",
    prompt="""
    Find all uses of the Button component:
    1. Search for all imports of Button
    2. Analyze props passed to each instance
    3. Identify any non-standard usage patterns
    4. Suggest refactoring opportunities
    """
)
```

### Pattern 3: Documentation Generator
```python
Task(
    description="Generate API docs",
    prompt="""
    Create documentation for all REST endpoints:
    1. Find all route definitions
    2. Extract HTTP methods, paths, and parameters
    3. Identify request/response types
    4. Generate OpenAPI-compatible documentation
    """
)
```

## The 7-Parallel-Task Method

For maximum efficiency, structure complex features into 7 parallel tasks:

```python
# Example: Implementing a new feature
Task(description="Create component", prompt="Create main React component...")
Task(description="Create styles", prompt="Generate CSS modules...")
Task(description="Create tests", prompt="Write unit tests...")
Task(description="Create types", prompt="Define TypeScript types...")
Task(description="Create hooks", prompt="Build custom hooks...")
Task(description="Update routing", prompt="Add routes and navigation...")
Task(description="Update config", prompt="Modify configuration files...")
```

## Project-Specific Agent System

### Manual Agent Process

While Claude Code has the native Task tool, this project also maintains specialized agent profiles that can be manually initialized:

### Available Project Agents

Check existing agents in `src/prompts/agents/`:
- **Developer Agents**: For implementation tasks
- **QA Engineer**: For testing and validation
- **Scrum Master**: For project planning and critiques
- **Prompt Engineer**: For optimizing prompts and instructions
- **Specialized Agents**: Created ad-hoc for specific expertise

### Manual Initialization (When Task Tool Isn't Suitable)
For long-running sessions or when you need persistent agent context:
```bash
# In a new terminal tab
claude @src/prompts/agents/<agent-name>/init.md
```

## Task Tool vs Manual Agents: When to Use Each

### Use Task Tool When:
- You need quick, one-off research or analysis
- Tasks are well-defined and can complete autonomously
- You want to preserve main context window
- Multiple independent tasks can run in parallel
- Results can be summarized effectively

### Use Manual Agents When:
- You need persistent context across multiple sessions
- The task requires ongoing collaboration
- You want to build specialized expertise over time
- Complex features need dedicated attention
- You need full visibility into the agent's work

## Advanced Task Tool Techniques

### 1. Chained Sub-Agents
Sub-agents can spawn their own sub-agents:
```python
Task(
    description="Refactor module",
    prompt="""
    1. First, spawn a sub-agent to analyze current module structure
    2. Based on findings, spawn another sub-agent to identify refactoring opportunities
    3. Create a detailed refactoring plan with specific steps
    """
)
```

### 2. Conditional Delegation
```python
Task(
    description="Fix bug",
    prompt="""
    Search for error 'UserNotFound' in logs and codebase.
    If found in multiple files:
    - Spawn sub-agent to analyze each occurrence
    - Determine root cause
    If found in single file:
    - Fix directly and explain the solution
    """
)
```

### 3. Research and Implementation
```python
# Research phase
Task(
    description="Research auth libraries",
    prompt="Compare OAuth implementations: NextAuth, Auth0, Supabase Auth. Consider our tech stack and requirements."
)

# After reviewing results, implementation phase
Task(
    description="Implement auth",
    prompt="Based on research, implement NextAuth with our existing Next.js setup..."
)
```

## Performance Optimization with Sub-Agents

### Token Conservation Strategy
Use sub-agents to handle token-intensive operations:

```python
# Instead of loading 50 files into main context:
Task(
    description="Analyze all components",
    prompt="""
    Read all components in src/components/.
    For each component:
    1. Count lines of code
    2. List external dependencies
    3. Identify potential performance issues
    Return only a summary table with key findings.
    """
)
```

### Parallel Performance Gains
Example of 7-parallel execution saving time:

```yaml
Sequential approach: ~35 minutes
├── Component creation: 5 min
├── Styling: 5 min
├── Testing: 10 min
├── Types: 3 min
├── Hooks: 5 min
├── Routing: 4 min
└── Config: 3 min

Parallel with Task tool: ~10 minutes
└── All tasks execute simultaneously
```

## Real-World Examples

### Example 1: Finding a Memory Leak
```python
Task(
    description="Find memory leak",
    prompt="""
    Our React app has a memory leak. Please:
    1. Search for common leak patterns (event listeners, intervals, refs)
    2. Check for components that don't cleanup in useEffect
    3. Look for circular references in state management
    4. Identify suspicious memory growth patterns
    Return specific files and line numbers with issues.
    """
)
```

### Example 2: Codebase Modernization
```python
Task(
    description="Modernize imports",
    prompt="""
    Update all old-style imports to modern ES6:
    1. Find all require() statements
    2. Convert to import statements
    3. Update module.exports to export statements
    4. Ensure all tests still pass
    5. List any files that need manual review
    """
)
```

### Example 3: Security Audit
```python
Task(
    description="Security scan",
    prompt="""
    Perform security analysis:
    1. Search for hardcoded credentials or API keys
    2. Find SQL query construction (potential injection)
    3. Check for unsafe user input handling
    4. Identify missing authentication checks
    5. Create prioritized list of vulnerabilities
    """
)
```

## Common Pitfalls and Solutions

### Pitfall 1: Vague Instructions
❌ Bad:
```python
Task(description="Fix bugs", prompt="Find and fix bugs in the code")
```

✅ Good:
```python
Task(
    description="Fix auth bugs", 
    prompt="""
    Fix authentication-related bugs:
    1. Search error logs for auth-related errors
    2. Find the source of 'token expired' errors users report
    3. Check token refresh logic in middleware/auth.ts
    4. Verify fix with existing auth tests
    """
)
```

### Pitfall 2: Over-Delegation
❌ Bad: Using Task tool for simple operations
```python
Task(description="Read file", prompt="Read package.json")
```

✅ Good: Use Read tool directly for simple operations

### Pitfall 3: Missing Context
❌ Bad: Not providing necessary background
```python
Task(description="Update API", prompt="Add new endpoint for users")
```

✅ Good: Include relevant context
```python
Task(
    description="Update API",
    prompt="""
    Add DELETE /api/users/:id endpoint:
    1. Follow pattern in routes/api/posts.ts
    2. Include soft-delete functionality
    3. Require admin role (see middleware/auth.ts)
    4. Add OpenAPI documentation
    """
)
```

## Integration with Project Workflow

### Combining Task Tool with Project Agents

1. **Research with Task Tool**:
```python
Task(
    description="Research patterns",
    prompt="Find all data fetching patterns used in this codebase"
)
```

2. **Implement with Manual Agent** (if needed):
```bash
# Based on research, use specialized agent
claude @src/prompts/agents/frontend-dev/init.md
```

3. **Validate with Task Tool**:
```python
Task(
    description="Validate implementation",
    prompt="Check if new data fetching follows discovered patterns"
)
```

### Creating Ad-Hoc Agents from Task Results

If a sub-agent discovers specialized knowledge worth preserving:

```bash
/agent-ify <role-name>
```

This captures the expertise for future use.

## Troubleshooting Task Tool Issues

### Sub-Agent Returns Incomplete Results
**Cause**: Task too broad or vague
**Solution**: Break into smaller, specific subtasks

### Sub-Agent Can't Find Files
**Cause**: Incorrect path assumptions
**Solution**: Specify starting directories explicitly

### Sub-Agent Times Out
**Cause**: Task too complex for single agent
**Solution**: Use chained sub-agents or break into phases

### Parallel Tasks Conflict
**Cause**: Tasks modifying same files
**Solution**: Sequence dependent tasks, parallelize only independent ones

## Measuring Sub-Agent Effectiveness

### Metrics to Track
1. **Time Saved**: Compare sequential vs parallel execution
2. **Token Efficiency**: Main context preserved vs information gathered
3. **Accuracy**: How often sub-agent results meet needs
4. **Complexity Handled**: Types of tasks successfully delegated

### When Sub-Agents Excel
- Large codebase exploration (100+ files)
- Multi-aspect analysis (security, performance, style)
- Research tasks requiring many searches
- Parallel implementation of independent features

### When to Avoid Sub-Agents
- Simple, direct tasks (< 3 steps)
- Tasks requiring real-time user interaction
- Operations needing persistent context
- Tasks with complex interdependencies

## Conclusion

Claude Code's native Task tool provides powerful sub-agent capabilities for efficient task delegation and parallel processing. By combining the Task tool with project-specific agent patterns, you can:

- Preserve context window for important work
- Execute multiple tasks in parallel
- Leverage specialized expertise without context switching
- Handle complex research and analysis efficiently

Remember: The key to effective sub-agent use is clear, detailed instructions and choosing the right tool for each situation. Use the Task tool for autonomous, well-defined tasks, and manual agents for persistent, collaborative work.

## Quick Reference

### Task Tool Syntax
```python
Task(
    description="<3-5 word summary>",
    prompt="<detailed autonomous instructions>"
)
```

### When to Use Task Tool
✅ Research and exploration
✅ Parallel independent tasks
✅ Large-scale analysis
✅ Context preservation needed

### When to Use Manual Agents
✅ Long-running projects
✅ Specialized expertise needed
✅ Collaborative work
✅ Persistent context required