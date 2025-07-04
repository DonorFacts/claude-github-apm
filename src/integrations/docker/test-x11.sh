#!/bin/bash

# Test X11 Forwarding in Claude Container
# Run this script from the host to test clipboard functionality

set -e

echo "🧪 Testing X11 Forwarding Configuration..."
echo ""

# Check host X11 setup
echo "1. Checking host X11 configuration:"
echo "   DISPLAY: ${DISPLAY:-'(not set)'}"
echo "   X11 socket: $(ls -la /tmp/.X11-unix 2>/dev/null | wc -l) entries"
echo "   Xauthority: ${HOME}/.Xauthority $([ -f "${HOME}/.Xauthority" ] && echo "(exists)" || echo "(missing)")"
echo ""

# Test container rebuild
echo "2. Rebuilding container with X11 support..."
cd "$(dirname "$0")"
if docker build -t apm-claude-container:latest . --quiet; then
    echo "   ✅ Container rebuilt successfully"
else
    echo "   ❌ Container build failed"
    exit 1
fi
echo ""

# Test X11 forwarding
echo "3. Testing X11 forwarding in container..."
if [ -n "$DISPLAY" ] && [ -S "/tmp/.X11-unix" ]; then
    echo "   ✅ X11 appears to be available"
    
    # Test with a simple X11 app
    echo "4. Testing X11 app in container..."
    docker run --rm \
        -e DISPLAY="$DISPLAY" \
        -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
        $([ -f "$HOME/.Xauthority" ] && echo "-v $HOME/.Xauthority:/root/.Xauthority:rw") \
        apm-claude-container:latest \
        bash -c "which xeyes >/dev/null && echo '   ✅ X11 apps available' || echo '   ❌ X11 apps not found'"
    
    echo ""
    echo "5. Testing clipboard utilities..."
    docker run --rm \
        -e DISPLAY="$DISPLAY" \
        -v /tmp/.X11-unix:/tmp/.X11-unix:rw \
        $([ -f "$HOME/.Xauthority" ] && echo "-v $HOME/.Xauthority:/root/.Xauthority:rw") \
        apm-claude-container:latest \
        bash -c "which xclip >/dev/null && echo '   ✅ xclip available' || echo '   ❌ xclip missing'; which xsel >/dev/null && echo '   ✅ xsel available' || echo '   ❌ xsel missing'"
    
else
    echo "   ⚠️  X11 not available on host (DISPLAY: ${DISPLAY:-'unset'}, socket: $([ -S "/tmp/.X11-unix" ] && echo 'exists' || echo 'missing'))"
    echo "   This is normal if you're not running in a GUI environment"
fi

echo ""
echo "🎉 X11 forwarding configuration complete!"
echo ""
echo "To test clipboard pasting:"
echo "1. Take a screenshot (Cmd+Shift+4 on macOS, etc.)"
echo "2. Open Claude Code via your wrapper script"
echo "3. Try Ctrl+V to paste the screenshot"
echo ""
echo "If it doesn't work, check the troubleshooting guide in X11_FORWARDING.md"