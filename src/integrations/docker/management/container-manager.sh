#!/bin/bash
# Container Management Module
# Handles Docker container lifecycle for APM system

CONTAINER_NAME="apm-workspace"
CONTAINER_IMAGE="apm-claude-container:latest"

# Start container if not already running
start_container() {
    # Check if container exists and is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Starting APM container..."
        
        # Ensure container is stopped if it exists
        docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
        
        # Start new container with bot-only access (no personal git configs)
        docker run -d \
            --name "$CONTAINER_NAME" \
            --restart unless-stopped \
            --user "$(id -u):$(id -g)" \
            -v "$PROJECT_ROOT:/workspace" \
            -v "$HOME/.claude.json:/home/user/.claude.json" \
            -v "$HOME/.claude:/home/user/.claude" \
            -e "HOME=/home/user" \
            -e "APM_CONTAINERIZED=${APM_CONTAINERIZED:-true}" \
            -e "APM_SECURITY_LEVEL=${APM_SECURITY_LEVEL:-standard}" \
            -e "APM_DEBUG=${APM_DEBUG:-false}" \
            -e "GH_TOKEN=${GITHUB_BOT_TOKEN:-$GITHUB_TOKEN}" \
            -e "GITHUB_TOKEN=${GITHUB_BOT_TOKEN:-$GITHUB_TOKEN}" \
            -e "GITHUB_BOT_TOKEN=${GITHUB_BOT_TOKEN}" \
            -e "BOT_GIT_NAME=${BOT_GIT_NAME}" \
            -e "BOT_GIT_EMAIL=${BOT_GIT_EMAIL}" \
            -e "BOT_GIT_USERNAME=${BOT_GIT_USERNAME}" \
            -e "PATH=/workspace/.local/bin:/workspace/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
            "$CONTAINER_IMAGE"
        
        # Wait for container to be ready
        echo "Waiting for container to be healthy..."
        for i in {1..20}; do
            if docker ps --filter "name=$CONTAINER_NAME" --filter "health=healthy" --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
                echo "✅ Container is healthy"
                break
            fi
            sleep 2
        done
    fi
}

# Execute command in container
exec_in_container() {
    # Determine if we need interactive mode
    EXEC_FLAGS=""
    if [ -t 0 ] && [ -t 1 ]; then
        EXEC_FLAGS="-it"
    fi

    # Execute Claude in container
    echo "🐳 Executing Claude Code within Docker container '$CONTAINER_NAME'"
    echo "📁 Working directory: $WORK_DIR"
    echo "👤 Agent role: ${APM_AGENT_ROLE:-developer}"
    echo "🌿 Worktree: $(basename "$PWD")"
    echo ""

    exec docker exec $EXEC_FLAGS \
        -w "$WORK_DIR" \
        -e "APM_AGENT_ROLE=${APM_AGENT_ROLE:-developer}" \
        -e "APM_WORKTREE_NAME=$(basename "$PWD")" \
        -e "PATH=/workspace/.local/bin:/workspace/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
        "$CONTAINER_NAME" \
        /usr/local/bin/claude --dangerously-skip-permissions "$@"
}