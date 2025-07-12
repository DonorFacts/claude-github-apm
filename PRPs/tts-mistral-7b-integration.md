name: "TTS Mistral 7B Integration PRP v1.0 - Context-Rich with Validation Loops"
description: |

## Purpose

Comprehensive PRP for integrating Mistral 7B-powered Text-to-Speech capabilities alongside existing TTS system, with code consolidation into unified `src/tts/` architecture.

## Core Principles

1. **TypeScript-Only Policy**: No shell scripts, everything in TypeScript with strict typing
2. **TDD Workflow**: Tests first, implementation second, validation loops throughout
3. **Code Consolidation**: Move existing TTS into new unified structure
4. **Dual Commands**: Maintain `pnpm cli speak` + add `pnpm cli speak:mistral7b`
5. **Privacy-First**: Local Ollama processing, no external API calls

---

## Goal

Create a unified TTS system that consolidates existing speech functionality and adds Mistral 7B-powered TTS via Ollama integration, accessible through new CLI command `pnpm cli speak:mistral7b`.

## Why

- **Enhanced TTS Quality**: Mistral 7B provides more natural, contextually-aware speech generation
- **Local Privacy**: All processing happens locally via Ollama, no external API dependencies
- **Code Organization**: Consolidate scattered TTS logic into cohesive `src/tts/` module structure
- **User Choice**: Provide both traditional system TTS and AI-powered alternatives
- **Integration Value**: Leverage existing host-bridge communication patterns for seamless operation

## What

### User-Visible Behavior
- Existing `pnpm cli speak "message"` continues working unchanged
- New `pnpm cli speak:mistral7b "message"` provides Mistral 7B-powered TTS
- Both commands include automatic agent activity tracking
- Graceful fallback when Ollama/Mistral unavailable
- Consistent CLI patterns and error handling

### Technical Requirements
- Unified TTS service architecture in `src/tts/`
- Ollama HTTP API integration for Mistral 7B model
- TypeScript interfaces for provider abstraction
- Comprehensive Jest test coverage (>90%)
- Integration with existing host-bridge communication system
- Configuration management for Ollama endpoints and models

### Success Criteria

- [ ] `pnpm cli speak "test"` works identically to current implementation
- [ ] `pnpm cli speak:mistral7b "test"` successfully generates and plays AI-powered TTS
- [ ] All existing functionality preserved with zero regression
- [ ] 100% TypeScript compliance with strict mode
- [ ] >90% test coverage for all new TTS modules
- [ ] Ollama connectivity validation and graceful error handling
- [ ] Performance benchmarks: <3s for standard messages, <10s for long text
- [ ] Memory usage <100MB for typical TTS operations

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://github.com/ollama/ollama-js
  why: Official Ollama JavaScript client for TypeScript integration
  critical: Use official client for reliability and TypeScript support

- url: https://github.com/apeatling/ollama-voice-mac
  why: Reference implementation showing Ollama + TTS integration patterns
  critical: Study voice pipeline and error handling approaches

- file: src/integrations/docker/host-bridge/container/bridge.ts
  why: Current TTS implementation with host-bridge communication
  critical: Preserve exact communication patterns and error handling

- file: src/cli/agent/speak.ts
  why: Current CLI speak command structure and yargs patterns
  critical: Maintain identical CLI interface and activity tracking

- file: src/cli.ts
  why: Command registration patterns using yargs
  critical: Follow exact registration pattern for new speak:mistral7b command

- url: https://ollama.ai/docs/api
  why: Ollama HTTP API documentation for model interactions
  section: /api/generate endpoint for text generation

- docfile: /workspace/worktrees/feature-413-text-to-speech-mistral-7b-integration/ollama-voice-mac-analysis.md
  why: Comprehensive analysis of ollama-voice-mac implementation patterns and integration approaches
```

### Current Codebase Structure (relevant TTS/CLI parts)

```bash
src/
├── cli.ts                                              # Main CLI entry with yargs
├── cli/
│   └── agent/
│       └── speak.ts                                    # Current speak command
├── integrations/
│   └── docker/
│       └── host-bridge/
│           ├── container/
│           │   ├── bridge.ts                          # HostBridge class with speech methods
│           │   └── cli/
│           │       └── speech.ts                      # Direct speech CLI helper
│           └── shared/
│               └── types.ts                           # TypeScript interfaces
├── sessions/
│   └── management/
│       └── session-file-manager.ts                   # Activity tracking system
└── utilities/
    └── common/                                        # Shared utilities with chalk styling
```

### Desired Codebase Structure (after implementation)

```bash
src/
├── tts/                                               # NEW: Unified TTS module
│   ├── core/
│   │   ├── interfaces.ts                             # TTS provider interfaces
│   │   ├── tts-service.ts                            # Main service orchestrator
│   │   └── audio-utils.ts                            # Common audio processing utilities
│   ├── providers/
│   │   ├── system-tts.ts                             # Migrated host-bridge TTS logic
│   │   └── mistral-tts.ts                            # NEW: Ollama + Mistral integration
│   ├── config/
│   │   └── ollama-config.ts                          # Ollama configuration management
│   ├── cli/
│   │   └── speak-mistral.ts                          # NEW: Mistral CLI command
│   └── __tests__/
│       ├── core/
│       │   ├── interfaces.test.ts
│       │   └── tts-service.test.ts
│       ├── providers/
│       │   ├── system-tts.test.ts
│       │   └── mistral-tts.test.ts
│       └── cli/
│           └── speak-mistral.test.ts
├── cli/
│   └── agent/
│       └── speak.ts                                   # UPDATED: Use new TTS service
└── [existing structure preserved]
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Ollama requires local server running at http://localhost:11434
// Must handle connection failures gracefully and provide clear error messages

// CRITICAL: Host-bridge communication uses file-based queue system
// Preserve exact BridgeRequest/BridgeResponse patterns from existing implementation

// CRITICAL: Session activity tracking is automatically called in speak command
// Must maintain SessionFileManager.updateActivityTimestamps() integration

// GOTCHA: TypeScript strict mode requires proper error handling types
// Use Result<T, E> pattern or explicit error throwing with typed errors

// GOTCHA: Jest tests run in Node environment, not browser
// Mock filesystem operations and external HTTP calls in tests

// CRITICAL: Child process spawning pattern for CLI commands
// Use spawn('tsx', [script, ...args]) pattern from existing speak.ts

// GOTCHA: Ollama models need to be pulled before use
// Handle model availability checks and provide helpful error messages

// CRITICAL: Audio processing may require additional dependencies
// Research Node.js audio libraries that work in containerized environment
```

## Implementation Blueprint

### Data Models and Structure

Create type-safe interfaces for TTS provider abstraction and configuration:

```typescript
// Core TTS interfaces
export interface TTSProvider {
  name: string;
  speak(message: string, options?: TTSOptions): Promise<TTSResult>;
  isAvailable(): Promise<boolean>;
}

export interface TTSOptions {
  voice?: string;
  rate?: number;
  volume?: number;
  language?: string;
}

export interface TTSResult {
  success: boolean;
  duration?: number;
  error?: string;
  audioData?: Buffer;
}

// Ollama-specific types
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  maxTokens?: number;
}

// Error handling types
export class TTSError extends Error {
  constructor(public code: string, message: string, public provider?: string) {
    super(message);
  }
}
```

### List of Tasks (Implementation Order)

```yaml
Task 1 - Foundation & Interfaces:
CREATE src/tts/core/interfaces.ts:
  - DEFINE TTSProvider interface with speak/isAvailable methods
  - DEFINE TTSOptions for voice configuration
  - DEFINE TTSResult for standardized responses
  - DEFINE TTSError class for typed error handling
  - EXPORT all interfaces for provider implementations

CREATE src/tts/__tests__/core/interfaces.test.ts:
  - TEST interface compliance with mock implementations
  - TEST TTSError instantiation and error codes
  - VALIDATE TypeScript strict mode compatibility

Task 2 - Core Service Architecture:
CREATE src/tts/core/tts-service.ts:
  - IMPLEMENT TTSService class as provider orchestrator
  - PATTERN: Registry pattern for multiple TTS providers
  - METHOD: registerProvider(provider: TTSProvider)
  - METHOD: speak(message: string, providerName?: string)
  - ERROR: Graceful fallback between providers
  - INTEGRATION: Activity tracking via SessionFileManager

CREATE src/tts/__tests__/core/tts-service.test.ts:
  - TEST provider registration and selection
  - TEST fallback behavior when primary provider fails
  - TEST activity tracking integration
  - MOCK external dependencies (SessionFileManager, providers)

Task 3 - System TTS Provider Migration:
CREATE src/tts/providers/system-tts.ts:
  - MIGRATE speech logic from src/integrations/docker/host-bridge/container/bridge.ts
  - IMPLEMENT TTSProvider interface
  - PRESERVE exact host-bridge communication patterns
  - METHOD: speech_say() and speech_say_nowait() wrappers
  - ERROR: Maintain existing error handling and logging

CREATE src/tts/__tests__/providers/system-tts.test.ts:
  - TEST TTSProvider interface compliance
  - TEST host-bridge communication mocking
  - TEST error scenarios and fallback behavior
  - VERIFY migration preserves existing functionality

Task 4 - Ollama Configuration Management:
CREATE src/tts/config/ollama-config.ts:
  - DEFINE OllamaConfig interface with validation
  - IMPLEMENT configuration loading from environment variables
  - DEFAULT: baseUrl='http://localhost:11434', model='mistral:7b'
  - VALIDATION: URL format and model name validation
  - ERROR: Clear error messages for configuration issues

Task 5 - Mistral TTS Provider Implementation:
CREATE src/tts/providers/mistral-tts.ts:
  - IMPLEMENT TTSProvider interface for Ollama integration
  - DEPENDENCY: ollama npm package for HTTP client
  - METHOD: isAvailable() - check Ollama server and model
  - METHOD: speak() - generate text via Mistral, convert to speech
  - ERROR: Handle network errors, model unavailable, timeout scenarios
  - PERFORMANCE: Implement request timeout and cancellation

CREATE src/tts/__tests__/providers/mistral-tts.test.ts:
  - TEST Ollama HTTP client integration (mocked)
  - TEST model availability checking
  - TEST text generation and TTS pipeline
  - TEST error scenarios: server down, model missing, timeout
  - VERIFY graceful degradation and error messages

Task 6 - CLI Command Implementation:
CREATE src/tts/cli/speak-mistral.ts:
  - IMPLEMENT yargs command for 'speak:mistral7b'
  - PATTERN: Mirror existing speak.ts structure exactly
  - INTEGRATION: Use TTSService with mistral-tts provider
  - ACTIVITY: Automatic agent activity tracking via updateAgentActivity()
  - ERROR: User-friendly error messages and exit codes

CREATE src/tts/__tests__/cli/speak-mistral.test.ts:
  - TEST CLI argument parsing and validation
  - TEST TTSService integration
  - TEST activity tracking integration
  - TEST error handling and user feedback
  - MOCK external dependencies and subprocess calls

Task 7 - CLI Registration & Integration:
MODIFY src/cli.ts:
  - IMPORT speakMistralCommand from src/tts/cli/speak-mistral.ts
  - REGISTER new command: .command(speakMistralCommand)
  - PRESERVE existing command registration patterns
  - MAINTAIN yargs configuration structure

MODIFY src/cli/agent/speak.ts:
  - REFACTOR to use new TTSService instead of direct host-bridge calls
  - PRESERVE exact CLI interface and behavior
  - MAINTAIN SessionFileManager activity tracking
  - ENSURE zero regression in existing functionality

Task 8 - Package Dependencies:
MODIFY package.json:
  - ADD ollama dependency for HTTP client
  - ADD audio processing dependencies if needed
  - VERIFY compatibility with existing TypeScript version
  - UPDATE scripts if new validation commands needed

Task 9 - Integration Testing:
CREATE integration test scripts in src/tts/__tests__/integration/:
  - TEST end-to-end TTS pipeline with real Ollama server
  - TEST CLI commands in subprocess environment
  - TEST concurrent TTS requests and resource management
  - VALIDATE performance benchmarks and memory usage

Task 10 - Migration & Cleanup:
UPDATE src/integrations/docker/host-bridge/container/bridge.ts:
  - DELEGATE speech methods to new TTSService
  - PRESERVE exact public API for backward compatibility
  - MAINTAIN existing error handling and response patterns
  - MARK old implementation as deprecated with clear migration path
```

### Per-Task Pseudocode

```typescript
// Task 1 - Core Interfaces
export interface TTSProvider {
    // PATTERN: Provider pattern for pluggable TTS implementations
    name: string;
    speak(message: string, options?: TTSOptions): Promise<TTSResult>;
    isAvailable(): Promise<boolean>;
}

// Task 2 - TTS Service
export class TTSService {
    private providers = new Map<string, TTSProvider>();
    
    async speak(message: string, providerName?: string): Promise<TTSResult> {
        // PATTERN: Try preferred provider, fallback to system TTS
        const provider = this.selectProvider(providerName);
        
        try {
            // CRITICAL: Update activity tracking before TTS operation
            await updateAgentActivity();
            
            const result = await provider.speak(message);
            if (!result.success && providerName !== 'system') {
                // FALLBACK: Retry with system TTS if primary fails
                return await this.providers.get('system')!.speak(message);
            }
            return result;
        } catch (error) {
            // PATTERN: Structured error handling with context
            throw new TTSError('SPEAK_FAILED', `TTS operation failed: ${error.message}`, provider.name);
        }
    }
}

// Task 5 - Mistral TTS Provider
export class MistralTTSProvider implements TTSProvider {
    constructor(private config: OllamaConfig) {}
    
    async speak(message: string, options?: TTSOptions): Promise<TTSResult> {
        // STEP 1: Generate enhanced text via Mistral 7B
        const enhancedText = await this.generateEnhancedText(message);
        
        // STEP 2: Convert to speech using system TTS or audio library
        // GOTCHA: May need additional audio processing dependencies
        const audioResult = await this.textToSpeech(enhancedText, options);
        
        return { success: true, duration: audioResult.duration };
    }
    
    private async generateEnhancedText(message: string): Promise<string> {
        // CRITICAL: Use official ollama client for reliability
        const response = await ollama.generate({
            model: this.config.model,
            prompt: `Enhance this text for natural speech: ${message}`,
            stream: false
        });
        
        return response.response;
    }
}

// Task 6 - CLI Command
export function speakMistralCommand(yargs: Argv) {
    return yargs.command(
        'speak:mistral7b <message>',
        'AI-powered speech with Mistral 7B via Ollama',
        (yargs) => {
            return yargs
                .positional('message', { describe: 'Message for AI-enhanced TTS', type: 'string' })
                .example('$0 speak:mistral7b "Hello world"', 'Speak with Mistral enhancement');
        },
        async (argv) => {
            // PATTERN: Mirror exact structure from existing speak.ts
            const message = argv.message as string;
            
            try {
                const ttsService = new TTSService();
                await ttsService.speak(message, 'mistral');
                
                console.log(chalk.green('✓'), 'Speech completed with Mistral 7B');
            } catch (error) {
                // PATTERN: Consistent error styling with chalk
                console.error(chalk.red('✗'), `Mistral TTS error: ${error.message}`);
                process.exit(1);
            }
        }
    );
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - add to package.json: "ollama": "^0.5.0"
  - potential audio libs: "node-record-lpcm16", "speaker" (research needed)
  - maintain existing: tsx, yargs, chalk, jest

CONFIGURATION:
  - environment variables: OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
  - fallback defaults: localhost:11434, mistral:7b, 30000ms
  - config validation on service initialization

CLI_INTEGRATION:
  - preserve: src/cli.ts command registration pattern
  - maintain: yargs configuration and help text formatting  
  - extend: existing speak command to use TTS service internally

HOST_BRIDGE:
  - preserve: BridgeRequest/BridgeResponse communication patterns
  - maintain: speech_say/speech_say_nowait public API
  - delegate: actual TTS work to new unified service
  - backward compatibility: zero breaking changes

ACTIVITY_TRACKING:
  - integrate: SessionFileManager.updateActivityTimestamps
  - preserve: automatic tracking in both speak commands
  - pattern: call before TTS operation, not after
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# CRITICAL: Run these FIRST - fix any errors before proceeding
pnpm ts-check                    # TypeScript strict mode checking
pnpm lint                        # ESLint with project rules
pnpm test -- --coverage         # Jest tests with coverage report

# Expected: No errors, >90% coverage. If errors, READ the error and fix systematically.
# NEVER skip type errors - they indicate architectural issues.
```

### Level 2: Unit Tests (TDD Approach)

```typescript
// CRITICAL: Write tests BEFORE implementation for each module
// Example test structure for TTS service:

describe('TTSService', () => {
  let service: TTSService;
  let mockSystemProvider: jest.Mocked<TTSProvider>;
  let mockMistralProvider: jest.Mocked<TTSProvider>;

  beforeEach(() => {
    // PATTERN: Fresh service instance for each test
    service = new TTSService();
    
    // PATTERN: Mock all external dependencies
    mockSystemProvider = createMockProvider('system');
    mockMistralProvider = createMockProvider('mistral');
    
    service.registerProvider(mockSystemProvider);
    service.registerProvider(mockMistralProvider);
  });

  test('should use mistral provider when specified', async () => {
    mockMistralProvider.speak.mockResolvedValue({ success: true });
    
    await service.speak('test message', 'mistral');
    
    expect(mockMistralProvider.speak).toHaveBeenCalledWith('test message', undefined);
    expect(mockSystemProvider.speak).not.toHaveBeenCalled();
  });

  test('should fallback to system provider on mistral failure', async () => {
    mockMistralProvider.speak.mockRejectedValue(new Error('Ollama offline'));
    mockSystemProvider.speak.mockResolvedValue({ success: true });
    
    const result = await service.speak('test message', 'mistral');
    
    expect(result.success).toBe(true);
    expect(mockSystemProvider.speak).toHaveBeenCalled();
  });
});
```

```bash
# Run tests incrementally:
pnpm test src/tts/__tests__/core/        # Test core interfaces and service
pnpm test src/tts/__tests__/providers/   # Test TTS providers
pnpm test src/tts/__tests__/cli/         # Test CLI integration

# If failing: Read error, understand root cause, fix code, re-run
# NEVER mock away real logic - only external dependencies
```

### Level 3: Integration Tests

```bash
# PREREQUISITE: Start Ollama server locally
ollama serve &
ollama pull mistral:7b

# Test existing speak command (should work unchanged)
pnpm cli speak "Testing existing functionality"
# Expected: Audio output via existing TTS system

# Test new Mistral command
pnpm cli speak:mistral7b "Testing Mistral integration"
# Expected: AI-enhanced audio output via Ollama

# Test Ollama connectivity validation
curl http://localhost:11434/api/tags
# Expected: JSON response with available models including mistral:7b

# Test graceful degradation (stop Ollama, test fallback)
pkill ollama
pnpm cli speak:mistral7b "Should fallback gracefully"
# Expected: Fallback to system TTS with informative warning

# Test concurrent requests
pnpm cli speak "First message" & pnpm cli speak:mistral7b "Second message"
# Expected: Both complete successfully without interference
```

### Level 4: Performance & Creative Validation

```bash
# Performance benchmarking
time pnpm cli speak "Standard message"
time pnpm cli speak:mistral7b "Standard message"
# Expected: Mistral <10s, System <3s for standard messages

# Memory usage monitoring
# Run with memory profiling to ensure <100MB usage
NODE_OPTIONS="--max-old-space-size=256" pnpm cli speak:mistral7b "Memory test"

# Edge case validation
pnpm cli speak:mistral7b ""                           # Empty message
pnpm cli speak:mistral7b "Special chars: @#$%^&*()"  # Special characters
pnpm cli speak:mistral7b "$(printf 'A%.0s' {1..500})" # Long message (500 chars)

# Audio quality validation (manual)
# Generate test files and compare:
pnpm cli speak "The quick brown fox" 
pnpm cli speak:mistral7b "The quick brown fox"
# Manual: Compare naturalness, clarity, speech patterns

# Load testing
for i in {1..10}; do
  pnpm cli speak:mistral7b "Load test message $i" &
done
wait
# Expected: All complete successfully, no resource exhaustion

# Configuration validation
OLLAMA_BASE_URL=invalid pnpm cli speak:mistral7b "Config test"
# Expected: Clear error message about invalid configuration
```

## Final Validation Checklist

- [ ] All tests pass: `pnpm test -- --coverage` (>90% coverage)
- [ ] No type errors: `pnpm ts-check` (strict mode compliant)
- [ ] No linting errors: `pnpm lint` (passes all project rules)
- [ ] Existing speak command unchanged: `pnpm cli speak "test"`
- [ ] New Mistral command works: `pnpm cli speak:mistral7b "test"`
- [ ] Ollama connectivity validated: `curl localhost:11434/api/tags`
- [ ] Graceful fallback on Ollama failure tested
- [ ] Activity tracking preserved in both commands
- [ ] Error messages clear and actionable
- [ ] Performance within benchmarks (<3s system, <10s Mistral)
- [ ] Memory usage reasonable (<100MB)
- [ ] Edge cases handled gracefully
- [ ] Documentation updated if needed

---

## Anti-Patterns to Avoid

- ❌ Don't break existing `pnpm cli speak` functionality - zero regression
- ❌ Don't skip TDD workflow - tests first, implementation second
- ❌ Don't hardcode Ollama URLs - use configuration management
- ❌ Don't ignore connection failures - provide clear error messages
- ❌ Don't bypass activity tracking - maintain SessionFileManager integration
- ❌ Don't create shell scripts - TypeScript only per CLAUDE.md
- ❌ Don't mock real business logic in tests - only external dependencies
- ❌ Don't skip performance validation - TTS must be responsive
- ❌ Don't assume Ollama is always available - graceful degradation required

## Confidence Score

**9/10** - High confidence for one-pass implementation success through:
- ✅ Comprehensive context from existing codebase analysis
- ✅ Reference implementation studied (ollama-voice-mac)
- ✅ Clear migration path preserving existing functionality
- ✅ Detailed validation gates with executable tests
- ✅ TypeScript patterns matching project conventions
- ✅ TDD workflow with specific test requirements
- ✅ Error handling and fallback strategies defined
- ✅ Performance benchmarks and edge cases covered

**Risk Mitigation**: Audio processing dependencies may require research, but fallback to system TTS ensures basic functionality.