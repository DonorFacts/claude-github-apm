FROM node:20-slim

# Install system dependencies including GitHub CLI and security tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    ca-certificates \
    wget \
    gnupg \
    iptables \
    netbase \
    dnsutils \
    jq \
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
    && chown claude:claude /workspace /workspace-main /workspace-worktrees /tmp/claude-workspace

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