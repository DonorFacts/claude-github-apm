# Host-Bridge Communication System

## Overview

Unified container-host communication system that enables Docker containers to interact with host services (VS Code, audio notifications, speech synthesis) through a single daemon with structured messaging.

## Architecture: Unified Host-Bridge System

### Design Principles

1. **Single Daemon**: One unified daemon handles all host services
2. **Structured Messaging**: JSON-based request/response with UUIDs
3. **Service Discovery**: Configuration-driven service management
4. **Type Safety**: TypeScript client with proper interfaces
5. **Scalability**: Easy to add new services (file operations, browser, etc.)

### Implementation

#### Container Side
- TypeScript client library (`src/tools/host-bridge/`) with async/await API
- Structured requests with timeout handling and retries
- Type-safe interfaces for all service payloads

#### Host Side  
- Single unified daemon (`host-bridge-daemon.sh`) handles all services
- JSON message processing with UUID tracking
- Comprehensive logging and error handling

### Technical Architecture

#### Directory Structure
```
.local/host-bridge/
├── requests/           # Outbound requests from container
│   ├── vscode.queue    
│   ├── audio.queue     
│   └── speech.queue    
├── responses/          # Inbound responses from host
│   ├── vscode.response 
│   ├── audio.response  
│   └── speech.response 
├── config/
│   ├── daemon.pid      # Host daemon process tracking
│   └── services.json   # Available host services
└── logs/
    └── bridge.log      # Communication logs
```

#### Message Format
```json
{
  "id": "uuid-v4",
  "service": "vscode|audio|speech",
  "action": "open|play|speak",
  "timestamp": "ISO-8601",
  "payload": {
    "path": "/workspace/...",
    "message": "text to speak",
    "sound": "notification.aiff"
  },
  "timeout": 10000,
  "priority": "high|normal|low"
}
```

#### Container Integration
```typescript
import { hostBridge } from 'src/tools/host-bridge';

// VS Code
await hostBridge.vscode_open('/workspace/main/docs');

// Audio notifications  
await hostBridge.audio_play('Hero.aiff');

// Speech synthesis
await hostBridge.speech_say('Task completed successfully!');
```

### Services

#### VS Code Service
- Opens folders and files on host VS Code
- Handles container-to-host path translation
- Supports worktrees and subdirectories

#### Audio Service
- Plays notification sounds using `afplay`
- Supports system sounds and custom files
- Volume control and error handling

#### Speech Service
- Text-to-speech using macOS `say` command
- Voice selection and rate control
- Handles long messages with appropriate timeouts

### Setup & Usage

#### Starting the System
```bash
# Start unified daemon (replaces all individual daemons)
npm start

# Or manually:
./.local/bin/host-bridge-daemon.sh
```

#### Testing
```bash
# Test all services
pnpm test:bridge

# Send notifications
pnpm notify
```

### Migration from Legacy System

The host-bridge system replaces the previous scattered approach:

**Replaced**:
- ❌ `host-vscode-daemon.sh`
- ❌ `host-sound-daemon.sh` 
- ❌ `host-speech-daemon.sh`
- ❌ Individual `.local/*-queue` files

**New**:
- ✅ `host-bridge-daemon.sh` (unified)
- ✅ Structured `.local/host-bridge/` directory
- ✅ Type-safe TypeScript client
- ✅ Service configuration and discovery

### Benefits

- **Unified Management**: Single daemon instead of multiple processes
- **Better Organization**: Clear directory structure and naming
- **Enhanced Reliability**: UUID tracking, timeouts, retries, logging
- **Type Safety**: Full TypeScript interfaces and error handling
- **Easy Extension**: Add new services without architectural changes
- **Production Ready**: Comprehensive error handling and monitoring