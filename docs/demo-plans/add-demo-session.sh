#!/bin/bash
# Add demo session to showcase session tracking

set -e

echo "🎬 Adding demo session to APM registry..."

# Read current registry
registry_file="../apm/sessions/registry.json"
temp_file="/tmp/apm_registry_temp.json"

# Add a new "prompt-engineer" session that recently crashed
jq '.sessions += [{
  "id": "pe-ux-003-20250701",
  "status": "crashed", 
  "role": "prompt-engineer",
  "specialization": "ux-optimization",
  "worktree": "feature-user-experience",
  "branch": "feature/login-flow-optimization", 
  "last_heartbeat": "2025-07-01T21:45:00Z",
  "created": "2025-07-01T19:30:00Z",
  "context_file": "context/latest.md"
}]' "$registry_file" > "$temp_file"

# Backup original and replace
cp "$registry_file" "${registry_file}.backup"
mv "$temp_file" "$registry_file"

echo "✅ Added prompt-engineer session: pe-ux-003-20250701"
echo "💾 Backup saved: ${registry_file}.backup"
echo ""
echo "Now run: ./apm/scripts/apm list --all"