# GitHub Security for Claude Code

This document outlines the implemented security solution for using Claude Code with GitHub, preventing unauthorized access to the main branch while maintaining full functionality.

## Problem Statement

When Claude Code uses your personal GitHub credentials (which have full admin access), it can:

1. Push directly to the main branch
2. Create pull requests
3. Approve its own pull requests
4. Merge pull requests to main

This creates a security risk where automated tools have too much power over your codebase.

## Implemented Solution: Bot Account + Branch Rulesets

After evaluating GitHub Apps vs Bot Accounts, we chose the **Bot Account approach** because:

- Claude Code heavily uses `gh` CLI for issues and PRs (not compatible with GitHub Apps)
- Simple setup and clear attribution
- Works perfectly with existing workflow

### Solution Components

1. **Dedicated Bot Account** (`jakedetels-bot`)
2. **GitHub Branch Rulesets** (prevents any push to main)
3. **Worktree-Specific Git Config** (prevents accidental personal commits as bot)

## Implementation Details

### Bot Account Setup

**Email Strategy**: Email alias using `+` addressing

- Personal account: `jake.detels@gmail.com`
- Bot account: `jake.detels+claude-bot@gmail.com`
- Both deliver to same inbox but GitHub treats as separate accounts

**Account Configuration**:

- Username: `jakedetels-bot`
- Repository access: Write-only (no Admin permissions)
- MFA enabled with TOTP authenticator
- Personal Access Token with `repo` and `workflow` scopes

**What the Bot CAN do**:

- ✅ Create feature branches
- ✅ Push commits to feature branches
- ✅ Create pull requests
- ✅ Comment on issues and PRs
- ✅ Use full `gh` CLI functionality

**What the Bot CANNOT do**:

- ❌ Push to main branch (blocked by rulesets)
- ❌ Merge pull requests (no admin access)
- ❌ Approve pull requests (requires human review)
- ❌ Change repository settings

### GitHub Branch Rulesets (Primary Protection)

**Setup**: Repository → Settings → Rules → Rulesets

- **Target**: `main` branch
- **Rules Enabled**:
  - ✅ Restrict creations
  - ✅ Restrict updates (prevents all pushes to main)
  - ✅ Restrict deletions
- **Bypass List**: Only your personal account

**Why Rulesets > Branch Protection**: Operates at Git protocol level, cannot be bypassed even with admin access.

### Git Configuration Management

**Strategy**: Worktree-specific configuration prevents accidental attribution mix-ups

**Global Config** (Your personal development):

```bash
git config --global user.name "Jake Detels"
git config --global user.email "jake.detels@gmail.com"
```

**Main Worktree Config** (Your personal space):

```bash
cd main/
git config --local user.name "Jake Detels"
git config --local user.email "jake.detels@gmail.com"
```

**Feature Worktree Config** (Claude's automated spaces):

```bash
cd worktrees/<branch-name>/
git config --local user.name "Claude Bot"
git config --local user.email "jake.detels+claude-bot@gmail.com"
```

## Setup Instructions

### Step 1: Create Bot Account

1. Use incognito browser to avoid auth conflicts
2. Go to https://github.com/signup
3. Use email: `jake.detels+claude-bot@gmail.com`
4. Username: `jakedetels-bot`
5. Complete email verification
6. Enable 2FA with authenticator app

### Step 2: Add Bot to Repository

1. Go to repository Settings → Collaborators
2. Add `jakedetels-bot` with **Write** access
3. Bot accepts invitation via email

### Step 3: Generate Personal Access Token

1. In bot account: Settings → Developer settings → Personal access tokens
2. Create token with scopes: `repo`, `workflow`
3. Save token securely

### Step 4: Configure Claude Code Environment

```bash
# Set environment variables for Claude Code
export GH_TOKEN="<bot-personal-access-token>"
export GITHUB_TOKEN="<bot-personal-access-token>"
```

### Step 5: Configure Branch Rulesets

1. Go to repository Settings → Rules → Rulesets
2. Create new ruleset targeting `main` branch
3. Enable: Restrict creations, updates, deletions
4. Add only your personal account to bypass list

### Step 6: Update Worktree Creation

Modify worktree setup to automatically configure bot credentials:

```bash
# After creating worktree
cd worktrees/$BRANCH_NAME
git config --local user.name "Claude Bot"
git config --local user.email "jake.detels+claude-bot@gmail.com"
```

## Verification

### Confirm Bot Restrictions

```bash
# This should fail with bot credentials
GH_TOKEN="<bot-token>" git push origin main
# Expected: "Ruleset violations found - Cannot update protected branch 'main'"
```

### Confirm Proper Attribution

```bash
# In worktree
git config user.email
# Should show: jake.detels+claude-bot@gmail.com

# In main/
git config user.email
# Should show: jake.detels@gmail.com
```

## Security Model Summary

This multi-layered approach ensures:

1. **Bot cannot access main branch** (GitHub rulesets block at protocol level)
2. **Clear audit trail** (all bot actions attributed to bot account)
3. **No accidental attribution** (worktree-specific git config)
4. **Full Claude Code functionality** (gh CLI works perfectly)
5. **Human control maintained** (only you can review and merge PRs)

The bot can propose changes through PRs but cannot unilaterally modify the main branch, providing security without sacrificing productivity.
