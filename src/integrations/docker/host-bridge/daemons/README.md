# Host-Bridge Daemon Architecture

## Overview

The host-bridge daemon is now organized into a modular TypeScript architecture for better maintainability and extensibility.

## Directory Structure

```
daemons/
├── host-bridge-daemon.ts    # Main daemon entry point
├── handlers/                # Service-specific handlers
│   ├── base-handler.ts      # Base handler interface
│   ├── vscode-handler.ts    # VS Code service handler
│   ├── audio-handler.ts     # Audio playback handler
│   ├── speech-handler.ts    # Text-to-speech handler
│   └── index.ts            # Handler exports
└── utils/                   # Utility modules
    ├── logger.ts           # Logging functionality
    └── path-translator.ts  # Container-to-host path translation
```

## Architecture

### Main Daemon (`host-bridge-daemon.ts`)
- Manages daemon lifecycle (PID, signals, cleanup)
- Registers and coordinates service handlers
- Processes request queues for each service
- Handles the main event loop

### Service Handlers (`handlers/`)
Each service has its own handler that:
- Implements the `ServiceHandler` interface
- Handles service-specific requests
- Writes responses to the appropriate response file
- Manages service-specific logic and error handling

### Utilities (`utils/`)
- **Logger**: Centralized logging to console and file
- **PathTranslator**: Translates container paths to host paths

## Adding New Services

To add a new service:

1. Create a new handler in `handlers/`:
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

2. Register the handler in `host-bridge-daemon.ts`:
```typescript
const myHandler = new MyServiceHandler(this.responsesDir, log);
this.handlers.set(myHandler.getServiceName(), myHandler);
```

3. Update the types in `../types.ts` to include your service.

## Benefits

- **Modularity**: Each service is self-contained
- **Maintainability**: Easy to understand and modify individual services
- **Extensibility**: Simple to add new services
- **Type Safety**: Full TypeScript support throughout
- **Testability**: Individual handlers can be unit tested