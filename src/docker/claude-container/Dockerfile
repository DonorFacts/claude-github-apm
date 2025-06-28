FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create user for running claude (avoid root)
RUN useradd -m -s /bin/bash claude

# Set up working directory
WORKDIR /workspace

# Switch to claude user
USER claude

# Set environment variables
ENV APM_CONTAINERIZED=true
ENV APM_PROJECT_ROOT=/workspace

# Default command
CMD ["claude"]