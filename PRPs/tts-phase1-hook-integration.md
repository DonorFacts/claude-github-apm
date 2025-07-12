name: "TTS Phase 1: Hook Integration & Enhanced Current System PRP v1.0"
description: |

## Purpose

Comprehensive PRP for implementing Phase 1 of TTS evolution: Claude Code hook integration for automatic speech updates, voice configuration system, and enhanced Mistral intelligence with content-aware prompts.

## Core Principles

1. **TypeScript-Only Policy**: No shell scripts, everything in TypeScript with strict typing
2. **TDD Workflow**: Tests first, implementation second, validation loops throughout  
3. **Zero Regression**: Maintain existing TTS functionality while adding enhancements
4. **Hook Integration**: Seamless Claude Code workflow integration for automatic speech
5. **Configuration-Driven**: User-controllable voice settings via JSON configuration

---

## Goal

Transform the manual TTS system into an intelligent, automated speech system that integrates with Claude Code workflows, providing natural speech summaries of technical agent output with user-configurable voice settings and content-aware prompts.

## Why

- **Workflow Automation**: Eliminate manual CLI commands, enable automatic speech on agent events
- **Accessibility**: Complex technical information becomes audible without user intervention
- **Context Awareness**: AI understands content type and adapts speech accordingly
- **User Control**: Configuration-driven voice selection and behavior customization
- **Dual Modality**: Visual technical details + coordinated natural speech summaries
- **Premium Voice Support**: Leverage high-quality macOS voices when available

## What

### User-Visible Behavior
- Claude Code agents automatically trigger speech summaries on task completion
- Different voices for different content types (success/error/progress/info)
- `.apm-voice-settings.json` configuration for voice preferences
- Intelligent content summarization based on technical complexity
- Graceful degradation when premium voices unavailable
- Manual commands (`speak`/`speak:mistral7b`) continue working unchanged

### Technical Requirements
- Hook system integration for automatic TTS triggers
- Voice settings configuration loader and validator
- Content analysis pipeline for intelligent routing
- Enhanced Mistral prompts with context awareness
- Premium voice detection and optimization
- Project context integration for smarter summaries

### Success Criteria

- [ ] Agent task completion automatically triggers speech summaries
- [ ] `.apm-voice-settings.json` controls voice behavior and selection
- [ ] Different voices used for success/error/progress events
- [ ] Technical content intelligently summarized for speech
- [ ] Premium macOS voices detected and utilized when available
- [ ] Existing CLI commands continue working with zero regression
- [ ] >90% test coverage for all new hook and configuration modules
- [ ] Performance: <3s latency for hook-triggered speech

## All Needed Context

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- file: src/sessions/hooks/activity-tracker.ts
  why: Existing hook infrastructure for activity tracking
  critical: Follow exact patterns for session integration

- file: src/sessions/hooks/claude-code-integration.ts
  why: Agent communication and TodoWrite hook patterns
  critical: Understand event flow and data structures

- file: src/sessions/hooks/todo-integration.ts
  why: Task completion tracking patterns
  critical: Hook integration points for TTS triggers

- file: src/tts/core/tts-service.ts
  why: Core TTS service with provider orchestration
  critical: Extend without breaking existing functionality

- file: src/integrations/docker/host-bridge/host/utils/config-manager.ts
  why: Configuration loading patterns in codebase
  critical: Follow same JSON config approach for voice settings

- file: docs/planning/tts.md
  why: Comprehensive planning document with Phase 1 requirements
  section: Phase 1 Target Architecture and Voice Settings Configuration

- url: https://developer.apple.com/documentation/appkit/nsspeechsynthesizer
  why: macOS speech synthesizer documentation for voice capabilities
  section: Available voices and voice attributes

- url: https://ollama.ai/docs/api#generate
  why: Ollama API for enhanced prompt engineering
  critical: Streaming vs non-streaming for performance

- file: src/cli/agent/speak.ts
  why: Current CLI implementation with activity tracking
  critical: Preserve exact behavior while adding hook integration
```

### Current Codebase Structure (relevant parts)

```bash
src/
├── sessions/
│   ├── hooks/
│   │   ├── activity-tracker.ts          # Activity tracking infrastructure
│   │   ├── claude-code-integration.ts   # Agent event hooks
│   │   └── todo-integration.ts          # Task completion hooks
│   └── management/
│       └── session-file-manager.ts      # Session data management
├── tts/
│   ├── core/
│   │   ├── interfaces.ts                # TTSProvider interfaces
│   │   └── tts-service.ts               # Provider orchestration
│   ├── providers/
│   │   ├── system-tts.ts                # Host-bridge TTS
│   │   └── mistral-tts.ts               # AI-enhanced TTS
│   ├── config/
│   │   └── ollama-config.ts             # Ollama configuration
│   └── cli/
│       └── speak-mistral.ts             # CLI command
└── integrations/
    └── docker/
        └── host-bridge/
            ├── container/
            │   └── bridge.ts            # Host communication
            └── host/
                └── utils/
                    └── config-manager.ts # Config patterns
```

### Desired Codebase Structure (after Phase 1)

```bash
src/
├── sessions/
│   └── hooks/
│       └── tts-integration.ts           # NEW: TTS hook integration
├── tts/
│   ├── core/
│   │   ├── interfaces.ts                # UPDATED: Add content analysis types
│   │   ├── tts-service.ts               # UPDATED: Hook integration support
│   │   └── content-analyzer.ts          # NEW: Content type detection
│   ├── config/
│   │   ├── ollama-config.ts             # Existing
│   │   └── voice-settings.ts            # NEW: Voice configuration management
│   ├── providers/
│   │   ├── system-tts.ts                # UPDATED: Premium voice detection
│   │   └── mistral-tts.ts               # UPDATED: Context-aware prompts
│   └── hooks/
│       └── hook-handler.ts              # NEW: TTS hook event handler
├── config/
│   └── schemas/
│       └── voice-settings-schema.ts     # NEW: Zod schema for validation
└── [project root]/
    └── .apm-voice-settings.json         # NEW: User configuration file
```

### Known Gotchas & Library Quirks

```typescript
// CRITICAL: Hook execution happens in agent context, not user context
// Must handle async operations without blocking agent response

// CRITICAL: Session ID available via process.env.APM_SESSION_ID
// May be undefined in some contexts - always check before use

// GOTCHA: macOS premium voices have different naming conventions
// "Samantha (Enhanced)" vs "Samantha" - must normalize for comparison

// CRITICAL: File watchers for .apm-voice-settings.json can cause issues
// Use caching with TTL instead of constant file reads

// GOTCHA: Mistral context window limitations
// Keep prompts concise, include only essential context

// CRITICAL: Activity tracking already happens in speak commands
// Avoid double-tracking when called from hooks

// GOTCHA: TypeScript strict mode requires explicit error types
// Use discriminated unions for content analysis results

// CRITICAL: Hook timing - speech should not delay agent responses
// Use fire-and-forget pattern with error logging

// GOTCHA: Some macOS voices require download from System Settings
// Provide helpful error messages guiding users to download
```

## Implementation Blueprint

### Data Models and Structure

Create type-safe interfaces for voice configuration and content analysis:

```typescript
// Voice settings configuration schema
export interface VoiceSettings {
  defaultVoice: string;
  voiceSettings: {
    rate: number;         // 90-720 words per minute
    volume: number;       // 0.0-1.0
    pitch?: number;       // Voice-specific pitch adjustment
  };
  contextualVoices: {
    success: string;      // Task completion voice
    error: string;        // Error notification voice
    info: string;         // Information updates
    progress: string;     // Progress updates
    completion: string;   // Session/workflow completion
  };
  mistralSettings: {
    enableForHooks: boolean;
    summarizationPrompts: {
      code: string;       // Code change summaries
      error: string;      // Error explanations
      progress: string;   // Progress updates
      completion: string; // Task completions
    };
    contextDepth: 'minimal' | 'moderate' | 'full';
    maxTokens?: number;
  };
  hookIntegration: {
    enableAutoSpeech: boolean;
    speakOnTaskCompletion: boolean;
    speakOnErrors: boolean;
    speakOnProgress: 'all' | 'major_only' | 'none';
    debounceMs: number;   // Prevent speech spam
  };
  premiumVoicesDetected?: string[];  // Auto-populated
}

// Content analysis types
export interface ContentAnalysis {
  contentType: 'code' | 'error' | 'progress' | 'completion' | 'info';
  complexity: 'simple' | 'technical' | 'complex';
  priority: 'low' | 'medium' | 'high';
  technicalElements: {
    filePaths: string[];
    codeSnippets: string[];
    errorMessages: string[];
    metrics: Record<string, number>;
  };
  suggestedProvider: 'system' | 'mistral';
  suggestedVoice?: string;
}

// Hook event types
export interface TTSHookEvent {
  type: 'agent_response' | 'task_completion' | 'error' | 'progress';
  content: string;
  metadata: {
    sessionId: string;
    timestamp: number;
    agentRole?: string;
    taskId?: string;
    priority?: 'low' | 'medium' | 'high';
  };
  context?: {
    recentActivity: string[];
    currentBranch?: string;
    activeFiles?: string[];
  };
}
```

### List of Tasks (Implementation Order)

```yaml
Task 1 - Voice Settings Schema & Validation:
CREATE src/config/schemas/voice-settings-schema.ts:
  - DEFINE Zod schema for VoiceSettings interface
  - IMPLEMENT validation with helpful error messages
  - INCLUDE default values for missing fields
  - EXPORT typed parse function with error handling
  
CREATE src/tts/config/voice-settings.ts:
  - IMPLEMENT VoiceSettingsManager class
  - METHOD loadSettings() with file reading and validation
  - METHOD saveSettings() for programmatic updates
  - CACHE settings with 30-second TTL
  - PATTERN follow ConfigManager from host-bridge
  - ERROR clear messages for invalid configuration

CREATE src/tts/__tests__/config/voice-settings.test.ts:
  - TEST schema validation with valid/invalid configs
  - TEST file loading with missing file handling
  - TEST caching behavior and TTL expiration
  - TEST default value application
  - MOCK file system operations

Task 2 - Content Analysis Pipeline:
CREATE src/tts/core/content-analyzer.ts:
  - IMPLEMENT ContentAnalyzer class
  - METHOD analyzeContent(text: string): ContentAnalysis
  - PATTERN detect file paths with regex
  - PATTERN identify error messages and stack traces
  - PATTERN extract code snippets and technical terms
  - METHOD determineComplexity() based on technical density
  - METHOD suggestProvider() based on complexity
  - INTEGRATION with voice settings for voice selection

CREATE src/tts/__tests__/core/content-analyzer.test.ts:
  - TEST content type detection accuracy
  - TEST complexity scoring algorithm
  - TEST provider suggestions for various content
  - TEST technical element extraction
  - EXAMPLES real Claude agent outputs

Task 3 - TTS Hook Infrastructure:
CREATE src/sessions/hooks/tts-integration.ts:
  - IMPLEMENT TTSHookIntegration class
  - PATTERN follow activity-tracker.ts structure
  - METHOD onAgentResponse(event: TTSHookEvent)
  - METHOD onTaskCompletion(event: TTSHookEvent)
  - METHOD onError(event: TTSHookEvent)
  - METHOD onProgress(event: TTSHookEvent)
  - INTEGRATION with existing ActivityTracker
  - DEBOUNCE rapid events to prevent speech spam
  - ASYNC fire-and-forget pattern for non-blocking

CREATE src/tts/hooks/hook-handler.ts:
  - IMPLEMENT HookHandler class
  - METHOD handleHookEvent(event: TTSHookEvent)
  - LOAD voice settings on initialization
  - ANALYZE content using ContentAnalyzer
  - ROUTE to appropriate TTS provider
  - SELECT voice based on content type
  - BUILD context for Mistral prompts
  - ERROR logging without throwing

CREATE src/tts/__tests__/hooks/hook-handler.test.ts:
  - TEST event routing logic
  - TEST voice selection based on content
  - TEST Mistral vs system TTS decisions
  - TEST error handling and logging
  - MOCK TTS providers and settings

Task 4 - Enhanced Mistral Prompts:
MODIFY src/tts/providers/mistral-tts.ts:
  - ADD contextual prompt generation
  - METHOD createContextualPrompt(message, context, promptType)
  - ENHANCE prompt templates for each content type
  - INCLUDE session context in prompts
  - IMPLEMENT token limit management
  - PRESERVE existing functionality

CREATE src/tts/providers/prompt-templates.ts:
  - DEFINE prompt templates for each content type
  - TEMPLATE code_summary: focus on what changed
  - TEMPLATE error_explanation: simplify technical errors
  - TEMPLATE progress_update: highlight completion percentage
  - TEMPLATE task_completion: celebrate achievement
  - PATTERN use placeholders for dynamic content

UPDATE src/tts/__tests__/providers/mistral-tts.test.ts:
  - TEST contextual prompt generation
  - TEST token limit handling
  - TEST prompt template selection
  - VERIFY enhanced text quality

Task 5 - Premium Voice Detection:
MODIFY src/tts/providers/system-tts.ts:
  - ADD detectAvailableVoices() method
  - PATTERN parse 'say -v ?' command output
  - IDENTIFY enhanced voices by naming pattern
  - CACHE voice list for 5 minutes
  - METHOD normalizeVoiceName() for comparisons
  - RETURN structured voice information

CREATE src/tts/providers/voice-detector.ts:
  - IMPLEMENT VoiceDetector utility class
  - METHOD getSystemVoices(): Promise<VoiceInfo[]>
  - PARSE voice attributes (language, quality, gender)
  - RANK voices by quality (premium > enhanced > standard)
  - EXPORT voice recommendation logic

UPDATE src/tts/__tests__/providers/system-tts.test.ts:
  - TEST voice detection parsing
  - TEST premium voice identification
  - TEST voice normalization
  - MOCK command output

Task 6 - Hook Integration with Claude Code:
MODIFY src/sessions/hooks/claude-code-integration.ts:
  - IMPORT TTSHookIntegration
  - ADD TTS triggers to existing hooks
  - CALL onTaskCompletion for completed todos
  - CALL onAgentResponse after responses
  - PRESERVE existing functionality
  - PATTERN non-blocking async calls

UPDATE src/tts/core/tts-service.ts:
  - ADD hookMode flag to prevent double tracking
  - METHOD speakFromHook() with special handling
  - SKIP activity tracking when called from hooks
  - MAINTAIN backward compatibility

Task 7 - Settings File Integration:
CREATE scripts/init-voice-settings.ts:
  - SCRIPT to create default .apm-voice-settings.json
  - DETECT available system voices
  - POPULATE premium voices if found
  - SET sensible defaults
  - PRETTY print JSON output

UPDATE src/cli.ts:
  - ADD command 'tts:init-settings'
  - ADD command 'tts:list-voices'
  - PATTERN follow existing command structure
  - HELP text with examples

Task 8 - Integration Testing:
CREATE src/tts/__tests__/integration/hook-integration.test.ts:
  - TEST end-to-end hook flow
  - SIMULATE agent events
  - VERIFY TTS triggered correctly
  - TEST settings application
  - TEST voice selection logic

CREATE src/tts/__tests__/integration/settings-integration.test.ts:
  - TEST settings file loading
  - TEST voice detection integration
  - TEST configuration validation
  - TEST runtime updates

Task 9 - Documentation Updates:
UPDATE docs/planning/tts.md:
  - DOCUMENT Phase 1 completion
  - ADD configuration examples
  - EXPLAIN hook integration points
  - PROVIDE troubleshooting guide

CREATE docs/features/tts-configuration.md:
  - DOCUMENT .apm-voice-settings.json schema
  - EXAMPLES for common configurations
  - GUIDE for premium voice setup
  - TROUBLESHOOTING section
```

### Per-Task Pseudocode

```typescript
// Task 1 - Voice Settings Schema
import { z } from 'zod';

const VoiceSettingsSchema = z.object({
  defaultVoice: z.string().default('Samantha'),
  voiceSettings: z.object({
    rate: z.number().min(90).max(720).default(200),
    volume: z.number().min(0).max(1).default(0.8),
    pitch: z.number().optional()
  }),
  contextualVoices: z.object({
    success: z.string(),
    error: z.string(),
    info: z.string(),
    progress: z.string(),
    completion: z.string()
  }).default({
    success: 'Samantha',
    error: 'Daniel',
    info: 'Victoria',
    progress: 'Alex',
    completion: 'Samantha'
  }),
  // ... continue schema definition
});

// Task 2 - Content Analyzer
export class ContentAnalyzer {
  analyzeContent(text: string): ContentAnalysis {
    // PATTERN: Check for common technical patterns
    const hasFilePaths = /\b[\w\-]+\.(ts|js|tsx|jsx|md)\b/.test(text);
    const hasErrors = /error|exception|failed|issue/i.test(text);
    const hasCode = /function|class|const|let|var|=>/.test(text);
    
    // DETERMINE content type
    let contentType: ContentAnalysis['contentType'] = 'info';
    if (hasErrors) contentType = 'error';
    else if (text.includes('completed') || text.includes('finished')) contentType = 'completion';
    else if (text.includes('%') || text.includes('progress')) contentType = 'progress';
    else if (hasCode || hasFilePaths) contentType = 'code';
    
    // CALCULATE complexity
    const technicalDensity = this.calculateTechnicalDensity(text);
    const complexity = technicalDensity > 0.6 ? 'complex' : 
                      technicalDensity > 0.3 ? 'technical' : 'simple';
    
    // SUGGEST provider based on complexity
    const suggestedProvider = complexity !== 'simple' ? 'mistral' : 'system';
    
    return {
      contentType,
      complexity,
      priority: this.determinePriority(contentType),
      technicalElements: this.extractTechnicalElements(text),
      suggestedProvider
    };
  }
}

// Task 3 - Hook Handler
export class HookHandler {
  private ttsService: TTSService;
  private contentAnalyzer: ContentAnalyzer;
  private settingsManager: VoiceSettingsManager;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  async handleHookEvent(event: TTSHookEvent): Promise<void> {
    try {
      // DEBOUNCE rapid events
      const debounceKey = `${event.type}-${event.metadata.sessionId}`;
      if (this.debounceTimers.has(debounceKey)) {
        clearTimeout(this.debounceTimers.get(debounceKey)!);
      }
      
      // LOAD settings (cached)
      const settings = await this.settingsManager.loadSettings();
      if (!settings.hookIntegration.enableAutoSpeech) return;
      
      // CHECK event type settings
      if (event.type === 'error' && !settings.hookIntegration.speakOnErrors) return;
      if (event.type === 'task_completion' && !settings.hookIntegration.speakOnTaskCompletion) return;
      
      // ANALYZE content
      const analysis = this.contentAnalyzer.analyzeContent(event.content);
      
      // SELECT voice based on content type
      const voice = settings.contextualVoices[analysis.contentType] || settings.defaultVoice;
      
      // DETERMINE provider
      const provider = settings.mistralSettings.enableForHooks && 
                      analysis.suggestedProvider === 'mistral' ? 'mistral' : 'system';
      
      // BUILD enhanced message if using Mistral
      const message = provider === 'mistral' ? 
        await this.buildEnhancedMessage(event, analysis, settings) : 
        event.content;
      
      // SPEAK with fire-and-forget pattern
      this.debounceTimers.set(debounceKey, setTimeout(async () => {
        await this.ttsService.speakFromHook(message, provider, { voice });
        this.debounceTimers.delete(debounceKey);
      }, settings.hookIntegration.debounceMs || 500));
      
    } catch (error) {
      // LOG but don't throw - hooks should not break agent flow
      console.error('[TTS Hook Error]:', error);
    }
  }
}

// Task 4 - Enhanced Mistral Prompts
function createContextualPrompt(
  message: string, 
  context: TTSHookEvent['context'],
  promptType: keyof VoiceSettings['mistralSettings']['summarizationPrompts']
): string {
  const templates = {
    code: `You are a helpful coding assistant providing voice summaries. Convert this technical update into natural speech:

Technical Update: ${message}
${context ? `Current Branch: ${context.currentBranch}` : ''}
${context?.activeFiles ? `Files: ${context.activeFiles.slice(0, 3).join(', ')}` : ''}

Provide a brief, natural summary focusing on what was accomplished. Keep it under 2 sentences.`,
    
    error: `Explain this technical error in simple, friendly terms for voice output:

Error: ${message}

Provide a clear, non-technical explanation of what went wrong and suggest a direction for fixing it.`,
    
    completion: `Celebrate this task completion with natural, encouraging speech:

Completed: ${message}

Express this achievement in a positive, conversational way suitable for voice output.`
  };
  
  return templates[promptType] || templates.code;
}

// Task 5 - Premium Voice Detection
export class VoiceDetector {
  async getSystemVoices(): Promise<VoiceInfo[]> {
    // EXECUTE say -v ? command
    const { stdout } = await execAsync('say -v ?');
    
    // PARSE output format: "Samantha  en_US    # Most people recognize me by my voice."
    const voices = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^(\S+)\s+(\S+)\s+#\s*(.*)$/);
        if (!match) return null;
        
        const [, name, locale, description] = match;
        const isEnhanced = name.includes('(Enhanced)') || 
                          description.toLowerCase().includes('premium');
        
        return {
          name: name.trim(),
          locale: locale.trim(),
          description: description.trim(),
          quality: isEnhanced ? 'premium' : 'standard',
          normalizedName: name.replace(/\s*\(Enhanced\)\s*/, '')
        };
      })
      .filter(Boolean) as VoiceInfo[];
    
    // SORT by quality
    return voices.sort((a, b) => 
      a.quality === 'premium' && b.quality !== 'premium' ? -1 : 
      a.quality !== 'premium' && b.quality === 'premium' ? 1 : 0
    );
  }
}
```

### Integration Points

```yaml
DEPENDENCIES:
  - add to package.json: "zod": "^3.22.0" for schema validation
  - existing: ollama, typescript, jest, yargs

CONFIGURATION:
  - file: .apm-voice-settings.json in project root
  - auto-creation: via 'pnpm cli tts:init-settings' command
  - hot-reload: settings cached with 30s TTL

HOOK_INTEGRATION:
  - entry: src/sessions/hooks/claude-code-integration.ts
  - triggers: onAgentResponseComplete(), hookTodoWrite()
  - pattern: fire-and-forget async calls to avoid blocking

ACTIVITY_TRACKING:
  - preserve: existing tracking in CLI commands
  - skip: tracking when called from hooks (hookMode flag)
  - maintain: session ID propagation

VOICE_DETECTION:
  - command: 'say -v ?' for macOS voice list
  - caching: 5-minute TTL for performance
  - fallback: graceful handling when detection fails

ERROR_HANDLING:
  - hooks: log errors, never throw
  - settings: provide defaults for missing values
  - voices: fallback to system default if unavailable
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# CRITICAL: Run these FIRST - fix any errors before proceeding
pnpm ts-check                    # TypeScript strict mode checking
pnpm lint                        # ESLint with project rules
pnpm test -- --coverage          # Jest tests with coverage report

# Expected: No errors, >90% coverage for new modules
# If errors: READ the error carefully and fix systematically
```

### Level 2: Unit Tests (TDD Approach)

```typescript
// Test voice settings validation
describe('VoiceSettingsManager', () => {
  test('should load valid settings file', async () => {
    const manager = new VoiceSettingsManager();
    const settings = await manager.loadSettings();
    
    expect(settings.defaultVoice).toBeDefined();
    expect(settings.voiceSettings.rate).toBeGreaterThanOrEqual(90);
    expect(settings.voiceSettings.rate).toBeLessThanOrEqual(720);
  });
  
  test('should apply defaults for missing fields', async () => {
    mockFs.readFileSync.mockReturnValue('{}');
    
    const settings = await manager.loadSettings();
    
    expect(settings.defaultVoice).toBe('Samantha');
    expect(settings.voiceSettings.rate).toBe(200);
  });
  
  test('should cache settings with TTL', async () => {
    const manager = new VoiceSettingsManager();
    
    await manager.loadSettings();
    mockFs.readFileSync.mockClear();
    
    await manager.loadSettings(); // Should use cache
    expect(mockFs.readFileSync).not.toHaveBeenCalled();
    
    // Fast-forward past TTL
    jest.advanceTimersByTime(31000);
    
    await manager.loadSettings(); // Should reload
    expect(mockFs.readFileSync).toHaveBeenCalled();
  });
});

// Test content analysis
describe('ContentAnalyzer', () => {
  const analyzer = new ContentAnalyzer();
  
  test('should identify code content', () => {
    const result = analyzer.analyzeContent(
      'Fixed authentication bug in src/auth/login.ts:42 by updating JWT validation'
    );
    
    expect(result.contentType).toBe('code');
    expect(result.complexity).toBe('technical');
    expect(result.suggestedProvider).toBe('mistral');
    expect(result.technicalElements.filePaths).toContain('src/auth/login.ts');
  });
  
  test('should identify error content', () => {
    const result = analyzer.analyzeContent(
      'TypeError: Cannot read property username of undefined in Login.tsx'
    );
    
    expect(result.contentType).toBe('error');
    expect(result.priority).toBe('high');
  });
});
```

```bash
# Run tests incrementally
pnpm test src/tts/__tests__/config/         # Test configuration modules
pnpm test src/tts/__tests__/core/           # Test content analysis
pnpm test src/tts/__tests__/hooks/          # Test hook integration

# If failing: Understand root cause, fix implementation, re-run
```

### Level 3: Integration Tests

```bash
# Initialize voice settings
pnpm cli tts:init-settings
# Expected: .apm-voice-settings.json created with detected voices

# List available voices
pnpm cli tts:list-voices
# Expected: Table showing standard and premium voices

# Test existing commands still work
pnpm cli speak "Testing backwards compatibility"
pnpm cli speak:mistral7b "Testing Mistral integration"
# Expected: Both commands work as before

# Test hook integration (simulate agent event)
cat > test-hook-event.ts << 'EOF'
import { TTSHookIntegration } from './src/sessions/hooks/tts-integration';

const hook = new TTSHookIntegration();
await hook.onTaskCompletion({
  type: 'task_completion',
  content: 'Successfully implemented authentication middleware with JWT validation',
  metadata: {
    sessionId: 'test-session',
    timestamp: Date.now()
  }
});
EOF

tsx test-hook-event.ts
# Expected: Speech output with appropriate voice and summary

# Test configuration changes
# Edit .apm-voice-settings.json, change defaultVoice
pnpm cli speak "Testing new voice configuration"
# Expected: Uses newly configured voice

# Test error handling with missing Ollama
pkill ollama  # Stop Ollama if running
pnpm cli speak:mistral7b "Should fallback gracefully"
# Expected: Falls back to system TTS with warning
```

### Level 4: Performance & Creative Validation

```bash
# Performance testing
time pnpm cli speak "Performance test for system TTS"
time pnpm cli speak:mistral7b "Performance test for Mistral TTS"
# Expected: System <3s, Mistral <10s (including enhancement)

# Stress test hook debouncing
for i in {1..10}; do
  echo "Rapid event $i" | tsx -e "
    import { TTSHookIntegration } from './src/sessions/hooks/tts-integration';
    const hook = new TTSHookIntegration();
    hook.onProgress({ 
      type: 'progress', 
      content: process.stdin.toString(),
      metadata: { sessionId: 'test', timestamp: Date.now() }
    });
  " &
done
wait
# Expected: Debouncing prevents speech spam, only last event spoken

# Voice quality validation
# Create test script comparing voices
cat > compare-voices.ts << 'EOF'
import { VoiceDetector } from './src/tts/providers/voice-detector';

const detector = new VoiceDetector();
const voices = await detector.getSystemVoices();

console.log('Available voices:');
voices.forEach(v => {
  console.log(`${v.name} (${v.quality}): ${v.description}`);
});

// Test each premium voice
for (const voice of voices.filter(v => v.quality === 'premium')) {
  console.log(`\nTesting ${voice.name}...`);
  await exec(`say -v "${voice.name}" "Testing premium voice quality"`);
  await new Promise(r => setTimeout(r, 2000));
}
EOF

tsx compare-voices.ts
# Expected: Premium voices sound noticeably better

# Configuration validation
# Test invalid configuration handling
echo '{"voiceSettings": {"rate": 9999}}' > .apm-voice-settings.json
pnpm cli speak "Testing invalid config"
# Expected: Validation error with helpful message

# Memory usage monitoring
NODE_OPTIONS="--max-old-space-size=256" pnpm cli speak:mistral7b "Memory test"
# Expected: Completes successfully within memory limit

# Real-world scenario testing
# Simulate actual Claude Code workflow
cat > simulate-workflow.ts << 'EOF'
import { TTSHookIntegration } from './src/sessions/hooks/tts-integration';

const hook = new TTSHookIntegration();
const events = [
  { type: 'progress', content: 'Starting authentication middleware implementation' },
  { type: 'progress', content: 'Created src/auth/middleware.ts with JWT validation logic' },
  { type: 'error', content: 'TypeScript error: Property "exp" does not exist on type "JWTPayload"' },
  { type: 'progress', content: 'Fixed type error by updating JWT interface' },
  { type: 'task_completion', content: 'Completed authentication middleware with full test coverage' }
];

for (const event of events) {
  await hook.onHookEvent({
    ...event,
    metadata: { sessionId: 'workflow-test', timestamp: Date.now() }
  });
  await new Promise(r => setTimeout(r, 3000));
}
EOF

tsx simulate-workflow.ts
# Expected: Natural speech flow with appropriate voices for each event type
```

## Final Validation Checklist

- [ ] All tests pass: `pnpm test -- --coverage` (>90% for new code)
- [ ] No type errors: `pnpm ts-check` (strict mode compliant)
- [ ] No linting errors: `pnpm lint` (follows project conventions)
- [ ] Voice settings file created: `.apm-voice-settings.json` exists
- [ ] Premium voices detected: `pnpm cli tts:list-voices` shows enhanced voices
- [ ] Hook integration works: Agent events trigger automatic speech
- [ ] Content analysis accurate: Technical content routed to Mistral
- [ ] Voice selection works: Different voices for different content types
- [ ] Settings hot-reload: Changes apply without restart
- [ ] Performance acceptable: <3s for hook-triggered speech
- [ ] Error handling robust: Graceful fallback, helpful messages
- [ ] Zero regression: Existing CLI commands unchanged
- [ ] Documentation updated: Configuration guide complete

---

## Anti-Patterns to Avoid

- ❌ Don't block agent responses with synchronous TTS calls
- ❌ Don't read settings file on every request - use caching
- ❌ Don't throw errors in hooks - log and continue
- ❌ Don't hardcode voice names - use configuration
- ❌ Don't skip content analysis - always route intelligently
- ❌ Don't ignore debouncing - prevent speech spam
- ❌ Don't break existing CLI commands - maintain compatibility
- ❌ Don't assume premium voices exist - always check availability
- ❌ Don't mix hook and CLI activity tracking - separate concerns
- ❌ Don't create shell scripts - TypeScript only per CLAUDE.md

## Confidence Score

**9/10** - High confidence for successful implementation:
- ✅ Clear hook integration points identified
- ✅ Existing patterns to follow in codebase
- ✅ Comprehensive configuration schema defined
- ✅ Content analysis logic well-specified
- ✅ Voice detection approach validated
- ✅ Test coverage requirements clear
- ✅ Performance targets achievable
- ✅ Error handling strategies defined

**Risk**: Premium voice naming conventions may vary across macOS versions, but mitigation through normalization and fallback strategies ensures robustness.