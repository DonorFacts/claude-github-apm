# Bot Configuration Setup

This document explains how to configure bot credentials for Docker container authentication.

## Required Files

### 1. Host Bot Configuration (`~/.gitconfig-bot`)

Create a bot-specific git configuration file on your host system:

```bash
# Create ~/.gitconfig-bot with your bot credentials
cat > ~/.gitconfig-bot << 'EOF'
[user]
    name = your-bot-name
    email = your-bot-email@example.com

[credential "https://github.com"]
    username = your-bot-github-username
EOF
```

### 2. Environment Variables

Set the GitHub bot token in your host environment:

```bash
export GITHUB_BOT_TOKEN="ghp_your_bot_token_here"
```

## How It Works

1. **Host Configuration**: Your personal git config remains in `~/.gitconfig`
2. **Bot Isolation**: Container only receives bot credentials via environment variables
3. **Automatic Setup**: Container startup reads host bot config and creates container-specific configuration
4. **Security**: No personal credentials are mounted or accessible in container

## Container Behavior

When the container starts:

1. Reads `~/.gitconfig-bot` from host (via `bot-config-loader.sh`)
2. Exports `BOT_GIT_NAME`, `BOT_GIT_EMAIL`, `BOT_GIT_USERNAME` environment variables
3. Creates container-specific `~/.gitconfig` with bot credentials only
4. Sets up GitHub authentication using `GITHUB_BOT_TOKEN`

## Environment Variables Reference

| Variable | Source | Purpose |
|----------|--------|---------|
| `BOT_GIT_NAME` | `~/.gitconfig-bot` user.name | Git commit author name |
| `BOT_GIT_EMAIL` | `~/.gitconfig-bot` user.email | Git commit author email |
| `BOT_GIT_USERNAME` | `~/.gitconfig-bot` credential.username | GitHub username |
| `GITHUB_BOT_TOKEN` | Host environment | GitHub API authentication |

## Verification

To verify your setup:

```bash
# Test bot config loader
./src/integrations/docker/management/bot-config-loader.sh

# Expected output:
# ✅ Bot configuration loaded:
#    Name: your-bot-name
#    Email: your-bot-email@example.com
#    GitHub Username: your-bot-github-username
```

## Troubleshooting

### Missing Bot Config File
```
⚠️  Bot configuration file not found: ~/.gitconfig-bot
```
**Solution**: Create `~/.gitconfig-bot` with your bot credentials (see above)

### Incomplete Configuration
```
❌ Incomplete bot configuration in ~/.gitconfig-bot
```
**Solution**: Ensure your `~/.gitconfig-bot` has all required fields:
- `[user]` section with `name` and `email`
- `[credential "https://github.com"]` section with `username`

### Missing Bot Token
```
⚠️  Bot git config not set - missing GITHUB_BOT_TOKEN
```
**Solution**: Set `GITHUB_BOT_TOKEN` environment variable on host

## Example Complete Setup

```bash
# 1. Create bot config file
cat > ~/.gitconfig-bot << 'EOF'
[user]
    name = myproject-bot
    email = myproject-bot@example.com

[credential "https://github.com"]
    username = myproject-bot
EOF

# 2. Set bot token (add to ~/.bashrc or ~/.zshrc)
export GITHUB_BOT_TOKEN="ghp_your_actual_bot_token_here"

# 3. Test configuration
./src/integrations/docker/management/bot-config-loader.sh

# 4. Start container (will automatically use bot credentials)
./src/integrations/docker/management/claude
```

This ensures your personal git credentials stay on the host while the container operates with bot-only access.