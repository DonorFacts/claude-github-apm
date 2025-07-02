#!/bin/bash
# Simpler approach: Wrapper script that prepends metadata

# Generate metadata
generate_metadata() {
    cat << EOF
[Agent Context]
Time: $(date +"%Y-%m-%d %H:%M:%S")
Branch: $(git branch --show-current)
Modified Files: $(git status --porcelain | wc -l)
Last Commit: $(git log -1 --format="%ar")
Working Directory: $(pwd)
Recent Bugs: $(git log --grep="fix\|bug" --oneline -3 | wc -l) fixes in last 3 commits
EOF
}

# This would be integrated into the Claude startup process
# The metadata would be injected into the conversation context