#!/bin/bash
# Shell configuration setup for Docker container
# Sets up shell configuration that works for any user

set -e

echo "🔧 Setting up shell configuration..."

# Add shell configuration to /etc/bash.bashrc
echo 'export HISTSIZE=100000' >> /etc/bash.bashrc
echo 'export PATH="/workspace/.local/bin:/workspace/node_modules/.bin:$PATH"' >> /etc/bash.bashrc
echo 'alias python=python3' >> /etc/bash.bashrc
echo 'alias pip=pip3' >> /etc/bash.bashrc
echo 'alias e="pnpm tsx"' >> /etc/bash.bashrc
echo 'alias pn=pnpm' >> /etc/bash.bashrc
echo 'eval "$(direnv hook bash)"' >> /etc/bash.bashrc

echo "✅ Shell configuration completed"