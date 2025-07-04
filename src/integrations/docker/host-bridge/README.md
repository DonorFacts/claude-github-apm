# Host-Bridge Communication System

## Overview

The host-bridge system enables Docker containers to interact with host machine services (VS Code, audio, speech) through a unified communication bridge.

## Directory Structure

```
host-bridge/
├── container/           # Code that runs inside Docker container
│   ├── index.ts        # Main exports for container use
│   ├── bridge.ts       # Container-to-host bridge implementation
│   └── cli/            # Container CLI tools
│       ├── notify.ts   # Audio notification (pnpm notify)
│       ├── open-vscode.ts # VS Code opener
│       └── speech.ts   # Speech synthesis (pnpm speak)
├── host/               # Code that runs on host machine
│   ├── daemon.ts       # Main daemon entry point
│   ├── watch-all.ts    # Process manager that starts daemon
│   ├── handlers/       # Service-specific handlers
│   │   ├── base.ts     # Base handler interface
│   │   ├── vscode.ts   # VS Code service handler
│   │   ├── audio.ts    # Audio playback handler
│   │   ├── speech.ts   # Text-to-speech handler
│   │   └── index.ts    # Handler exports
│   └── utils/          # Host-side utilities
│       ├── logger.ts          # Logging functionality
│       ├── path-translator.ts # Container-to-host path translation
│       └── config-manager.ts  # Services configuration
├── shared/             # Shared between container and host
│   └── types.ts        # TypeScript type definitions
└── runtime/            # Runtime files (not in git)
    └── host-bridge/    # Communication queues and logs
```

## Architecture

### Container Side
- Runs inside Docker container
- Uses `HostBridge` class to send requests to host
- Supports both blocking and non-blocking operations
- Provides CLI tools for common operations

### Host Side  
- Runs on host machine as a daemon
- Processes requests from containers
- Modular handler system for each service
- Handles path translation and service execution

#### Host Daemon Architecture

##### Main Daemon (`daemon.ts`)
- Manages daemon lifecycle (PID, signals, cleanup)
- Registers and coordinates service handlers
- Processes request queues for each service
- Handles the main event loop

##### Service Handlers (`handlers/`)
Each service has its own handler that:
- Implements the `ServiceHandler` interface
- Handles service-specific requests
- Writes responses to the appropriate response file
- Manages service-specific logic and error handling

##### Utilities (`utils/`)
- **Logger**: Centralized logging to console and file
- **PathTranslator**: Translates container paths to host paths
- **ConfigManager**: Manages services.json configuration

### Communication
- File-based queue system for reliability
- JSON messages with UUID tracking
- No network dependencies
- Automatic cleanup of processed requests

## Usage

### Starting the System
```bash
# Start the host daemon (on host machine)
npm start

# Or manually:
tsx src/integrations/docker/host-bridge/host/daemon.ts
```

### Container Integration
```typescript
import { hostBridge } from 'src/integrations/docker/host-bridge/container';

// Blocking operations (wait for completion)
await hostBridge.vscode_open('/workspace/main/docs');
await hostBridge.audio_play('Hero.aiff');  
await hostBridge.speech_say('Task completed!');

// Non-blocking operations (fire and forget)
hostBridge.vscode_open_nowait('/workspace/main');
hostBridge.audio_play_nowait('Hero.aiff');
hostBridge.speech_say_nowait('Processing in background...');
```

### CLI Commands
```bash
# Speech synthesis
pnpm speak "Hello from the container"
pnpm speak "Message" --wait  # Wait for completion

# Audio notification
pnpm notify  # Plays Hero.aiff sound

# Open VS Code (used by worktree scripts)
tsx src/integrations/docker/host-bridge/container/cli/open-vscode.ts /path/to/project
```

## Adding New Services

### 1. Define types in `shared/types.ts`
```typescript
export interface MyServicePayload {
  // Define your payload structure
}
```

### 2. Create handler in `host/handlers/`
```typescript
export class MyServiceHandler extends BaseHandler {
  getServiceName(): string {
    return 'myservice';
  }
  
  async handle(request: BridgeRequest): Promise<void> {
    // Service-specific logic
  }
}
```

### 3. Register handler in `host/daemon.ts`
```typescript
const myHandler = new MyServiceHandler(this.responsesDir, log);
this.handlers.set(myHandler.getServiceName(), myHandler);
```

### 4. Add methods to `container/bridge.ts`
```typescript
async myservice_action(params: MyServicePayload): Promise<boolean> {
  // Implementation
}

myservice_action_nowait(params: MyServicePayload): void {
  // Non-blocking version
}
```

### 5. Update ConfigManager default services if needed

## Benefits

- **Clear Separation**: Obvious distinction between container and host code
- **Type Safety**: Full TypeScript support throughout
- **Flexibility**: Both blocking and non-blocking operations
- **Reliability**: File-based communication with no network dependencies
- **Extensibility**: Easy to add new host services
- **Modularity**: Each service is self-contained
- **Maintainability**: Easy to understand and modify individual services
- **Testability**: Individual handlers can be unit tested