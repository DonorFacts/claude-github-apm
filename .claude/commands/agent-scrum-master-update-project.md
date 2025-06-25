# Update Project Plan and Issues

Update the Implementation Plan and synchronize changes with GitHub issues. This command handles additions, removals, and modifications while maintaining issue hierarchy.

## Command Usage

User must provide specific update instructions:
```
/update-project
- Remove Epic 2.3 "Legacy System Migration" 
- Add new Task under Epic 1.2: "Add error boundary component"
- Modify Task 3.1.4: Change title to "Implement caching with Redis"
```

## Execution Process

### 1. Parse Update Request

Categorize each requested change:
- **ADD**: New items to create (specify parent and type)
- **REMOVE**: Items to delete (and their children)
- **MODIFY**: Items to update (title, description, or scope)

### 2. Validate Changes

Before making any changes:
```bash
# Check if items exist
# For removals - verify issue numbers exist
# For additions - verify parent exists
# For modifications - verify target exists
```

Show validation summary:
```
Validation Results:
✓ Remove Epic 2.3 [#45] - Found with 3 child tasks
✓ Add Task to Epic 1.2 [#23] - Parent exists
✓ Modify Task 3.1.4 [#67] - Found and editable
```

### 3. Update Implementation Plan

#### For Single-File Plans
```bash
# Backup current plan
cp .apm/Implementation_Plan.md .apm/Implementation_Plan.backup.md

# Apply changes using sed/awk
# Remove: Delete entire sections
# Add: Insert at correct hierarchy level
# Modify: Update in place
```

#### For Multi-File Plans
```bash
# Identify affected files
# For Phase/Epic changes: Update specific phase files
# For cross-phase changes: Update multiple files
# Update overview if structure changes
```

### 4. Synchronize GitHub Issues

#### Removing Items
```bash
# Close issue and all children
close_issue_tree() {
    local ISSUE_NUM=$1
    local REASON=$2
    
    # Get child issues first
    CHILDREN=$(gh issue view $ISSUE_NUM --json projectItems -q '.projectItems[].content.number')
    
    # Close children recursively
    for CHILD in $CHILDREN; do
        close_issue_tree $CHILD "Parent removed"
    done
    
    # Close this issue
    gh issue close $ISSUE_NUM -c "Closed: $REASON"
}
```

#### Adding Items
```bash
# Create new issue with proper type and hierarchy
create_issue_with_type() {
    local TITLE="$1"
    local BODY="$2"
    local TYPE="$3"
    local PARENT_NUM="$4"
    
    # Get type ID
    TYPE_ID=$(get_issue_type_id "$TYPE")
    
    # Create issue
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
    
    # Link to parent if provided
    if [ -n "$PARENT_NUM" ]; then
        ./scripts/create-sub-issue.sh $PARENT_NUM $ISSUE_NUM
    fi
    
    echo $ISSUE_NUM
}
```

#### Modifying Items
```bash
# Update existing issue
update_issue() {
    local ISSUE_NUM=$1
    local NEW_TITLE="$2"
    local NEW_BODY="$3"
    
    # Update title if changed
    if [ -n "$NEW_TITLE" ]; then
        gh issue edit $ISSUE_NUM --title "$NEW_TITLE"
    fi
    
    # Update body if changed
    if [ -n "$NEW_BODY" ]; then
        gh issue edit $ISSUE_NUM --body "$NEW_BODY"
    fi
}
```

### 5. Update Plan with Issue Numbers

After creating new issues, update the plan with issue references:
```bash
# Add issue numbers to new items
# Before: ### Task: Add error boundary component
# After:  ### Task: [#89] Add error boundary component
```

### 6. Generate Change Report

Provide comprehensive summary:
```markdown
## Project Update Summary

### Removed (3 items)
- Epic 2.3 [#45] "Legacy System Migration" - Closed with reason: "Descoped from MVP"
  - Task 2.3.1 [#46] - Closed (child of removed epic)
  - Task 2.3.2 [#47] - Closed (child of removed epic)

### Added (1 item)  
- Task [#89] "Add error boundary component" under Epic 1.2 [#23]

### Modified (1 item)
- Task 3.1.4 [#67] title changed from "Add caching" to "Implement caching with Redis"

### Plan Updates
- Updated .apm/Implementation_Plan/02_Phase_2_Core_Features.md
- Updated .apm/Implementation_Plan/03_Phase_3_Integration.md
- Backup saved to .apm/Implementation_Plan.backup.md

View updated project: https://github.com/orgs/YOUR_ORG/projects/3
```

## Edge Cases to Handle

### 1. Removing Parent with Children
- Warn user about child items
- Confirm cascading deletion
- Close all children with appropriate reason

### 2. Moving Items Between Parents
- Treat as remove + add
- Preserve issue history with comment
- Update sub-issue relationships

### 3. Structural Changes
- Changing item types (Epic → Project)
- Moving between phases
- Splitting or merging items

## Validation Questions

Before executing changes, ask if unclear:
- "Epic 2.3 has 3 child tasks. Remove all of them?"
- "What type should the new 'error boundary' item be? (Task/Feature/Bug)"
- "Under which parent should I add the new task?"

## Error Recovery

If any step fails:
1. Stop execution immediately
2. Report what succeeded/failed
3. Provide rollback instructions
4. Keep backup files intact

## Best Practices

1. **Always Validate First**: Show plan before executing
2. **Maintain Hierarchy**: Preserve parent-child relationships
3. **Clear Communication**: Explain each change clearly
4. **Atomic Updates**: Complete all related changes together
5. **Audit Trail**: Document why items were removed/modified

Execute changes systematically to maintain consistency between Implementation Plan and GitHub issues.