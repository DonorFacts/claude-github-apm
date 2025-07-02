# APM Slack Integration - Phase 1

Phase 1 Foundation implementation for Claude GitHub APM Slack coordination system.

## Quick Start

1. **Run Setup**:
   ```bash
   tsx src/scripts/slack/setup-phase1.ts
   ```

2. **Configure Slack Bot** (if not using environment variables):
   ```bash
   # Edit .slack-config.json with your Slack bot token
   ```

3. **Start Coordination System**:
   ```bash
   ./start-slack-coordinator.sh
   ```

4. **Connect Claude Code Instances**:
   ```bash
   # In any CC terminal
   /slack-connect <project-name> <agent-role>
   ```

## Components

### Scripts

- **`setup-phase1.ts`** - Automated setup and configuration
- **`webhook-server.ts`** - Receives status updates from CC instances  
- **`cc-adapter.ts`** - CC instance integration adapter
- **`channel-manager.ts`** - Slack channel creation and management

### Agent

- **`slack-coordinator`** - APM agent in `apm/agents/slack-coordinator/`
- **Init prompt** - `src/prompts/agents/slack-coordinator/init.md`

### Commands

- **`/slack-connect`** - Connect CC instance to coordination
- **`/slack-status`** - Post status updates to Slack

## Architecture

```
CC Instance 1 ──┐
CC Instance 2 ──┼─→ Webhook Server ──→ Slack Bot ──→ Project Channels
CC Instance N ──┘
```

### Channel Organization

- `#proj-{name}-dashboard` - Main project coordination
- `#proj-{name}-{role}` - Role-specific updates (frontend, backend, etc.)
- `#apm-coordination` - Cross-project handoffs
- `#apm-implementation` - Implementation Plan updates

### Message Format

```
🎯 [Frontend-Agent] Completed user authentication feature
├── Project: proj-alpha
├── Branch: feature/auth-system  
├── Container: cc-frontend-001
├── Status: ✅ Ready for review
├── Issues: #123, #125
└── Next: Waiting for testing validation
```

## Configuration

### Environment Variables

```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret  
SLACK_WEBHOOK_PORT=3000
```

### Config Files

- **`.slack-config.json`** - Slack bot configuration
- **`.cc-slack-config.json`** - CC instance adapter config (auto-generated)

## Usage Examples

### Connect and Post Status

```bash
# Connect CC instance
/slack-connect myproject frontend

# Post work updates  
/slack-status "Implementing user dashboard components"
/slack-status "Frontend tests passing - ready for review"
/slack-status "Blocked on API changes - need backend input"
```

### Start/Stop Coordination

```bash
# Start system
./start-slack-coordinator.sh

# Test connectivity
tsx src/scripts/slack/channel-manager.ts list

# Stop system (Ctrl+C in coordinator terminal)
```

### Manual Channel Management

```bash
# Set up project channels
tsx src/scripts/slack/channel-manager.ts setup-project myproject

# Set up meta channels
tsx src/scripts/slack/channel-manager.ts setup-meta

# List all channels
tsx src/scripts/slack/channel-manager.ts list
```

## Troubleshooting

### Common Issues

**"Webhook server not available"**:
- Ensure `start-slack-coordinator.sh` is running
- Check port 3000 is not in use
- Verify `.slack-config.json` configuration

**"SLACK_BOT_TOKEN not configured"**:
- Set environment variable or update `.slack-config.json`
- Verify token starts with `xoxb-`
- Check token has required scopes

**"Channel creation failed"**:
- Verify bot token has `channels:write` scope
- Check workspace permissions
- Ensure unique channel names

### Debug Commands

```bash
# Check webhook server health
curl http://localhost:3000/health

# Test Slack connectivity
tsx src/scripts/slack/channel-manager.ts list

# View CC adapter config
cat .cc-slack-config.json

# Check logs
tail -f apm/logs/slack/$(date +%Y-%m-%d).jsonl
```

## Next Steps (Phase 2)

- GitHub issue/PR synchronization
- Implementation Plan integration  
- Context handover automation
- Rich message formatting
- Error handling and recovery

## Documentation

- **User Guide**: `docs/slack-integration-guide.md`
- **Project Plan**: `docs/planning/slack-integration.md`
- **Architecture**: Phase 1 Foundation section in project plan