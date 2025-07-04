# Quick Start: Enable Clipboard in Claude Code Docker

## macOS Users - 3 Steps

1. **Install XQuartz** (one-time setup):
   ```bash
   brew install --cask xquartz
   # Then logout/login or restart your Mac
   ```

2. **Start XQuartz**:
   ```bash
   open -a XQuartz
   ```
   
   In XQuartz menu → Preferences → Security:
   - ✅ Check "Allow connections from network clients"

3. **Run Claude Code**:
   ```bash
   cd /path/to/your/project
   APM_DEBUG=true ./src/docker/claude-container/claude-wrapper-enhanced.sh
   ```

## Linux Users - 2 Steps

1. **Allow Docker X11 access**:
   ```bash
   xhost +local:docker
   ```

2. **Run Claude Code**:
   ```bash
   cd /path/to/your/project
   ./src/docker/claude-container/claude-wrapper-enhanced.sh
   ```

## Test It Works

1. Copy an image to your clipboard (screenshot or from browser)
2. In Claude Code, press Ctrl+V
3. The image should paste successfully!

## Troubleshooting

If clipboard doesn't work:
```bash
# Run the test script
./src/docker/claude-container/test-clipboard-complete.sh
```

Common fixes:
- **macOS**: Make sure XQuartz is running (check dock)
- **Linux**: Verify DISPLAY is set: `echo $DISPLAY`
- **Both**: Enable debug mode: `export APM_DEBUG=true`

## Current Container?

Since you're already in a container, you'll need to:
1. Exit the current container
2. Follow the setup above
3. Restart with the enhanced wrapper

The clipboard functionality requires the container to be started with proper X11 configuration, which can't be added to a running container.