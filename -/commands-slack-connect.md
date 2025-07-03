# Connect Claude Code Instance to Slack Coordination

Connect this Claude Code instance to the APM Slack coordination system for multi-instance project management.

## Usage

```
/slack-connect <project-name> <agent-role>
```

## Parameters

- `project-name`: The project identifier (e.g., "proj-alpha", "dashboard-app")
- `agent-role`: Your role in the project (e.g., "frontend", "backend", "testing", "devops")

## Examples

```bash
/slack-connect proj-alpha frontend
/slack-connect dashboard-app backend  
/slack-connect api-service testing
```

## What This Does

1. **Connects to Slack**: Establishes connection with the Slack coordination webhook server
2. **Registers Instance**: Identifies this CC instance with project and role
3. **Creates Channels**: Ensures appropriate Slack channels exist for the project
4. **Enables Updates**: Allows automatic status posting to Slack channels
5. **Prepares Handovers**: Sets up context sharing with other agents

## Implementation

```typescript
// Execute the CC adapter connection script
await exec(`tsx ${SCRIPTS_DIR}/slack/cc-adapter.ts connect "${projectName}" "${agentRole}"`);

// Verify connection and post initial status
await postSlackStatus({
  status: 'in_progress',
  task_context: 'Connected to Slack coordination system',
  next_steps: 'Ready for task assignment and collaboration'
});

// Update terminal title to show Slack connectivity
await exec(`echo -e "\\033]0;${agentRole} (Slack)\\007"`);
```

## Success Indicators

- ✅ Connection confirmation message
- ✅ Initial status posted to Slack channels
- ✅ Terminal title updated with Slack indicator
- ✅ Configuration saved for future sessions

## Slack Channels Created

Upon connection, the following channels will be created if they don't exist:

- `#proj-{project}-dashboard` - Main project coordination
- `#proj-{project}-{role}` - Role-specific updates
- `#apm-coordination` - Cross-project handoffs
- `#apm-implementation` - Implementation plan updates

## Error Handling

- **Webhook Server Down**: Will retry connection and show clear error message
- **Invalid Project Name**: Will suggest valid project naming patterns
- **Network Issues**: Will provide offline mode instructions
- **Permission Issues**: Will guide through Slack app setup

## Next Steps

After connecting:

1. Use `/slack-status <message>` to post updates
2. Use `/slack-handover <target-agent>` for context transfers  
3. Work normally - major milestones auto-post to Slack
4. Use `/slack-disconnect` when done

## Related Commands

- `/slack-status` - Post status update to Slack
- `/slack-handover` - Initiate context handover
- `/slack-disconnect` - Disconnect from coordination
- `/context-save` - Save context with Slack notification