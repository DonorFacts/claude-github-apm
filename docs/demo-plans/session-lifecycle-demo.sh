#!/bin/bash
# APM Session Lifecycle Demo Script
# Demonstrates: Registration → Active → Crash → Recovery

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== APM Session Lifecycle Demo ===${NC}"
echo "This demo shows the complete agent session tracking system"
echo

# Step 1: Show current status
echo -e "${YELLOW}Step 1: Current Session Status${NC}"
echo "Let's see what sessions are currently active:"
pnpm cli list --all
echo
read -p "Press Enter to continue..."

# Step 2: Initialize new agent
echo -e "\n${YELLOW}Step 2: Initialize New Agent${NC}"
echo "Starting a new developer agent with 'payment-processing' specialization..."
echo "Command: pnpm cli init developer payment-processing --register-only"
SESSION_ID=$(pnpm cli init developer payment-processing --register-only 2>&1 | grep "Session ID:" | awk '{print $3}')
echo -e "${GREEN}✓ Created session: $SESSION_ID${NC}"
echo
read -p "Press Enter to continue..."

# Step 3: Show active session
echo -e "\n${YELLOW}Step 3: Verify Session is Active${NC}"
pnpm cli list | grep -A4 "$SESSION_ID" || echo "Session not found in active list"
echo
read -p "Press Enter to continue..."

# Step 4: Send heartbeats
echo -e "\n${YELLOW}Step 4: Heartbeat Updates${NC}"
echo "Sending 3 heartbeats (simulating active work)..."
for i in 1 2 3; do
    echo -n "  Heartbeat $i..."
    pnpm cli heartbeat "$SESSION_ID" --silent
    echo -e " ${GREEN}✓${NC}"
    sleep 1
done
echo
read -p "Press Enter to continue..."

# Step 5: Simulate crash
echo -e "\n${YELLOW}Step 5: Simulate Crash${NC}"
echo "Updating heartbeat to 3 hours ago to simulate a crash..."

# Create temporary JavaScript script to modify YAML
cat > /tmp/simulate_crash.js << 'EOF'
const fs = require('fs');
const yaml = require('js-yaml');

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Session ID required');
  process.exit(1);
}

const registryPath = '../apm/sessions/registry.yaml';
const content = fs.readFileSync(registryPath, 'utf8');
const data = yaml.load(content);

for (const session of data.sessions) {
  if (session.id === sessionId) {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    session.last_heartbeat = threeHoursAgo.toISOString();
    console.log('Updated ' + session.id + ' heartbeat to 3 hours ago');
    break;
  }
}

fs.writeFileSync(registryPath, yaml.dump(data));
EOF

(cd /workspace/worktrees/feature-multi-agent-memory-architecture && node /tmp/simulate_crash.js "$SESSION_ID")
echo -e "${GREEN}✓ Crash simulated${NC}"
echo
read -p "Press Enter to continue..."

# Step 6: Show crashed session
echo -e "\n${YELLOW}Step 6: Verify Session Shows as Crashed${NC}"
pnpm cli list --crashed | grep -A4 "$SESSION_ID" || echo "Session not found in crashed list"
echo
read -p "Press Enter to continue..."

# Step 7: Recovery demonstration
echo -e "\n${YELLOW}Step 7: Recovery Process${NC}"
echo "Let's see what recovery would do for this session:"
pnpm cli recover "$SESSION_ID" --dry-run
echo
read -p "Press Enter to continue..."

# Step 8: Show all crashed sessions
echo -e "\n${YELLOW}Step 8: Bulk Recovery${NC}"
echo "APM can also recover ALL crashed sessions at once:"
echo "Command: pnpm cli recover all"
echo
echo "Current crashed sessions:"
pnpm cli list --crashed
echo

# Cleanup
rm -f /tmp/simulate_crash.js

echo -e "${BLUE}=== Demo Complete ===${NC}"
echo
echo "Key Takeaways:"
echo "  ✓ Sessions auto-register when agents initialize"
echo "  ✓ Heartbeats keep sessions marked as active"
echo "  ✓ Stale heartbeats (>2 min) mark sessions as crashed"
echo "  ✓ Recovery command can restore individual or all sessions"
echo "  ✓ Environment (🐳 container vs 💻 host) is tracked"
echo
echo "Next steps:"
echo "  - Implement actual recovery logic (VS Code integration)"
echo "  - Add automatic heartbeat daemon to agents"
echo "  - Create session handoff between contexts"