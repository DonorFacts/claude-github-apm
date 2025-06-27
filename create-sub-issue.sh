#!/bin/bash

# Create sub-issue relationship between two issues
# Usage: ./create-sub-issue.sh <child_node_id> <parent_node_id>

CHILD_ID=$1
PARENT_ID=$2

if [ -z "$CHILD_ID" ] || [ -z "$PARENT_ID" ]; then
    echo "Usage: $0 <child_node_id> <parent_node_id>"
    exit 1
fi

# Use GitHub GraphQL API to create sub-issue relationship
gh api graphql -H "GraphQL-Features: sub_issues" -f query="
mutation {
  addSubIssue(input: {
    issueId: \"$PARENT_ID\"
    subIssueId: \"$CHILD_ID\"
  }) {
    issue {
      id
      title
    }
    subIssue {
      id
      title
    }
  }
}"