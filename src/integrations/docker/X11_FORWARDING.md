# X11 Forwarding for Claude Code Docker Container

## Overview
This container now supports X11 forwarding to enable clipboard access and screenshot pasting in Claude Code when running in Docker.

## Changes Made
1. **Dockerfile updates**: Added `xclip`, `xsel`, and `x11-apps` packages for clipboard support
2. **claude-wrapper.sh updates**: Added X11 forwarding configuration with automatic detection

## How It Works
The wrapper script automatically detects if X11 forwarding is available by checking:
- `$DISPLAY` environment variable is set
- X11 socket `/tmp/.X11-unix` exists
- Optionally mounts `~/.Xauthority` if available

## Docker Flags Added
When X11 is available, these flags are automatically added:
```bash
-e DISPLAY=$DISPLAY
-v /tmp/.X11-unix:/tmp/.X11-unix:rw
-v $HOME/.Xauthority:/root/.Xauthority:rw  # if file exists
```

## Usage
No changes required - the container will automatically enable X11 forwarding when available. You should now be able to:
- Use Ctrl+V to paste screenshots into Claude Code
- Access clipboard functionality from within the container

## Troubleshooting
If clipboard pasting still doesn't work:
1. Verify `$DISPLAY` is set: `echo $DISPLAY`
2. Check X11 socket exists: `ls -la /tmp/.X11-unix`
3. Test X11 forwarding: `xeyes` or `xclock` (if available)
4. Enable debug logging: `APM_DEBUG=true` to see X11 configuration details

## Fallback Options
If X11 forwarding fails, you can still:
- Drag and drop image files into the terminal
- Save screenshots to files and reference by path
- Use file paths: "Analyze this image: /path/to/screenshot.png"