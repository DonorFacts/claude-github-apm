# Bulk Issue Creator for Claude GitHub APM

This tool creates GitHub issues in bulk from an Implementation Plan YAML file, optimizing API calls and maintaining proper issue hierarchies.

## Features

- **Batch Creation**: Creates multiple issues in single API calls (up to 20 per batch)
- **Hierarchy Preservation**: Automatically links parent-child relationships
- **Duplicate Prevention**: Checks for existing issues before creation
- **Progress Tracking**: Real-time progress updates and error reporting
- **Plan Updates**: Updates YAML file with created issue numbers
- **TypeScript**: Fully typed for reliability and maintainability

## Installation

```bash
cd src/tools/bulk-issue-creator
npm install
npm run build
```

## Usage

### 1. Prepare Your Implementation Plan

Create or update your `implementation-plan.yaml` file following the schema defined in `implementation-plan-schema.yaml`.

### 2. Configure GitHub CLI

Ensure you're authenticated with GitHub CLI:

```bash
gh auth login
```

### 3. Run the Bulk Creator

```bash
# From the bulk-issue-creator directory
npm run create-issues

# Or specify a custom plan file
npm run create-issues -- /path/to/your-plan.yaml
```

## How It Works

### API Optimization

The tool minimizes GitHub API calls through several strategies:

1. **Batched Creation**: Uses GraphQL aliases to create up to 20 issues per API call
2. **Level-by-Level Processing**: Creates parent issues before children to ensure proper linking
3. **Duplicate Detection**: Checks for existing issues to avoid recreation
4. **Relationship Batching**: Groups parent-child relationships for efficient linking

### Execution Flow

1. **Load & Validate**: Reads YAML plan and validates structure
2. **Create Issues**: Creates issues level by level using batched API calls
3. **Link Relationships**: Establishes parent-child relationships
4. **Update Plan**: Saves issue numbers back to YAML file
5. **Report Results**: Provides detailed summary of creation results

### Error Handling

- **Graceful Fallback**: If batch creation fails, falls back to individual creation
- **Partial Success**: Continues processing even if some issues fail
- **Detailed Logging**: Reports all errors with context for debugging

## YAML Plan Structure

```yaml
version: "1.0"
project:
  name: "Your Project"
  repository:
    owner: "YourOrg"
    name: "your-repo"

issue_types:
  phase: "IT_xxx" # Your org's issue type IDs
  epic: "IT_yyy"
  task: "IT_zzz"

items:
  - id: "phase-1"
    type: "phase"
    title: "Phase Title"
    description: "Full markdown description"
    parent_id: null
    children_ids: ["epic-1-1"]

  - id: "epic-1-1"
    type: "epic"
    title: "Epic Title"
    description: "Epic description"
    parent_id: "phase-1"
    metadata:
      agent: "Agent_Name"
      priority: "high"

execution:
  create_order:
    - level: 1
      items: ["phase-1"]
    - level: 2
      items: ["epic-1-1"]
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Test with a sample plan
npm run dev -- test-plan.yaml
```

### Type Checking

```bash
npx tsc --noEmit
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `gh auth login` to authenticate
2. **Repository Not Found**: Ensure you're in the correct repository
3. **Issue Type Not Found**: Verify issue type IDs match your organization
4. **Rate Limiting**: Reduce batch size if hitting API limits

### Debug Mode

Set environment variable for verbose output:

```bash
DEBUG=* npm run create-issues
```
