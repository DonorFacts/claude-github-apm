#!/bin/bash
# Rebuild platform-specific packages for current environment
# Useful when switching between host (macOS) and container (Linux)

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Rebuilding platform-specific packages...${NC}"

# Detect current platform
PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
    x86_64) ARCH="x64" ;;
    aarch64) ARCH="arm64" ;;
    arm64) ARCH="arm64" ;;
esac

echo -e "${BLUE}Platform: $PLATFORM-$ARCH${NC}"

# List of packages that need platform-specific rebuilds
REBUILD_PACKAGES="esbuild"

# Check if we're in a project with package.json
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️ No package.json found in current directory${NC}"
    exit 1
fi

# Rebuild each package
for pkg in $REBUILD_PACKAGES; do
    if [ -d "node_modules/$pkg" ] || ls node_modules/.pnpm/$pkg* >/dev/null 2>&1; then
        echo -e "${BLUE}  Rebuilding $pkg for $PLATFORM-$ARCH...${NC}"
        if pnpm rebuild "$pkg" 2>/dev/null; then
            echo -e "${GREEN}  ✅ $pkg rebuilt successfully${NC}"
        else
            echo -e "${YELLOW}  ⚠️ Failed to rebuild $pkg${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️ $pkg not found in node_modules${NC}"
    fi
done

echo -e "${GREEN}✅ Platform-specific package rebuild complete${NC}"