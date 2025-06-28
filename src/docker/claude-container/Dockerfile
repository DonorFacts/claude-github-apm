FROM node:20-slim

# Install system dependencies including GitHub CLI
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    ca-certificates \
    wget \
    gnupg \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor > /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create user for running claude (avoid root)
RUN useradd -m -s /bin/bash claude

# Set up working directory
WORKDIR /workspace

# Switch to claude user
USER claude

# Set environment variables for dangerous mode
ENV APM_CONTAINERIZED=true
ENV APM_PROJECT_ROOT=/workspace
ENV CLAUDE_ALLOW_DANGEROUSLY=true

# Default command with dangerous mode enabled
CMD ["claude", "--allow-dangerously"]