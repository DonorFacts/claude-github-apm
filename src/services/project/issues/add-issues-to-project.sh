#!/bin/bash

# Add multiple issues to a GitHub Project
# Usage: ./add-issues-to-project.sh ORG_NAME PROJECT_NUMBER ISSUE_URL1 ISSUE_URL2 ...
#    or: ./add-issues-to-project.sh ORG_NAME PROJECT_NUMBER ISSUE_NUM1 ISSUE_NUM2 ...

ORG_NAME=$1
PROJECT_NUMBER=$2
shift 2  # Remove first two arguments, leaving only issue URLs/numbers

# Get current repository for issue numbers
CURRENT_REPO=""
if git remote -v > /dev/null 2>&1; then
  CURRENT_REPO=$(git remote get-url origin 2>/dev/null | sed -E 's|.*github.com[:/]([^/]+/[^/]+)(\.git)?|\1|')
fi

# First, get the project ID
PROJECT_ID=$(gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        id
      }
    }
  }' -f org="$ORG_NAME" -f number=$PROJECT_NUMBER --jq '.data.organization.projectV2.id')

echo "Project ID: $PROJECT_ID"

# Function to add a single issue to the project
add_issue_to_project() {
  local issue_ref=$1
  local repo_path=""
  local issue_number=""
  
  # Check if it's a URL or just a number
  if [[ "$issue_ref" =~ ^[0-9]+$ ]]; then
    # It's just a number, use current repo
    if [ -z "$CURRENT_REPO" ]; then
      echo "❌ Error: Cannot determine current repository for issue #$issue_ref"
      return 1
    fi
    repo_path="$CURRENT_REPO"
    issue_number="$issue_ref"
  elif [[ "$issue_ref" =~ https://github.com/ ]]; then
    # It's a URL, extract repo and issue number
    repo_path=$(echo "$issue_ref" | sed -E 's|https://github.com/([^/]+/[^/]+)/issues/[0-9]+|\1|')
    issue_number=$(echo "$issue_ref" | sed -E 's|.*/issues/([0-9]+)|\1|')
  else
    echo "❌ Error: Invalid issue reference: $issue_ref"
    return 1
  fi
  
  echo "Adding issue #$issue_number from $repo_path to project..."
  
  # Get the issue node ID
  ISSUE_ID=$(gh api graphql -f query='
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) {
          id
        }
      }
    }' -f owner="$(echo $repo_path | cut -d/ -f1)" \
       -f name="$(echo $repo_path | cut -d/ -f2)" \
       -f number=$issue_number \
       --jq '.data.repository.issue.id')
  
  if [ -z "$ISSUE_ID" ] || [ "$ISSUE_ID" = "null" ]; then
    echo "❌ Error: Could not find issue #$issue_number in $repo_path"
    return 1
  fi
  
  # Add the issue to the project
  RESULT=$(gh api graphql -f query='
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }' -f projectId="$PROJECT_ID" -f contentId="$ISSUE_ID" 2>&1)
  
  if echo "$RESULT" | grep -q "error"; then
    echo "❌ Failed to add issue #$issue_number"
  else
    echo "✓ Added issue #$issue_number to project"
  fi
}

# Show current repo if using issue numbers
if [ -n "$CURRENT_REPO" ]; then
  echo "Current repository: $CURRENT_REPO"
fi

# Loop through all provided issue references
for issue_ref in "$@"; do
  add_issue_to_project "$issue_ref"
done

echo "Done! Added $(($# )) issues to project #$PROJECT_NUMBER"