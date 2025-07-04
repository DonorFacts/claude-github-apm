# Bot Account Git Configuration

This guide sets up automatic git identity switching between your personal account and bot account based on directory location.

## Result

- **Main directory commits**: `Jake Detels <jake@detels.com>` 
- **Worktrees commits**: `jakedetels-bot <Jake.Detels+Bot@gmail.com>`
- **Automatic switching** - no manual intervention needed
- **Clear audit trail** of human vs automated changes

## Setup (Automatic)

**No manual setup required!** The configuration happens automatically when you run `pnpm claude`:

1. **Automatic git config creation:**
   - Creates `~/.gitconfig` with conditional inclusion for worktrees
   - Creates `~/.gitconfig-bot` with bot account overrides
   - Backs up any existing configuration with timestamp

2. **Automatic authentication:**
   - If `GITHUB_BOT_TOKEN` env variable is available, authentication is configured automatically
   - Bot credentials are stored securely for seamless git operations

3. **Zero configuration experience:**
   ```bash
   # Just run Claude normally - everything is automatic!
   pnpm claude
   ```

## How It Works

### Conditional Configuration

The main `~/.gitconfig` contains:

```ini
[user]
    name = Jake Detels
    email = jake@detels.com

[includeIf "gitdir:**/worktrees/"]
    path = ~/.gitconfig-bot
```

### Bot Override

The `~/.gitconfig-bot` file overrides settings when in worktrees:

```ini
[user]
    name = jakedetels-bot
    email = Jake.Detels+Bot@gmail.com

[credential "https://github.com"]
    username = jakedetels-bot
```

### Directory-Based Switching

- **Any `/worktrees/` path** → Bot account automatically used
- **All other paths** → Personal account used
- **Container integration** → Configurations automatically mounted and copied

## Testing

Test the configuration from different directories:

```bash
# From main directory
cd /path/to/project/main
git config user.name
# Output: Jake Detels

# From worktree
cd /path/to/project/worktrees/some-feature
git config user.name  
# Output: jakedetels-bot
```

## Container Integration

The APM container system automatically:

1. **Mounts** your host git configurations
2. **Copies** them to the container for proper `includeIf` processing
3. **Preserves** directory-based switching behavior
4. **Uses** appropriate credentials for each location

No additional container configuration needed - it just works!

## Troubleshooting

### Bot Config Not Applied

If you're in a worktree but still seeing personal credentials:

1. **Check path matching**: Ensure directory contains `/worktrees/`
2. **Verify files exist**: `ls -la ~/.gitconfig*`
3. **Test git config**: `git config --list --show-origin`

### Authentication Issues

If git push fails with bot credentials:

1. **Check bot token**: `echo $GITHUB_BOT_TOKEN | wc -c` (should be > 1)
2. **Re-run setup**: `./.local/bin/setup-bot-git-config.sh`
3. **Manual auth**: `gh auth login` as jakedetels-bot

### Container Issues

If container doesn't respect bot config:

1. **Restart container**: `docker rm -f apm-workspace` then `pnpm claude`
2. **Check mounts**: Look for "🤖 Bot configuration detected" in container logs
3. **Verify copies**: `ls -la /home/user/.gitconfig*` inside container