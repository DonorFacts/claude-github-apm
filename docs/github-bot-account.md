# GitHub Bot Account Setup

This guide provides comprehensive instructions for setting up a GitHub bot account to enhance security when using Claude agents with your repositories.

## Overview

The GitHub bot account provides a security layer that prevents AI agents from having direct access to your main branch while maintaining full functionality for feature development. This approach follows enterprise security best practices by implementing the principle of least privilege.

## Security Model

### Problem Statement

When Claude Code uses your personal GitHub credentials, it inherits all your repository permissions, including:

- Direct push access to main branch
- Repository administration rights
- Pull request approval capabilities
- Merge permissions

This creates unnecessary security exposure where automated tools have the same privileges as repository owners.

### Solution: Bot Account + Branch Rulesets

Our implementation uses a **dedicated bot account** combined with **GitHub branch rulesets** to create a secure, auditable system:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Account  │    │   Bot Account    │    │  Main Branch    │
│   (Full Admin)  │    │  (Write Only)    │    │   Protected     │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ ✅ Push to main │    │ ❌ Push to main  │    │ ✅ Branch rules │
│ ✅ Merge PRs    │    │ ❌ Merge PRs     │    │ ✅ PR required  │
│ ✅ Admin rights │    │ ❌ Admin rights  │    │ ✅ Review req'd │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Why This Approach

We chose **bot accounts** over GitHub Apps because:

- **CLI Compatibility**: Claude Code heavily uses `gh` CLI, which works seamlessly with bot accounts
- **Simple Setup**: No complex app registration or webhook configuration
- **Clear Attribution**: All bot actions are clearly attributed to the bot account
- **Full Functionality**: No limitations on GitHub API access

## Prerequisites

- GitHub account with repository access
- Repository with admin permissions (to configure branch rulesets)
- Email service that supports plus addressing (Gmail, most providers)

## Step-by-Step Setup

### Step 1: Create Bot Account

1. **Open incognito browser window** (prevents auth conflicts with your main account)

2. **Navigate to GitHub signup**: `https://github.com/signup`

3. **Configure bot account**:
   - **Email**: `your-email+bot@gmail.com` (uses plus addressing)
   - **Username**: `yourname-bot` (clear, descriptive naming)
   - **Password**: Use a unique, secure password

4. **Complete email verification**

5. **Enable two-factor authentication**:
   - Settings → Password and authentication → Two-factor authentication
   - Use authenticator app (recommended)
   - Save recovery codes securely

### Step 2: Add Bot to Repository

1. **Navigate to repository settings**:
   - Go to your repository
   - Settings → Collaborators and teams

2. **Add collaborator**:
   - Click "Add people"
   - Search for your bot username: `yourname-bot`
   - Select **Write** permission level (never Admin/Maintain)

3. **Bot accepts invitation**:
   - Check bot account email for invitation
   - Accept the collaboration invitation

### Step 3: Configure Branch Protection

Branch rulesets provide the critical security layer that prevents bot access to main branch.

1. **Navigate to repository rules**:
   - Repository → Settings → Rules → Rulesets

2. **Create new branch ruleset**:
   - Click "New branch ruleset"
   - **Name**: "Main Branch Protection"
   - **Enforcement status**: Active

3. **Configure target branches**:
   - **Target branches**: Add `main` (or your default branch)

4. **Enable protection rules**:
   ```
   ✅ Restrict creations
   ✅ Restrict updates (CRITICAL - blocks direct pushes)
   ✅ Restrict deletions
   ✅ Require a pull request before merging
   ✅ Require status checks to pass
   ✅ Block force pushes
   ```

5. **Configure bypass permissions**:
   - **Bypass list**: Add only your personal account
   - **Never add the bot account to bypass list**

### Step 4: Generate Personal Access Token

1. **Access bot account settings**:
   - Sign in to bot account
   - Settings → Developer settings → Personal access tokens

2. **Generate new token**:
   - Choose "Tokens (classic)" for broad compatibility
   - **Note**: "Claude Code Bot Access"
   - **Expiration**: 90 days (renewable)
   - **Scopes**:
     ```
     ✅ repo (Full control of private repositories)
     ✅ workflow (Update GitHub Action workflows)
     ```

3. **Save token securely**:
   - Copy the generated token immediately
   - Store in password manager or secure location
   - **Token will not be shown again**

### Step 5: Configure Local Environment

1. **Set environment variable**:
   ```bash
   export GITHUB_BOT_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

2. **Add to shell profile** (permanent setup):
   ```bash
   # For zsh users (~/.zshrc):
   echo 'export GITHUB_BOT_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
   
   # For bash users (~/.bashrc):
   echo 'export GITHUB_BOT_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"' >> ~/.bashrc
   ```

3. **Reload shell configuration**:
   ```bash
   source ~/.zshrc  # or ~/.bashrc
   ```

4. **Verify setup**:
   ```bash
   echo $GITHUB_BOT_TOKEN  # Should display your token
   ```

### Step 6: Automatic Git Configuration

The system automatically configures git credentials when creating worktrees:

- **Main branch**: Uses your personal git config
- **Worktrees**: Automatically configured with bot credentials via `create-handover.sh`

If you need to manually configure a worktree:
```bash
cd worktrees/<branch-name>/
git config --local user.name "Bot"
git config --local user.email "your-email+bot@gmail.com"
```

## Verification and Testing

### Test Bot Permissions

1. **Verify bot cannot push to main** (should fail):
   ```bash
   # Temporarily use bot token
   export GH_TOKEN="$GITHUB_BOT_TOKEN"
   git push origin main
   # Expected: "Ruleset violations found - Cannot update protected branch 'main'"
   ```

2. **Verify bot can push to feature branches** (should succeed):
   ```bash
   git checkout -b test-bot-permissions
   echo "test" > test.txt
   git add test.txt
   git commit -m "test: bot permissions"
   git push origin test-bot-permissions
   # Should succeed without errors
   ```

### Test Git Attribution

1. **Check main branch config**:
   ```bash
   git config user.email
   # Should show: your-email@gmail.com
   ```

2. **Check worktree config**:
   ```bash
   cd worktrees/<branch-name>/
   git config user.email
   # Should show: your-email+bot@gmail.com
   ```

### Test GitHub CLI Integration

```bash
# Using bot token
GH_TOKEN="$GITHUB_BOT_TOKEN" gh auth status
# Should show bot account authentication

# Create issue as bot
GH_TOKEN="$GITHUB_BOT_TOKEN" gh issue create --title "Test Bot Issue" --body "Testing bot functionality"
# Should succeed and attribute to bot account
```

## Operational Procedures

### Token Rotation

GitHub Personal Access Tokens should be rotated every 90 days:

1. **Generate new token** following Step 4
2. **Update environment variable** in shell profile
3. **Test functionality** using verification steps
4. **Revoke old token** in GitHub settings

### Monitoring Bot Activity

1. **Repository activity**: All bot actions appear in repository activity feed
2. **Commit attribution**: Bot commits clearly attributed to `your-email+bot@gmail.com`
3. **Audit logs**: Enterprise accounts have detailed audit logs for bot actions

### Emergency Procedures

If bot account is compromised:

1. **Immediately revoke token**: GitHub → Settings → Developer settings → Personal access tokens
2. **Remove bot from repository**: Repository → Settings → Collaborators
3. **Check recent activity**: Repository → Insights → Network for unauthorized commits
4. **Create new bot account** if needed following this guide

## Troubleshooting

### Common Issues

#### Token Not Working
```bash
# Symptoms: API calls fail with 401 Unauthorized
# Solutions:
1. Verify token is correctly set: echo $GITHUB_BOT_TOKEN
2. Check token scopes in GitHub settings
3. Ensure token hasn't expired
4. Test with basic API call: curl -H "Authorization: token $GITHUB_BOT_TOKEN" https://api.github.com/user
```

#### Git Push Failures
```bash
# Symptoms: "Permission denied" or "Authentication failed"
# Solutions:
1. Verify git remote uses HTTPS (not SSH): git remote -v
2. Check git credentials: git config --list | grep user
3. Test token manually: GH_TOKEN="$GITHUB_BOT_TOKEN" git push origin branch
```

#### Worktree Git Config Issues
```bash
# Symptoms: Commits attributed to wrong user
# Solutions:
1. Check local config: git config --local --list
2. Manually set bot config:
   git config --local user.name "Bot"
   git config --local user.email "your-email+bot@gmail.com"
3. Verify changes: git config user.email
```

### Warning Messages

When bot token is not configured, you'll see:
```
⚠️  WARNING: No GITHUB_BOT_TOKEN found!
   Commits will be attributed to your personal account
   For security, set up bot account: see README.md 'GitHub Bot Account Setup'
```

This is expected behavior - the system falls back to personal credentials with appropriate warnings.

## Security Benefits

### Multi-Layer Protection

1. **Account Separation**: Bot account has limited permissions
2. **Branch Protection**: Rulesets prevent unauthorized main branch access
3. **Audit Trail**: Clear attribution of human vs automated changes
4. **Token Isolation**: Bot tokens separate from personal credentials

### Compliance and Governance

- **SOX Compliance**: Separation of duties between development and deployment
- **Audit Requirements**: Clear trail of who made what changes
- **Risk Management**: Limited blast radius if bot account is compromised
- **Best Practices**: Follows enterprise security patterns

### Operational Security

- **Least Privilege**: Bot has minimum required permissions
- **Fail-Safe**: System works even without bot account (with warnings)
- **Transparency**: All bot actions clearly identified
- **Reversible**: Easy to disable or rotate bot access

## Advanced Configuration

### Multiple Repositories

For organizations managing multiple repositories:

1. **Create organization bot account**: `org-name-bot`
2. **Add to multiple repositories** with Write permissions
3. **Use same token** across repositories (within scope limits)
4. **Configure branch rulesets** on each repository

### Enterprise Integration

For GitHub Enterprise customers:

1. **SAML/SSO Configuration**: Bot accounts can be SAML-enabled
2. **Enterprise Audit Logs**: Detailed logging of bot activities
3. **IP Restrictions**: Can be applied to bot accounts
4. **Advanced Security**: GitHub Advanced Security features apply

### Custom Workflows

Integration with existing CI/CD:

```yaml
# .github/workflows/bot-validation.yml
name: Bot PR Validation
on:
  pull_request:
    branches: [main]

jobs:
  validate-bot-pr:
    if: github.actor == 'yourname-bot'
    runs-on: ubuntu-latest
    steps:
      - name: Enhanced validation for bot PRs
        run: |
          echo "Applying additional validation for bot-generated PRs"
          # Add custom validation logic
```

## Migration Guide

### From Personal to Bot Account

If you're already using personal credentials:

1. **Set up bot account** following this guide
2. **Keep personal credentials** as backup
3. **Test bot functionality** in development branch
4. **Gradually migrate** worktrees to use bot account
5. **Monitor for issues** during transition period

### Rollback Procedure

To revert to personal credentials:

1. **Unset bot token**: `unset GITHUB_BOT_TOKEN`
2. **System automatically falls back** to personal credentials
3. **Warning messages appear** indicating personal account usage
4. **Full functionality maintained** during rollback

## Support and Resources

### Documentation References

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Branch Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth)

### Best Practices Summary

✅ **Do:**
- Use descriptive bot account names
- Enable 2FA on bot accounts
- Rotate tokens every 90 days
- Monitor bot activity regularly
- Use minimal required permissions

❌ **Don't:**
- Give bot accounts admin permissions
- Add bot accounts to branch protection bypass lists
- Share bot tokens between team members
- Use bot accounts for manual operations
- Store tokens in version control

This comprehensive setup ensures your Claude agents operate securely while maintaining full functionality for development workflows.