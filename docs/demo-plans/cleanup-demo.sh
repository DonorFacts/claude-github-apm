#!/bin/bash
# Reset demo environment to clean state

set -e

echo "🧹 Cleaning up demo environment..."

registry_file="../apm/sessions/registry.json"

# Restore from backup if it exists
if [[ -f "${registry_file}.backup" ]]; then
    mv "${registry_file}.backup" "$registry_file"
    echo "✅ Restored registry from backup"
else
    # Reset to empty state
    echo '{"sessions": []}' > "$registry_file"
    echo "✅ Reset registry to empty state"
fi

# Clean up any temp files
rm -f /tmp/apm_*

echo "🎬 Demo environment reset!"
echo ""
echo "Ready for fresh demo run."