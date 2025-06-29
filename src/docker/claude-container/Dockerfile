FROM node:20-slim

# Install system dependencies including GitHub CLI, security tools, and shell utilities
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    zsh \
    ca-certificates \
    wget \
    gnupg \
    iptables \
    netbase \
    dnsutils \
    jq \
    sox \
    alsa-utils \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor > /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create secure workspace structure for multi-agent collaboration
RUN mkdir -p /workspace /workspace-main /workspace-worktrees /tmp/claude-workspace \
    && useradd -m -s /bin/bash claude \
    && chown claude:claude /workspace /workspace-main /workspace-worktrees /tmp/claude-workspace \
    && mkdir -p /home/claude \
    && chown claude:claude /home/claude

# Install direnv for automatic environment loading
RUN curl -sfL https://direnv.net/install.sh | bash

# Set up shell configuration for claude user
RUN echo '# Container shell configuration (mirroring Jake'\''s ~/.zshrc)' > /home/claude/.bashrc \
    && echo 'export HISTSIZE=100000' >> /home/claude/.bashrc \
    && echo 'export PS1="%~ > "' >> /home/claude/.bashrc \
    && echo 'alias code="echo \"VS Code not available in container\""' >> /home/claude/.bashrc \
    && echo 'alias python=python3' >> /home/claude/.bashrc \
    && echo 'alias pip=pip3' >> /home/claude/.bashrc \
    && echo 'alias e="pnpm tsx"' >> /home/claude/.bashrc \
    && echo 'alias pn=pnpm' >> /home/claude/.bashrc \
    && echo 'eval "$(direnv hook bash)"' >> /home/claude/.bashrc \
    && echo '' >> /home/claude/.bashrc \
    && echo '# Source host shell functions (including Notify_Jake) if available' >> /home/claude/.bashrc \
    && echo 'if [ -f /home/claude/.host_zshrc ]; then' >> /home/claude/.bashrc \
    && echo '    # Extract and source functions from host zshrc' >> /home/claude/.bashrc \
    && echo '    source /home/claude/.host_zshrc 2>/dev/null || true' >> /home/claude/.bashrc \
    && echo 'fi' >> /home/claude/.bashrc \
    && chown claude:claude /home/claude/.bashrc

# Copy and configure firewall script
COPY init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod +x /usr/local/bin/init-firewall.sh

# Security: Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Initialize firewall if not skipped\n\
if [ "$APM_SKIP_FIREWALL" != "true" ] && [ "$EUID" -eq 0 ]; then\n\
    /usr/local/bin/init-firewall.sh\n\
fi\n\
\n\
# Fix git worktree paths for container environment\n\
if [ -f "/workspace/.git" ] && [ -d "/workspace-main" ]; then\n\
    # Save original .git file if not already saved\n\
    if [ ! -f "/workspace/.git.host" ]; then\n\
        cp /workspace/.git /workspace/.git.host\n\
    fi\n\
    # Check if .git file needs container path\n\
    if ! grep -q "/workspace-main/" "/workspace/.git" 2>/dev/null; then\n\
        # Extract worktree name from current path or environment\n\
        WORKTREE_NAME="${APM_WORKTREE_NAME:-$(basename "/workspace")}" \n\
        # Create container version\n\
        echo "gitdir: /workspace-main/.git/worktrees/$WORKTREE_NAME" > /workspace/.git.container\n\
        cp /workspace/.git.container /workspace/.git\n\
        echo "Fixed git worktree path for container environment: $WORKTREE_NAME" >&2\n\
    fi\n\
fi\n\
# Restore host git on exit\n\
trap 'if [ -f "/workspace/.git.host" ]; then cp /workspace/.git.host /workspace/.git; fi' EXIT\n\
\n\
# Switch to claude user if running as root\n\
if [ "$EUID" -eq 0 ]; then\n\
    exec su claude -c "cd /workspace && claude --dangerously-skip-permissions $*"\n\
else\n\
    exec claude --dangerously-skip-permissions "$@"\n\
fi' > /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

# Set environment variables for multi-agent collaboration
ENV APM_CONTAINERIZED=true \
    APM_PROJECT_ROOT=/workspace \
    APM_MAIN_BRANCH_PATH=/workspace-main \
    APM_WORKTREES_PATH=/workspace-worktrees \
    ALLOWED_DOMAINS="api.anthropic.com,github.com,registry.npmjs.org,githubusercontent.com,objects.githubusercontent.com"

# Switch to restricted user for normal operation
USER claude
WORKDIR /workspace

# Use secure entrypoint with firewall initialization
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]