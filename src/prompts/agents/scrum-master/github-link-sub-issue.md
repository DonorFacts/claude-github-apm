# GitHub Sub-Issues - Quick Reference

## Easiest Method: Use npm script

```bash
npm run link-sub-issue <parent_issue_number> <child_issue_number>
```

**Example:** `npm run link-sub-issue 26 30`

The script handles everything automatically: validation, ID conversion, linking, and verification.

---

## Manual Method (if script unavailable)

### Key Insight

⚠️ **CRITICAL**: Sub-issue API requires **issue ID** (internal database ID), NOT the issue number shown in UI.

## Essential Commands

### 1. Get Issue ID from Issue Number

```bash
ISSUE_ID=$(gh api /repos/OWNER/REPO/issues/ISSUE_NUMBER | jq '.id')
```

### 2. Create Sub-Issue Relationship

```bash
gh api --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/OWNER/REPO/issues/PARENT_ISSUE_NUMBER/sub_issues \
  --input - <<< "{\"sub_issue_id\": $ISSUE_ID}"
```

### 3. Verify Success

```bash
gh api /repos/OWNER/REPO/issues/PARENT_NUMBER | jq '.sub_issues_summary'
```

## Complete Working Example

**⚠️ CRITICAL**: All commands must run in a SINGLE bash session to preserve variables.

```bash
# Single command chain - variables persist
CHILD_RESPONSE=$(gh api --method POST /repos/DonorFacts/prospect-profiler/issues \
  -f title='Sub-task: Add tests' \
  -f body='This is a sub-task') && \
CHILD_ID=$(echo "$CHILD_RESPONSE" | jq '.id') && \
gh api --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/DonorFacts/prospect-profiler/issues/26/sub_issues \
  --input - <<< "{\"sub_issue_id\": $CHILD_ID}" && \
gh api /repos/DonorFacts/prospect-profiler/issues/26 | jq '.sub_issues_summary'
```

**Alternative - Direct ID Method:**

```bash
# Get child issue ID directly in linking command
CHILD_ID=$(gh api --method POST /repos/DonorFacts/prospect-profiler/issues \
  -f title='Sub-task: Add tests' -f body='This is a sub-task' | jq '.id') && \
gh api --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/DonorFacts/prospect-profiler/issues/26/sub_issues \
  --input - <<< "{\"sub_issue_id\": $CHILD_ID}"
```

**Success**: Parent issue shows `"total": 1` in sub_issues_summary.
