# Post Status Update to Slack

Post a status update about your current work to the appropriate Slack channels.

## Usage

```
/slack-status <status-message>
```

## Parameters

- `status-message`: Description of current work, completion, or next steps

## Examples

```bash
/slack-status "Completed user authentication feature - ready for testing"
/slack-status "Working on API endpoints for user dashboard"
/slack-status "Blocked on database schema - need backend team input"
/slack-status "Frontend deployment complete - staging environment ready"
```

## Message Format

Your status will be formatted and posted to Slack as:

```
🎯 [Frontend-Agent] Completed user authentication feature - ready for testing
├── Project: proj-alpha
├── Branch: feature/auth-system
├── Container: cc-frontend-001
├── Status: ✅ Ready for review
├── Issues: #123, #125
└── Next: Waiting for testing validation
```

## Target Channels

Status updates are automatically posted to:

- `#proj-{project}-dashboard` - Project coordination channel
- `#proj-{project}-{your-role}` - Your role-specific channel

## Status Types

The command automatically detects status type from your message:

- **In Progress**: Working on, developing, implementing
- **Completed**: Finished, done, complete, ready
- **Blocked**: Blocked, waiting, need help, stuck
- **Review Ready**: Ready for review, completed, done

## Implementation

```typescript
// Parse status message and detect type
const statusType = detectStatusType(statusMessage);

// Get current context (branch, issues, etc.)
const context = await getCurrentContext();

// Post formatted update to Slack
await postSlackStatus({
  status: statusType,
  task_context: statusMessage,
  github_issues: context.relatedIssues,
  next_steps: extractNextSteps(statusMessage)
});

// Log locally for debugging
await logStatusUpdate(statusMessage, statusType);
```

## GitHub Integration

If your status mentions issue numbers (#123), they will be:

- Automatically linked in the Slack message
- Updated in GitHub with status comments
- Tracked for Implementation Plan progress

## Best Practices

**Clear Descriptions**:
```bash
/slack-status "User authentication API complete - all tests passing"
```

**Include Context**:
```bash
/slack-status "Frontend form validation added - handles edge cases from issue #156"
```

**Mention Blockers**:
```bash
/slack-status "Blocked on API deployment - waiting for DevOps team configuration"
```

**Next Steps**:
```bash
/slack-status "Database migration complete - ready to integrate with frontend"
```

## Error Handling

- **Not Connected**: Will prompt to use `/slack-connect` first
- **Webhook Down**: Will queue message and retry automatically
- **Network Issues**: Will save locally and sync when available

## Related Commands

- `/slack-connect` - Connect to Slack coordination first
- `/slack-handover` - Transfer work to another agent
- `/context-save` - Save context with Slack notification
- `/slack-disconnect` - Disconnect from coordination