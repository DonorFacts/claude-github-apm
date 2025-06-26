# Create GitHub Pull Request

Create comprehensive PRs by analyzing commit history and changes.

## Usage

Execute the complete PR creation workflow:

```bash
# Automatic workflow (detects issues, handles existing PRs)
./src/scripts/git/pr-create.sh

# With custom title
./src/scripts/git/pr-create.sh "feat: implement comprehensive feature set"
```

## What the Script Does

The script performs these steps automatically:

### 1. GitHub Issue Management
- Extracts issue number from branch name (`feature-123-description` format)
- If no issue number found, creates meaningful issue from commit analysis
- Uses first commit for title and detailed analysis for body

### 2. Existing PR Detection
- Checks for open PRs and updates body with latest changes
- Finds closed PRs and reopens if appropriate (not merged)
- Avoids duplicate PR creation

### 3. New PR Creation
- Pushes branch to origin if needed
- Creates PR with comprehensive body linking to GitHub issue
- Auto-assigns to current user

## Full Workflow

### 1. Push Branch

```bash
# Ensure branch is pushed with tracking
git push -u origin $(git branch --show-current)
```

### 2. Analyze Commits

```bash
# Count commits since main
COMMIT_COUNT=$(git log --format="%H" main..HEAD | wc -l)

# Get all commit messages with full details
git log --reverse --format="=== COMMIT %h ===%n%B%n" main..HEAD > /tmp/commits.txt
```

### 3. Generate File Tree

```bash
# Create file tree of changes
echo "## Files Changed" > /tmp/file-tree.txt
echo '```' >> /tmp/file-tree.txt

# Added files
git diff --name-status main..HEAD | grep "^A" | cut -f2 | sed 's/^/+ /' >> /tmp/file-tree.txt

# Modified files  
git diff --name-status main..HEAD | grep "^M" | cut -f2 | sed 's/^/~ /' >> /tmp/file-tree.txt

# Deleted files
git diff --name-status main..HEAD | grep "^D" | cut -f2 | sed 's/^/- /' >> /tmp/file-tree.txt

# Renamed files
git diff --name-status main..HEAD | grep "^R" | cut -f2,3 | sed 's/^/→ /' >> /tmp/file-tree.txt

echo '```' >> /tmp/file-tree.txt
```

### 4. Create PR Body Template

```markdown
## Summary

[Analyze commits to write 2-3 sentence overview of the entire PR's purpose]

## Changes by Category

### Category 1: [Main Feature/Fix]
[Extract from commit messages - use bullet points from commits]

### Category 2: [Secondary Changes]  
[Group related changes together]

## Key Metrics
[Extract any performance improvements, token reductions, etc. from commits]

## Files Changed
[Insert file tree here]

## Detailed Commit Analysis

[For each commit, extract key points:]
- **Commit hash**: Summary
  - Key change 1
  - Key change 2
  - Impact/metrics if mentioned

## Test Plan

Based on changes:
- [ ] [Test derived from commit changes]
- [ ] [Test for each major feature]
- [ ] [Integration tests if applicable]

## Impact

[Summarize how these changes improve the system]

## Related Issues

[Extract from commit messages: Issues: #XXX]
```

### 5. Script Output

The script `src/scripts/git/generate-pr-body.sh` automatically:
- Analyzes all commits since main branch
- Groups changes by type (feat, fix, docs, etc.)
- Extracts key improvements and metrics
- Generates a file tree with counts
- Creates detailed commit breakdown
- Extracts related issues
- Generates test plan based on actual changes
- Shows impact by directory

## Creating the PR

### Complete Safe PR Creation Script

```bash
#!/bin/bash
# Safe PR creation that handles existing PRs

BRANCH=$(git branch --show-current)
TITLE="$1"  # Pass title as first argument

# Check for existing open PR
EXISTING_PR=$(gh pr list --head "$BRANCH" --state open --json number,url --jq '.[0]')

if [[ -n "$EXISTING_PR" ]]; then
    PR_NUM=$(echo "$EXISTING_PR" | jq -r '.number')
    PR_URL=$(echo "$EXISTING_PR" | jq -r '.url')
    echo "✅ Open PR already exists: #$PR_NUM - $PR_URL"
    echo "Updating PR body..."
    gh pr edit "$PR_NUM" --body "$(./src/scripts/git/generate-pr-body.sh)"
    echo "PR updated successfully!"
    exit 0
fi

# Check for closed PR
CLOSED_PR=$(gh pr list --head "$BRANCH" --state closed --json number,mergedAt --jq '.[0]')

if [[ -n "$CLOSED_PR" ]] && [[ "$(echo "$CLOSED_PR" | jq -r '.mergedAt')" == "null" ]]; then
    PR_NUM=$(echo "$CLOSED_PR" | jq -r '.number')
    echo "🔄 Reopening closed PR #$PR_NUM"
    gh pr reopen "$PR_NUM"
    gh pr edit "$PR_NUM" --body "$(./src/scripts/git/generate-pr-body.sh)"
    echo "PR reopened and updated!"
    exit 0
fi

# Create new PR
echo "📝 Creating new PR..."
gh pr create \
  --title "$TITLE" \
  --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")" \
  --assignee @me
```

### Manual Methods

```bash
# Method 1: Interactive (opens editor) - for new PRs only
gh pr create

# Method 2: Direct with generated body - for new PRs only
gh pr create \
  --title "feat: implement comprehensive feature set" \
  --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")"

# Method 3: Update existing PR
gh pr edit <PR_NUMBER> \
  --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")"
```

## Best Practices

1. **Analyze all commits** - Don't just use the latest
2. **Group by theme** - Categories make review easier  
3. **Extract metrics** - Highlight improvements
4. **Include file tree** - Visual overview of changes
5. **Derive test plan** - From actual changes made
6. **Link issues** - Extract from commit messages

## Example Analysis Process

```bash
# 1. Review commit messages for themes
git log --oneline main..HEAD

# 2. Extract detailed changes
git log --format="%B" main..HEAD | grep "^- "

# 3. Find metrics/improvements
git log --format="%B" main..HEAD | grep -E "[0-9]+%|reduction|improve|optimize"

# 4. Identify test needs
git diff --name-only main..HEAD | grep -E "\.test\.|spec\." 
```

## PR Title Format

```
<type>: <what changed>

Types: feat|fix|docs|refactor|test|chore
```

Remember: The PR body should tell the complete story of the changes, making review efficient and context clear.