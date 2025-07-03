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

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml* /workspace/
WORKDIR /workspace

# Install project dependencies with Linux-specific binaries
# This ensures we get @esbuild/linux-* instead of host platform binaries
RUN pnpm install --frozen-lockfile --prefer-offline

# Install direnv for automatic environment loading
RUN curl -sfL https://direnv.net/install.sh | bash

# Don't create a specific user - we'll run as the host user
# Set up shell configuration that works for any user
RUN echo 'export HISTSIZE=100000' >> /etc/bash.bashrc \
    && echo 'export PATH="/workspace/.local/bin:/workspace/node_modules/.bin:$PATH"' >> /etc/bash.bashrc \
    && echo 'alias python=python3' >> /etc/bash.bashrc \
    && echo 'alias pip=pip3' >> /etc/bash.bashrc \
    && echo 'alias e="pnpm tsx"' >> /etc/bash.bashrc \
    && echo 'alias pn=pnpm' >> /etc/bash.bashrc \
    && echo 'eval "$(direnv hook bash)"' >> /etc/bash.bashrc

# Make workspace writable by any user
RUN chmod -R 777 /workspace

# Create a generic home directory for any user
RUN mkdir -p /home/user && chmod 777 /home/user

# No firewall configuration needed - container has full network access

# Add pre-approve direnv for workspace (in a location any user can access)
RUN mkdir -p /etc/direnv \
    && echo '/workspace' > /etc/direnv/allowed \
    && chmod -R 755 /etc/direnv

# Clipboard bridge functionality removed

# Set environment variables
ENV APM_CONTAINERIZED=true \
    APM_PROJECT_ROOT=/workspace \
    PNPM_STORE_DIR=/home/user/.pnpm-store

# Add health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD test -f /workspace/package.json || exit 1

WORKDIR /workspace

# Keep container running
ENTRYPOINT ["/bin/bash", "-c", "tail -f /dev/null"]
