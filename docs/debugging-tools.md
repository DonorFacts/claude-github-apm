# Development Tool Organization

This guide provides comprehensive patterns for organizing debugging and development tools within the Claude GitHub APM framework.

## Core Philosophy

**Production code for the framework, `.dev.ext` for the developers working on it.**

Development tools should be clearly distinguished from runtime framework code to maintain clarity, reduce cognitive load, and prevent accidental inclusion in production workflows.

## The `.dev.ext` Convention

### When to Use `.dev.ext`

Use the `.dev.ext` naming pattern when creating tools that are:

- **Debugging utilities** - Tools for investigating issues or system state
- **Development workflow helpers** - Scripts that aid in development but aren't part of the core framework
- **Enhanced versions** - Feature-rich alternatives to simpler production tools
- **Diagnostic tools** - Health checks, status monitoring, detailed logging

### Examples in This Codebase

```
src/scripts/docker/apm-container.dev.ts  # Advanced container management
├── npm run container:status    # Detailed health monitoring  
├── npm run container:logs      # Log viewing and analysis
├── npm run container:start     # Manual lifecycle management
└── npm run container:bash      # Interactive debugging shell

vs.

.local/bin/claude-container  # Simple production wrapper
└── pnpm claude             # Just runs Claude in container (fast, minimal)
```

### Benefits of Co-location

Placing `.dev.ext` files alongside their production counterparts provides:

- **Immediate discoverability** - Developers find debugging tools next to related code
- **Contextual relationship** - Clear association between production and debugging versions
- **Reduced cognitive overhead** - No need to remember separate tool directories
- **Version control benefits** - Tools evolve alongside the code they debug

## Alternative Patterns & When to Use Them

| Pattern | Use Case | Example | Rationale |
|---------|----------|---------|-----------|
| `.dev.ext` | Enhanced debugging version of existing tool | `tool.dev.ts` vs `tool.ts` | Co-location with production code |
| `.test.ext` | Testing and test utilities | `component.test.ts` | Jest ecosystem standard |
| `.config.ext` | Configuration files | `webpack.config.js` | Build tool conventions |
| `tools/` directory | Standalone development utilities | `tools/migrate.ts` | Self-contained tools |
| `scripts/` directory | Build, deployment, automation | `scripts/build.sh` | npm scripts convention |
| `__dev__/` directory | Collections of dev-only files | `__dev__/fixtures/` | React ecosystem pattern |
| `debug/` directory | Debugging-specific collections | `debug/performance/` | When many related debug tools |

## Decision Framework

### Use `.dev.ext` when:

- ✅ **Tool enhances or debugs an existing production component**
  - Example: `container.dev.ts` enhances basic `container.sh`
- ✅ **You want co-location with related production code**
  - Keeps debugging tools discoverable next to what they debug
- ✅ **Tool provides debugging/diagnostic capabilities**
  - Health checks, detailed status, advanced logging
- ✅ **It's a developer-facing utility, not end-user functionality**
  - Internal tooling for framework development

### Use alternative patterns when:

- ❌ **Testing**: Use `.test.ext` or `__tests__/`
  - Testing follows established Jest conventions
- ❌ **Configuration**: Use `.config.ext`
  - Build tools expect specific naming patterns
- ❌ **Standalone tools**: Use `tools/` or `scripts/` directories
  - Self-contained utilities that don't debug specific components
- ❌ **Build processes**: Use `scripts/` directory
  - npm ecosystem expects build scripts in `scripts/`

## Implementation Guidelines

### File Organization

```
src/
├── components/
│   ├── auth.ts              # Production authentication
│   ├── auth.dev.ts          # Auth debugging utilities
│   ├── auth.test.ts         # Auth tests
│   └── auth.config.ts       # Auth configuration
├── scripts/
│   ├── build.sh             # Build automation
│   └── deploy.sh            # Deployment automation
└── tools/
    ├── migrate.ts           # Standalone migration utility
    └── benchmark.ts         # Performance benchmarking
```

### Header Documentation Pattern

All `.dev.ext` files should include comprehensive headers:

```typescript
#!/usr/bin/env tsx

/**
 * [Component Name] Development Tool
 * 
 * This tool provides advanced [debugging/management/diagnostic] capabilities
 * beyond the simple [production component description].
 * 
 * USAGE:
 *   npm run [script-name]        # Primary usage method
 *   npm run [script:subcommand]  # Specific operations
 *   
 * DEBUGGING:
 *   tsx path/to/tool.dev.ts command  # Direct tool usage
 *   tsx path/to/tool.dev.ts --help   # Show all options
 * 
 * Note: For normal [workflow], use [production tool] which [description].
 * This tool is for when you need [advanced capabilities].
 */
```

### Package.json Integration

Integrate development tools using descriptive script grouping:

```json
{
  "scripts": {
    "//": "=== PRODUCTION ===",
    "start": "./production-tool",
    "build": "npm run build:prod",
    
    "//dev": "=== DEVELOPMENT TOOLS ===",
    "dev:status": "tsx src/tool.dev.ts status",
    "dev:debug": "tsx src/tool.dev.ts debug --verbose",
    "dev:health": "tsx src/tool.dev.ts health-check"
  }
}
```

## Agent Guidelines

When creating development tools, AI agents should follow this process:

### 1. Assess Tool Purpose

Ask these questions:
- **What problem does this tool solve?**
- **Is it debugging, testing, configuration, or standalone utility?**
- **Does it enhance an existing production component?**
- **Who is the target user: framework developers or end users?**

### 2. Check Existing Patterns

Before creating a new tool:
- **Scan the target directory for existing patterns**
- **Look for similar tools and their naming conventions**
- **Check package.json scripts for related tooling**
- **Review existing documentation for established practices**

### 3. Choose Appropriate Pattern

Based on assessment:

```
If (enhances existing component AND for developers):
    Use `.dev.ext` pattern
    
Else if (testing related):
    Use `.test.ext` or `__tests__/`
    
Else if (configuration):
    Use `.config.ext`
    
Else if (standalone utility):
    Use `tools/` directory
    
Else if (build/deployment):
    Use `scripts/` directory
```

### 4. Implement with Documentation

- **Add comprehensive header comments**
- **Include usage examples for common scenarios**
- **Document relationship to production components**
- **Integrate with package.json scripts if appropriate**

### 5. Verify Discoverability

Ensure developers can easily:
- **Find the tool when they need it**
- **Understand its purpose and capabilities**
- **Know when to use it vs alternatives**
- **Access it through familiar interfaces (npm scripts)**

## Common Anti-Patterns

### ❌ Wrong: Scattering debug tools

```
src/utils/debug-auth.ts
scripts/container-debug.js
tools/test-helpers.ts
misc/troubleshoot.sh
```

### ✅ Right: Consistent patterns

```
src/auth/auth.dev.ts           # Debug auth component
src/container/container.dev.ts  # Debug container system
src/utils/utils.test.ts         # Test utilities
scripts/build.sh               # Build automation
```

### ❌ Wrong: Unclear naming

```
auth-helper.ts        # Helper for what? Testing? Debugging? Production?
container-tools.js    # What kind of tools?
debug-stuff.ts        # Too vague
```

### ✅ Right: Clear purpose

```
auth.dev.ts           # Clearly debugging version of auth
auth.test.ts          # Clearly testing utilities
auth.config.ts        # Clearly configuration
```

## Integration Examples

### Container Management System

This codebase demonstrates the pattern with container management:

**Production tool** (`.local/bin/claude-container`):
- Simple bash script
- Fast execution
- Minimal features
- Used by `pnpm claude`

**Development tool** (`apm-container.dev.ts`):
- TypeScript with full error handling
- Health monitoring
- Detailed status reporting
- Log viewing capabilities
- Manual lifecycle management
- Used by `npm run container:*`

### Package Script Organization

```json
{
  "scripts": {
    "//": "=== DAILY DEVELOPMENT ===",
    "claude": "./.local/bin/claude-container",
    "start": "./src/scripts/watch-all.sh",
    
    "//container": "=== CONTAINER DEBUGGING ===",
    "container:status": "tsx src/scripts/docker/apm-container.dev.ts status",
    "container:logs": "tsx src/scripts/docker/apm-container.dev.ts logs",
    "container:start": "tsx src/scripts/docker/apm-container.dev.ts start",
    "container:stop": "tsx src/scripts/docker/apm-container.dev.ts stop",
    "container:bash": "tsx src/scripts/docker/apm-container.dev.ts shell"
  }
}
```

This creates clear separation:
- **Daily workflow**: Simple, fast tools
- **Debugging workflow**: Feature-rich, detailed tools

## Ecosystem Alignment

The `.dev.ext` convention aligns with established software engineering patterns:

### JavaScript/TypeScript Ecosystem

- **`.test.ts`** - Jest testing convention
- **`.spec.ts`** - Alternative testing convention  
- **`.config.js`** - Configuration files (webpack, babel, etc.)
- **`.d.ts`** - TypeScript declaration files

### Python Ecosystem

- **`test_*.py`** - pytest convention
- **`conftest.py`** - pytest configuration
- **`__init__.py`** - Package initialization

### General Software Development

- **`Makefile.dev`** - Development-specific build rules
- **`docker-compose.dev.yml`** - Development container configuration
- **`*.debug`** - Debug versions of binaries

### Our Addition

- **`.dev.ext`** - Development and debugging tools

## Future Extensions

The pattern can be extended as the framework grows:

### Potential Extensions

- **`.perf.ext`** - Performance testing and benchmarking tools
- **`.mock.ext`** - Mock implementations for testing
- **`.demo.ext`** - Demo and example implementations

### Organizational Growth

As the project scales:

```
src/
├── auth/
│   ├── auth.ts              # Production
│   ├── auth.dev.ts          # Debugging
│   ├── auth.test.ts         # Testing
│   └── auth.perf.ts         # Performance testing
├── container/
│   ├── container.sh         # Production (simple)
│   ├── container.dev.ts     # Debugging (advanced)
│   └── container.mock.ts    # Mock for testing
```

## Conclusion

The `.dev.ext` convention provides:

- **Clear mental model** - Production vs development tooling
- **Consistent discoverability** - Tools located next to what they debug
- **Ecosystem alignment** - Follows established naming patterns
- **Scalable organization** - Works for projects of any size
- **Reduced cognitive load** - Developers know where to find and place tools

By following these guidelines, agents and developers can create well-organized, discoverable development tools that enhance productivity without cluttering production code.