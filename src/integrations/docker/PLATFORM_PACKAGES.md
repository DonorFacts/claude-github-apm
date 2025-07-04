# Platform-Specific Package Management

## Problem

When running Claude Code in a Docker container on macOS, we encounter platform mismatches with native binaries:
- Host: macOS (darwin-arm64)  
- Container: Linux (linux-arm64)

Packages like `esbuild` install platform-specific binaries that won't work across environments.

## Solution

### Container Startup (Automatic)
The container automatically rebuilds platform-specific packages on startup:
```bash
pnpm rebuild esbuild
```

### Host Side (Manual)
When switching back to host after container usage, run:
```bash
pnpm rebuild:platform
# or directly:
./src/scripts/rebuild-platform-packages.sh
```

## Benefits

✅ **Fast**: Only rebuilds specific packages (~2-3 seconds vs full install ~30+ seconds)
✅ **Bidirectional**: Works both host→container and container→host  
✅ **Targeted**: Only touches packages that actually need platform-specific binaries
✅ **Safe**: Preserves all other dependencies unchanged

## Packages Currently Handled

- `esbuild` - Used for TypeScript compilation and bundling
- More can be added to `REBUILD_PACKAGES` list as needed

## Usage

- Container: Automatic on startup
- Host: `pnpm rebuild:platform` when needed