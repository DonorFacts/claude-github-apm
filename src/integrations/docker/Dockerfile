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

# Install Claude Code and development tools globally
RUN npm install -g @anthropic-ai/claude-code pnpm tsx

# Create workspace directory structure
RUN mkdir -p /workspace

# Set working directory (dependencies will be installed at runtime)
WORKDIR /workspace

# Install direnv for automatic environment loading
RUN curl -sfL https://direnv.net/install.sh | bash

# Don't create a specific user - we'll run as the host user
# Copy and run build-time setup scripts
COPY src/integrations/docker/scripts/setup-shell-config.sh \
     src/integrations/docker/scripts/setup-direnv.sh \
     /tmp/setup-scripts/

RUN chmod +x /tmp/setup-scripts/*.sh && \
    for script in /tmp/setup-scripts/*.sh; do \
        echo "🔧 Running build-time script: $(basename "$script")..."; \
        "$script"; \
    done && \
    rm -rf /tmp/setup-scripts

# Make workspace writable by any user
RUN chmod -R 777 /workspace

# Create a generic home directory for any user
RUN mkdir -p /home/user && chmod 777 /home/user

# No firewall configuration needed - container has full network access

# Clipboard bridge functionality removed

# Create simple entrypoint script that calls external setup
RUN echo '#!/bin/bash' > /entrypoint.sh && \
    echo 'set -e' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Run setup scripts in order' >> /entrypoint.sh && \
    echo 'SCRIPTS=(' >> /entrypoint.sh && \
    echo '  "/workspace/main/src/integrations/docker/scripts/install-dependencies.sh"' >> /entrypoint.sh && \
    echo '  "/workspace/main/src/integrations/docker/scripts/setup-git.sh"' >> /entrypoint.sh && \
    echo ')' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo 'for script in "${SCRIPTS[@]}"; do' >> /entrypoint.sh && \
    echo '  echo "🔧 Running $(basename "$script")..."' >> /entrypoint.sh && \
    echo '  "$script"' >> /entrypoint.sh && \
    echo 'done' >> /entrypoint.sh && \
    echo '' >> /entrypoint.sh && \
    echo '# Keep container running' >> /entrypoint.sh && \
    echo 'exec "$@"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

# Set environment variables
ENV APM_CONTAINERIZED=true \
    APM_PROJECT_ROOT=/workspace \
    PNPM_STORE_DIR=/home/user/.pnpm-store \
    HOME=/home/user

# Health check temporarily disabled for reliable rebuilds
# HEALTHCHECK --interval=15s --timeout=10s --retries=5 --start-period=60s \
#   CMD test -d /workspace && echo "Container healthy" || exit 1

WORKDIR /workspace

ENTRYPOINT ["/entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]
