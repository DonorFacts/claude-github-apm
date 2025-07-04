#!/bin/bash

# Update VS Code terminal tab title
# Usage: ./update-terminal-title.sh "Your Title Here"

if [ $# -eq 0 ]; then
    echo "Error: No title provided"
    echo "Usage: $0 \"Your Terminal Title\""
    exit 1
fi

# Get the title from command line argument
TITLE="$1"

# Update terminal title using ANSI escape sequence
echo -e "\033]0;${TITLE}\007"

# Also try alternative method for broader compatibility
printf '\033]2;%s\033\\' "${TITLE}"

echo "Terminal title updated to: ${TITLE}"