# Create GitHub Issues from Implementation Plan

You are the APM Scrum Master executing the `/create-project-issues` command. This command converts the entire Implementation Plan into a complete GitHub issue hierarchy.

## Execution Steps

### 1. Locate and Parse Implementation Plan

First, identify the plan structure:
```bash
# Check for single file
if [ -f "Implementation_Plan.md" ]; then
    echo "Found single-file plan"
fi

# Check for multi-file structure
if [ -d ".apm/Implementation_Plan" ]; then
    echo "Found multi-file plan structure"
    ls .apm/Implementation_Plan/
fi
```

### 2. Extract Hierarchy

Parse the markdown to build a complete hierarchy tree:
- **Single file**: Map heading levels (## = Phase, ### = Project, #### = Epic)
- **Multi-file**: Parse overview for phases/projects, individual files for epics/tasks

Create a data structure tracking:
```
Phase "MVP Completion" 
  └─ Project "Research Document Generation"
      └─ Epic "Prompt Engineering System"
          ├─ Task "Design prompt templates"
          └─ Task "Create validation system"
```

### 3. Query Issue Type IDs

Get the organization's custom issue type IDs:
```bash
OWNER=$(gh repo view --json owner -q .owner.login)
REPO_ID=$(gh api graphql -f query='query { repository(owner: "'$OWNER'", name: "'$(gh repo view --json name -q .name)'") { id }}' -q .data.repository.id)

# Map each type
for TYPE in Phase Project Epic Task Feature Bug; do
    TYPE_ID=$(gh api graphql -H "GraphQL-Features: issue_types" -f query='
        query { organization(login: "'$OWNER'") { 
            issueTypes(first: 20) { nodes { id name }}
        }}' -q '.data.organization.issueTypes.nodes[] | select(.name=="'$TYPE'") | .id')
    echo "$TYPE: $TYPE_ID"
done
```

### 4. Create Issues (Top-Down)

Create issues starting from phases, preserving hierarchy:

```bash
# For each component in hierarchy
create_issue() {
    local TITLE="$1"
    local BODY="$2"
    local TYPE_ID="$3"
    
    ISSUE_NUM=$(gh api graphql -H "GraphQL-Features: issue_types" -f query='
        mutation {
            createIssue(input: {
                repositoryId: "'$REPO_ID'"
                title: "'"$TITLE"'"
                body: "'"$BODY"'"
                issueTypeId: "'$TYPE_ID'"
            }) {
                issue { number }
            }
        }' -q .data.createIssue.issue.number)
    
    echo "Created #$ISSUE_NUM: $TITLE"
    echo $ISSUE_NUM
}

# Example: Create phase, then its children
PHASE_NUM=$(create_issue "MVP Completion" "Phase 1 goals..." "$PHASE_TYPE_ID")
PROJECT_NUM=$(create_issue "Research Document Generation" "Project details..." "$PROJECT_TYPE_ID")

# Link them
./scripts/create-sub-issue.sh $PHASE_NUM $PROJECT_NUM
```

### 5. Create/Update GitHub Project

```bash
# Find or create project
REPO_NAME=$(gh repo view --json name -q .name)
PROJECT_NUM=$(gh project list --org $OWNER --format json | jq -r '.projects[] | select(.title=="'$REPO_NAME'") | .number')

if [ -z "$PROJECT_NUM" ]; then
    PROJECT_NUM=$(gh project create --org $OWNER --title "$REPO_NAME" --format json | jq -r .number)
    echo "Created project #$PROJECT_NUM"
fi

# Add all created issues
ISSUE_NUMS=$(gh issue list --limit 1000 --json number -q '.[].number' | tr '\n' ' ')
./scripts/add-issues-to-project.sh $OWNER $PROJECT_NUM $ISSUE_NUMS
```

### 6. Update Implementation Plan

For each created issue, update the corresponding heading:

```bash
# Example sed command to update markdown
# Before: ### Epic 1. Create Prompt System
# After:  ### Epic 1. [#37] Create Prompt System

sed -i '' 's/^### Epic 1\. Create/### Epic 1. [#37] Create/' Implementation_Plan.md
```

## Output Format

Provide a summary after completion:

```
✅ Created GitHub Issues from Implementation Plan

Phase Issues:        2
Project Issues:      5  
Epic Issues:        18
Task Issues:        67
Total Created:      92

✅ Linked all issues in hierarchy
✅ Added to project: prospect-profiler (#3)
✅ Updated Implementation Plan with issue references

View project board: https://github.com/orgs/YOUR_ORG/projects/3
```

## Error Handling

- Check for existing issues with same title before creating
- Verify parent exists before creating sub-issue
- Handle GraphQL API errors gracefully
- Report any issues that couldn't be created

## Important Notes

1. Create ALL hierarchy levels, not just leaf tasks
2. Preserve exact titles from Implementation Plan
3. Include full context in issue bodies
4. Maintain parent-child relationships via sub-issues
5. Update plan files after creation for traceability

Execute this systematically to ensure complete coverage of the Implementation Plan.