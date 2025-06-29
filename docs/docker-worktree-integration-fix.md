# Docker Worktree Integration Fix

## Problem Summary

When creating git worktrees, the Claude Code Docker container integration was failing with the following issues:

1. **Missing Docker wrapper**: `.local/bin/claude` symlink wasn't available in worktree branches
2. **Incorrect project root detection**: Docker wrapper couldn't find the project structure 
3. **Container mount issues**: Wrong filesystem paths and read-only permission errors
4. **Character encoding issues**: Foreign characters appearing in terminal

## Root Cause Analysis

### Issue 1: Missing Docker Wrapper in Worktrees
- **Problem**: Docker wrapper symlink (`.local/bin/claude`) was created but not committed to git
- **Impact**: New worktree branches didn't include the Docker wrapper
- **Result**: VS Code tasks.json called host Claude instead of containerized Claude

### Issue 2: Project Root Detection Logic
- **Problem**: Docker wrapper searched for `package.json` and `apm/` in each directory
- **Challenge**: Worktrees contain copies of these files, causing false matches
- **Challenge**: Project structure uses `main/` and `worktrees/` subdirectories
- **Result**: Docker wrapper couldn't find the true project root

### Issue 3: Container Mount Configuration
- **Problem**: Persistent container had wrong mount from previous test
- **Problem**: `.claude.json` mounted as read-only, but Claude Code needs write access
- **Result**: Container filesystem didn't match expected paths

## Solution Implementation

### Fix 1: Commit Docker Wrapper to Git
```bash
# Commit the Docker wrapper symlink so it exists in all branches
git add .local/bin/claude
git commit -m "feat: add Docker wrapper symlink for Claude Code containerization"

# Update VS Code tasks.json to use full path
"command": "${workspaceFolder}/.local/bin/claude '@src/prompts/git/worktrees/init-handover.md'"
```

### Fix 2: Enhanced Project Root Detection
```bash
# Two-pass detection logic in claude-container script:

# First pass: Look for main/worktrees structure with validation
while [ "$TEMP_ROOT" != "/" ]; do
    if [ -d "$TEMP_ROOT/main" ] && [ -d "$TEMP_ROOT/worktrees" ] && 
       [ -f "$TEMP_ROOT/main/package.json" ] && [ -d "$TEMP_ROOT/main/apm" ]; then
        FOUND_ROOT="$TEMP_ROOT"
        break
    fi
    TEMP_ROOT=$(dirname "$TEMP_ROOT")
done

# Second pass: Fallback to other valid structures
if [ -z "$FOUND_ROOT" ]; then
    # Look for other project patterns...
fi
```

### Fix 3: Container Mount and Permissions
```bash
# Remove read-only flag from .claude.json mount
-v "$HOME/.claude.json:/home/user/.claude.json" \  # (removed :ro)

# Ensure container is recreated with correct PROJECT_ROOT mount
docker rm -f "$CONTAINER_NAME"  # Force recreation with new mounts
-v "$PROJECT_ROOT:/workspace" \  # Mount true project root
```

## Verification Steps

1. **Create test worktree**: 
   ```bash
   git worktree add "../worktrees/test-branch" "test-branch"
   ```

2. **Open VS Code**: Container should start automatically and mount correctly

3. **Verify working directory**: 
   ```bash
   docker exec apm-workspace pwd
   # Should show: /workspace/worktrees/test-branch
   ```

4. **Verify filesystem access**:
   ```bash
   docker exec apm-workspace ls -la /workspace/
   # Should show both main/ and worktrees/ directories
   ```

## Key Files Modified

- `.local/bin/claude-container`: Enhanced project root detection logic
- `.local/bin/claude`: Symlink committed to git
- `.vscode/tasks.json`: Updated command path to use Docker wrapper

## Testing Results

✅ **Docker container starts correctly**  
✅ **Proper working directory in container**  
✅ **Clean terminal output (no character encoding issues)**  
✅ **Git worktree functionality preserved**  
✅ **VS Code tasks.json works with Docker integration**

## Benefits

1. **Security**: Claude Code runs in isolated Docker container
2. **Consistency**: Same environment across all worktrees  
3. **Portability**: Works across different host environments
4. **Maintainability**: Centralized Docker configuration

## Future Considerations

- Monitor container performance in worktree environments
- Consider container resource limits for large codebases
- Evaluate need for container caching strategies
- Document troubleshooting steps for common Docker issues

---
*Fix implemented: 2025-06-29*  
*Docker integration now fully functional with git worktrees* 🐳