# Claude Code Scripts

## add-issues-simple.sh

**Purpose**: Bulk-add all open issues from the Journal AI CLI repository to the project board.

**Usage:**
```bash
./.claude/scripts/add-issues-simple.sh
```

**Example:**
```bash
# No parameters needed - just run it
./.claude/scripts/add-issues-simple.sh
```

**What it does:**
1. Automatically finds all open issues in the current repository
2. Adds each issue to the hardcoded project (Journal AI CLI - ID: PVT_kwDODIcSxM4A7leT)
3. Reports success/failure for each issue
4. Handles already-added issues gracefully

**Requirements:**
- `gh` CLI authenticated and available
- Must be run from the journal-ai-cli repository
- Permissions to add items to the project

**When to use:**
- Quick bulk-add of all open issues
- Working specifically with the Journal AI CLI project
- Don't need to cherry-pick specific issues

---

## add-issues-to-project.sh

**Purpose**: Generic script to add specific issues to any GitHub project.

**Usage:**
```bash
# With full URLs
./.claude/scripts/add-issues-to-project.sh <ORG_NAME> <PROJECT_NUMBER> <ISSUE_URL1> [ISSUE_URL2] ...

# With issue numbers (uses current repo)
./.claude/scripts/add-issues-to-project.sh <ORG_NAME> <PROJECT_NUMBER> <ISSUE_NUM1> [ISSUE_NUM2] ...
```

**Examples:**
```bash
# Add issues using just numbers from current repo
./.claude/scripts/add-issues-to-project.sh DonorFacts 1 42 43 44

# Add a single issue using full URL
./.claude/scripts/add-issues-to-project.sh DonorFacts 1 https://github.com/DonorFacts/journal-ai-cli/issues/42

# Mix issue numbers (current repo) and URLs (other repos)
./.claude/scripts/add-issues-to-project.sh MyOrg 3 \
  10 \
  15 \
  https://github.com/MyOrg/other-repo/issues/25

# Add multiple issues from different repos
./.claude/scripts/add-issues-to-project.sh MyOrg 3 \
  https://github.com/MyOrg/repo1/issues/10 \
  https://github.com/MyOrg/repo2/issues/25 \
  https://github.com/MyOrg/repo3/issues/7
```

**What it does:**
1. Accepts any organization and project number
2. Accepts both issue numbers and full URLs
3. When using numbers, automatically detects current repository
4. Can add issues from multiple repositories
5. Shows current repository when using issue numbers
6. Adds each specified issue to the project

**Requirements:**
- `gh` CLI authenticated and available
- Permissions to add items to the specified project
- When using issue numbers: must be in a git repository with GitHub remote
- Valid GitHub issue URLs or numbers

**When to use:**
- Working with different organizations/projects
- Need to selectively add specific issues
- Quick adding of issues from current repo using just numbers
- Adding issues from multiple repositories
- Need a reusable, flexible script

---

## create-sub-issue.sh

**Purpose**: Creates GitHub sub-issue relationships with simple command-line interface.

**Usage:**
```bash
./.claude/scripts/create-sub-issue.sh <parent_issue_number> <child_issue_number>
```

**Example:**
```bash
./.claude/scripts/create-sub-issue.sh 26 30
```

**What it does:**
1. Auto-detects current repository (owner/repo)
2. Validates both issues exist
3. Converts child issue number to internal ID
4. Creates sub-issue relationship via GitHub API
5. Verifies success and shows progress

**Requirements:**
- `gh` CLI authenticated and available
- `jq` for JSON parsing
- Current directory must be in a git repo with GitHub remote

**Output:**
- ✅ Success messages with verification
- ❌ Clear error messages if something fails
- 📊 Progress summary of parent issue
- 🌐 Direct links to view issues in GitHub

**Error handling:**
- Validates input arguments are numbers
- Checks if issues exist before attempting to link
- Handles repository detection failures
- Reports API errors clearly

This script eliminates the complexity of manual API calls and variable scope issues.