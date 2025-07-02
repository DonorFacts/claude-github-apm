#!/bin/bash

# Simple script to add all open issues to DonorFacts project #1
PROJECT_ID="PVT_kwDODIcSxM4A7leT"

echo "Adding issues to project: Journal AI CLI (ID: $PROJECT_ID)"

# Get all open issues
ISSUES=$(gh issue list --state open --json number --jq '.[].number')

for issue_num in $ISSUES; do
  echo "Processing issue #$issue_num..."
  
  # Get issue ID
  ISSUE_ID=$(gh api graphql -f query='
    query {
      repository(owner: "DonorFacts", name: "journal-ai-cli") {
        issue(number: '$issue_num') {
          id
        }
      }
    }' --jq '.data.repository.issue.id')
  
  echo "Issue ID: $ISSUE_ID"
  
  # Add to project
  RESULT=$(gh api graphql -f query='
    mutation {
      addProjectV2ItemById(input: {
        projectId: "'$PROJECT_ID'",
        contentId: "'$ISSUE_ID'"
      }) {
        item {
          id
        }
      }
    }' 2>&1)
  
  if echo "$RESULT" | grep -q "error"; then
    echo "✗ Failed to add issue #$issue_num"
    echo "$RESULT"
  else
    echo "✓ Added issue #$issue_num to project"
  fi
done

echo "Done!"