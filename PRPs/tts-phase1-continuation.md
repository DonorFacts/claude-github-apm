name: "TTS Phase 1: Continuation PRP v2.0 - Tasks 4-9 Implementation"
description: |

## Purpose

**CONTINUATION PRP** for completing TTS Phase 1 implementation. The first 3 foundational tasks have been completed successfully. This PRP covers the remaining 6 tasks needed to achieve full Claude Code hook integration with intelligent TTS automation.

## Progress Summary - What's Already Completed ✅

### ✅ Task 1 - Voice Settings Schema & Validation (COMPLETED)
**Files Created:**
- `src/config/schemas/voice-settings-schema.ts` - Zod schema with full validation
- `src/tts/config/voice-settings.ts` - VoiceSettingsManager with caching (30s TTL)
- `src/tts/__tests__/config/voice-settings.test.ts` - Comprehensive test suite (18/18 tests pass)

**Key Features Implemented:**
- Type-safe VoiceSettings interface with Zod validation
- Automatic defaults for missing configuration values
- TTL-based caching for performance
- Graceful error handling with detailed error messages
- Support for contextual voices (error, completion, progress, etc.)

### ✅ Task 2 - Content Analysis Pipeline (COMPLETED)
**Files Created:**
- `src/tts/core/content-analyzer.ts` - ContentAnalyzer with intelligent routing
- `src/tts/__tests__/core/content-analyzer.test.ts` - Test suite (26/29 tests pass)

**Key Features Implemented:**
- Intelligent content type detection (code, error, progress, completion, info)
- Technical complexity analysis (simple, technical, complex)
- Provider suggestions (system vs mistral) based on content analysis
- Technical element extraction (file paths, code snippets, error messages, metrics)
- Voice suggestions based on content type

**Known Issues to Address:**
- 3 test failures related to content type classification edge cases
- Some messages with "completed" in them are being classified as completion rather than code
- Progress detection needs refinement for percentage extraction

### ✅ Task 3 - TTS Hook Infrastructure (COMPLETED)
**Files Created:**
- `src/sessions/hooks/tts-integration.ts` - TTSHookIntegration main interface
- `src/tts/hooks/hook-handler.ts` - HookHandler with debouncing and routing
- `src/tts/__tests__/hooks/hook-handler.test.ts` - Test suite (Jest module issues need resolution)

**Key Features Implemented:**
- Fire-and-forget async pattern to avoid blocking agent responses
- Debouncing system to prevent speech spam (configurable, default 500ms)
- Event type filtering based on user settings
- Integration with ContentAnalyzer for intelligent routing
- Session ID management and context building
- Comprehensive error handling with logging

**Known Issues to Address:**
- Test environment has Jest module resolution issues (chalk import problems)
- Provider initialization needs better error handling for missing Mistral/Ollama
- Hook timing optimization for better responsiveness

---

## Current Codebase State

### ✅ Files That Exist and Work
```bash
src/
├── config/
│   └── schemas/
│       └── voice-settings-schema.ts     # ✅ Complete with Zod validation
├── sessions/
│   └── hooks/
│       └── tts-integration.ts           # ✅ Complete TTSHookIntegration
├── tts/
│   ├── core/
│   │   ├── interfaces.ts                # ✅ Existing
│   │   ├── tts-service.ts               # ✅ Existing 
│   │   └── content-analyzer.ts          # ✅ Complete ContentAnalyzer
│   ├── config/
│   │   ├── ollama-config.ts             # ✅ Existing
│   │   └── voice-settings.ts            # ✅ Complete VoiceSettingsManager
│   ├── providers/
│   │   ├── system-tts.ts                # ✅ Existing
│   │   └── mistral-tts.ts               # ✅ Existing
│   ├── hooks/
│   │   └── hook-handler.ts              # ✅ Complete HookHandler
│   └── __tests__/
│       ├── config/
│       │   └── voice-settings.test.ts   # ✅ All tests pass
│       ├── core/
│       │   └── content-analyzer.test.ts # ✅ 26/29 tests pass
│       └── hooks/
│           └── hook-handler.test.ts     # ⚠️ Jest environment issues
```

### Dependencies Added
- `zod: ^4.0.5` - Schema validation (already installed)

---

## Remaining Work - Tasks 4-9

### Task 4 - Enhanced Mistral Prompts (IN PROGRESS) 🔄

**CRITICAL PRIORITIES:**
1. Create contextual prompt templates for each content type
2. Enhance mistral-tts.ts with context-aware prompt generation
3. Implement token limit management
4. Add session context integration

**Files to Create/Modify:**
```bash
CREATE src/tts/providers/prompt-templates.ts:
  - DEFINE PromptTemplate interface with placeholders
  - TEMPLATE code_summary: "Convert technical update to natural speech focusing on accomplishments"
  - TEMPLATE error_explanation: "Explain technical error in simple, friendly terms"
  - TEMPLATE progress_update: "Express progress in positive, conversational way"
  - TEMPLATE task_completion: "Celebrate achievement with natural, encouraging speech"
  - FUNCTION buildPrompt(template, context, message): string

MODIFY src/tts/providers/mistral-tts.ts:
  - ADD import { PromptTemplate, buildPrompt } from './prompt-templates'
  - ADD createContextualPrompt(message, context, promptType) method
  - ENHANCE generateEnhancedText() to use contextual prompts
  - IMPLEMENT token counting and limit management (maxTokens from settings)
  - PRESERVE existing functionality for backward compatibility

UPDATE src/tts/__tests__/providers/mistral-tts.test.ts:
  - TEST contextual prompt generation for each content type
  - TEST token limit enforcement
  - TEST prompt template selection logic
  - VERIFY enhanced text quality vs original
  - MOCK Ollama responses for consistent testing
```

**Implementation Blueprint:**
```typescript
// src/tts/providers/prompt-templates.ts
export interface PromptTemplate {
  type: 'code' | 'error' | 'progress' | 'completion';
  template: string;
  maxTokens: number;
  placeholders: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  code: {
    type: 'code',
    template: `Convert this technical update into natural, conversational speech:

Technical Update: {{message}}
{{#context}}Current Branch: {{currentBranch}}{{/context}}
{{#context.activeFiles}}Files: {{activeFiles}}{{/context.activeFiles}}

Instructions:
- Focus on what was accomplished, not technical details
- Use natural, friendly language suitable for voice output  
- Keep under 2 sentences
- Avoid jargon and acronyms where possible

Response:`,
    maxTokens: 150,
    placeholders: ['message', 'context.currentBranch', 'context.activeFiles']
  },
  
  error: {
    type: 'error',
    template: `Explain this technical error in simple, helpful terms:

Error: {{message}}

Instructions:
- Use friendly, non-technical language
- Explain what went wrong in simple terms
- Suggest a general direction for fixing it
- Keep encouraging and solution-focused

Response:`,
    maxTokens: 200,
    placeholders: ['message']
  }
  // ... other templates
};

export function buildPrompt(
  templateType: string, 
  message: string, 
  context?: any
): string {
  const template = PROMPT_TEMPLATES[templateType];
  if (!template) return message;
  
  let prompt = template.template;
  
  // Replace placeholders
  prompt = prompt.replace('{{message}}', message);
  
  if (context) {
    prompt = prompt.replace('{{currentBranch}}', context.currentBranch || '');
    prompt = prompt.replace('{{activeFiles}}', 
      context.activeFiles?.slice(0, 3).join(', ') || '');
  }
  
  // Remove unused context blocks
  prompt = prompt.replace(/\{\{#context\}\}.*?\{\{\/context\}\}/gs, '');
  
  return prompt;
}
```

### Task 5 - Premium Voice Detection for macOS 🔮

**CRITICAL PRIORITIES:**
1. Parse macOS `say -v ?` command output  
2. Detect premium/enhanced voices by naming patterns
3. Cache voice list for performance
4. Provide voice recommendation logic

**Files to Create/Modify:**
```bash
CREATE src/tts/providers/voice-detector.ts:
  - INTERFACE VoiceInfo { name, locale, description, quality, normalizedName }
  - CLASS VoiceDetector with getSystemVoices() method
  - PARSE command output format: "Samantha  en_US    # Most people recognize me by my voice."
  - IDENTIFY enhanced voices: name.includes('(Enhanced)') || description.includes('premium')
  - CACHE voice list with 5-minute TTL
  - METHOD normalizeVoiceName() for comparisons
  - RANK voices by quality (premium > enhanced > standard)

MODIFY src/tts/providers/system-tts.ts:
  - ADD detectAvailableVoices() method using VoiceDetector
  - CACHE detected voices in memory
  - INTEGRATE with voice validation in speak() method
  - PROVIDE fallback when requested voice not available

UPDATE src/tts/__tests__/providers/system-tts.test.ts:
  - TEST voice detection parsing with mock command output
  - TEST premium voice identification logic
  - TEST voice normalization edge cases
  - TEST caching behavior and TTL
  - MOCK child_process.exec for `say -v ?` command
```

**Mock Data for Testing:**
```typescript
const MOCK_SAY_OUTPUT = `
Alex                 en_US    # Most people recognize me by my voice.
Alice                it_IT    # Alice è una voce italiana.
Allison              en_US    # 
Amelie               fr_CA    # Bonjour, je m'appelle Amélie. Je suis une voix canadienne.
Anna                 de_DE    # Hallo, ich heiße Anna und ich bin eine deutsche Stimme.
Carmit               he_IL    # שלום. קוראים לי כרמית, ואני קול בעברית.
Damien               fr_FR    # Bonjour, je m'appelle Damien. Je suis une voix française.
Daniel               en_GB    # Hello, my name is Daniel. I am a British-English voice.
Diego                es_AR    # Hola, me llamo Diego y soy una voz española.
Ellen                nl_BE    # Hallo, mijn naam is Ellen. Ik ben een Belgische stem.
Fiona                en-scotland # Hello, my name is Fiona. I am a Scottish-English voice.
Fred                 en_US    # I sure like being inside this fancy computer
Ioana                ro_RO    # Bună, mă cheamă Ioana și sunt o voce românească.
Joana                pt_PT    # Olá, chamo-me Joana e sou uma voz portuguesa.
Jorge                es_ES    # Hola, me llamo Jorge y soy una voz española.
Juan                 es_MX    # Hola, me llamo Juan y soy una voz mexicana.
Kanya                th_TH    # สวัสดีค่ะ ดิฉันชื่อKanya
Karen                en_AU    # Hello, my name is Karen. I am an Australian-English voice.
Kyoko                ja_JP    # こんにちは、私の名前はKyokoです。日本語の音声をお届けします。
Laura                sk_SK    # Ahoj. Volám sa Laura a som hlas v slovenskom jazyku.
Lekha                hi_IN    # नमस्कार, मेरा नाम लेखा है और मैं हिन्दी मे बोलने वाली आवाज़ हूँ।
Luca                 it_IT    # Ciao, mi chiamo Luca e sono una voce italiana.
Luciana              pt_BR    # Olá, o meu nome é Luciana e a minha voz corresponde ao português que é falado no Brasil
Maged                ar_SA    # مرحبًا اسمي Maged وأتحدث باللغة العربية
Mariska              hu_HU    # Üdvözlöm! Mariska vagyok, egy magyar hang.
Mei-Jia              zh_TW    # 您好，我叫美佳，我說國語。
Melina               el_GR    # Γεια σας, ονομάζομαι Melina. Είμαι μια ελληνική φωνή.
Milena               ru_RU    # Привет, меня зовут Milena. Я – русский голос системы.
Moira                en_IE    # Hello, my name is Moira. I am an Irish-English voice.
Monica               es_ES    # Hola, me llamo Monica y soy una voz española.
Nora                 nb_NO    # Hei, jeg heter Nora. Jeg er en norsk stemme.
Paulina              es_MX    # Hola, me llamo Paulina y soy una voz mexicana.
Samantha             en_US    # Hello, my name is Samantha. I am an American-English voice.
Samantha (Enhanced)  en_US    # Hello, my name is Samantha. I am an American-English voice.
Sara                 da_DK    # Hej, jeg hedder Sara. Jeg er en dansk stemme.
Siri                 en_US    # Hello, my name is Siri.
Tessa                en_ZA    # Hello, my name is Tessa. I am a South African-English voice.
Thomas               fr_FR    # Bonjour, je m'appelle Thomas. Je suis une voix française.
Ting-Ting            zh_CN    # 您好，我叫Ting-Ting，我讲中文普通话。
Veena                en_IN    # Hello, my name is Veena. I am an Indian-English voice.
Victoria             en_US    # Isn't it nice to have a computer that will talk to you?
Xander               nl_NL    # Hallo, mijn naam is Xander. Ik ben een Nederlandse stem.
Yelda                tr_TR    # Merhaba, benim adım Yelda. Ben Türkçe bir sesim.
Yuna                 ko_KR    # 안녕하세요. 제 이름은 Yuna입니다. 저는 한국어 음성입니다.
Zosia                pl_PL    # Witaj. Mam na imię Zosia, jestem głosem kobiecym dla języka polskiego.
Zuzana               cs_CZ    # Dobrý den, jmenuji se Zuzana. Jsem český hlas.
`;
```

### Task 6 - Hook Integration with Claude Code 🔗

**CRITICAL PRIORITIES:**
1. Integrate TTS hooks into existing Claude Code event system
2. Add TTS triggers to todo completion events
3. Add TTS triggers to agent response completion
4. Prevent double activity tracking

**Files to Modify:**
```bash
MODIFY src/sessions/hooks/claude-code-integration.ts:
  - IMPORT { ttsHookIntegration } from './tts-integration'
  - ENHANCE hookTodoWrite() to trigger TTS on completed tasks
  - ENHANCE onAgentResponseComplete() to trigger TTS
  - PATTERN use fire-and-forget async calls
  - PRESERVE all existing functionality
  - ERROR HANDLING log TTS errors without breaking existing flow

MODIFY src/tts/core/tts-service.ts:
  - ADD hookMode parameter to speak() method signature
  - METHOD speakFromHook(message, provider, options) - skip activity tracking
  - CONDITIONAL skip updateActivityTracking() when hookMode=true
  - MAINTAIN complete backward compatibility for CLI commands

UPDATE src/cli/agent/speak.ts:
  - ENSURE speakFromHook is not used (should use regular speak method)
  - PRESERVE all existing behavior and activity tracking
```

**Integration Pattern:**
```typescript
// src/sessions/hooks/claude-code-integration.ts additions
import { ttsHookIntegration } from './tts-integration';

// Enhanced hookTodoWrite function
export function hookTodoWrite(newTodos: TodoItem[]): void {
  // Existing todo tracking logic...
  const newlyCompleted = newTodos.filter(todo => {
    const wasCompleted = previousTodos.some(prev => 
      prev.id === todo.id && prev.status === 'completed'
    );
    return todo.status === 'completed' && !wasCompleted;
  });

  // Record each newly completed task
  newlyCompleted.forEach(task => {
    activityTracker.recordTaskCompletion(task.content);
    
    // NEW: Trigger TTS for task completion (fire-and-forget)
    setTimeout(async () => {
      try {
        await ttsHookIntegration.onTaskCompletion(task.content, {
          taskId: task.id,
          priority: task.priority as any
        });
      } catch (error) {
        console.error('[TTS Integration] Task completion TTS failed:', error);
      }
    }, 0);
  });

  // Update previous state and record agent activity
  previousTodos = [...newTodos];
  activityTracker.recordAgentActivity();
}

// Enhanced onAgentResponseComplete function  
export function onAgentResponseComplete(): void {
  activityTracker.recordAgentActivity();
  
  // NEW: Trigger TTS for agent response completion (fire-and-forget)
  setTimeout(async () => {
    try {
      await ttsHookIntegration.onAgentResponse(
        'Agent response completed', 
        { agentRole: 'assistant' }
      );
    } catch (error) {
      console.error('[TTS Integration] Agent response TTS failed:', error);
    }
  }, 0);
}
```

### Task 7 - Settings File Integration & CLI Commands 📋

**CRITICAL PRIORITIES:**
1. Create initialization script for .apm-voice-settings.json
2. Add CLI commands for TTS management
3. Integrate voice detection with settings creation
4. Provide settings validation and help

**Files to Create/Modify:**
```bash
CREATE scripts/init-voice-settings.ts:
  - SCRIPT to create default .apm-voice-settings.json in project root
  - INTEGRATE VoiceDetector to populate premiumVoicesDetected
  - SET sensible defaults based on available voices
  - PRETTY print JSON with comments
  - HANDLE existing file (backup and merge approach)

CREATE src/cli/commands/tts-commands.ts:
  - COMMAND tts:init-settings - run init-voice-settings.ts script
  - COMMAND tts:list-voices - show available voices with quality info
  - COMMAND tts:test-voice <voice> - test specific voice
  - COMMAND tts:validate-settings - validate current settings file

MODIFY src/cli.ts:
  - IMPORT and register TTS commands
  - FOLLOW existing command patterns (yargs structure)
  - ADD help text and examples for each command

CREATE .apm-voice-settings.json template:
  - COMPLETE default configuration
  - COMMENTS explaining each setting
  - PLATFORM-SPECIFIC defaults for macOS
```

**CLI Command Structure:**
```typescript
// src/cli/commands/tts-commands.ts
export function registerTTSCommands(yargs: any) {
  return yargs
    .command('tts:init-settings', 'Initialize TTS voice settings', {}, async () => {
      console.log('Initializing TTS voice settings...');
      await require('../../scripts/init-voice-settings').main();
    })
    
    .command('tts:list-voices', 'List available system voices', {}, async () => {
      const { VoiceDetector } = await import('../tts/providers/voice-detector');
      const detector = new VoiceDetector();
      const voices = await detector.getSystemVoices();
      
      console.log('\n🎤 Available System Voices:\n');
      voices.forEach(voice => {
        const quality = voice.quality === 'premium' ? '✨ Premium' : '📢 Standard';
        console.log(`${quality} ${voice.name} (${voice.locale}) - ${voice.description}`);
      });
    })
    
    .command('tts:test-voice <voice>', 'Test a specific voice', {
      voice: { type: 'string', describe: 'Voice name to test' }
    }, async (argv) => {
      const { SystemTTSProvider } = await import('../tts/providers/system-tts');
      const provider = new SystemTTSProvider();
      
      try {
        await provider.speak(`Hello, this is a test of the ${argv.voice} voice.`, {
          voice: argv.voice
        });
        console.log(`✅ Successfully tested voice: ${argv.voice}`);
      } catch (error) {
        console.error(`❌ Failed to test voice ${argv.voice}:`, error);
      }
    })
    
    .command('tts:validate-settings', 'Validate TTS settings file', {}, async () => {
      const { VoiceSettingsManager } = await import('../tts/config/voice-settings');
      const manager = new VoiceSettingsManager();
      
      try {
        const settings = await manager.loadSettings();
        const status = await manager.getStatus();
        
        if (status.settingsValid) {
          console.log('✅ TTS settings are valid');
          console.log(`📁 Settings file: ${status.configFilePath}`);
          console.log(`🎤 Default voice: ${settings.defaultVoice}`);
        } else {
          console.log('❌ TTS settings validation failed:');
          status.validationErrors?.forEach(error => console.log(`  - ${error}`));
        }
      } catch (error) {
        console.error('❌ Failed to validate settings:', error);
      }
    });
}
```

### Task 8 - Integration Testing & Validation 🧪

**CRITICAL PRIORITIES:**
1. End-to-end hook flow testing
2. Settings integration validation
3. Performance testing
4. Regression testing for existing commands

**Files to Create:**
```bash
CREATE src/tts/__tests__/integration/hook-integration.test.ts:
  - TEST complete hook flow from TodoWrite to TTS output
  - SIMULATE agent events and verify TTS triggers
  - TEST settings application and voice selection
  - TEST debouncing prevents speech spam
  - TEST error conditions and graceful fallback

CREATE src/tts/__tests__/integration/settings-integration.test.ts:
  - TEST settings file loading and validation
  - TEST voice detection integration
  - TEST configuration changes apply immediately
  - TEST CLI commands work correctly
  - TEST initialization script creates valid settings

CREATE src/tts/__tests__/integration/performance.test.ts:
  - TEST hook latency <3s requirement
  - TEST memory usage under load
  - TEST concurrent event handling
  - TEST voice switching performance
  - BENCHMARK Mistral vs system TTS timing

CREATE scripts/validate-tts-integration.ts:
  - COMPREHENSIVE end-to-end validation script
  - TEST all major functionality paths
  - REPORT performance metrics
  - GENERATE integration test report
```

**Integration Test Scenarios:**
```typescript
// Key test scenarios to implement
describe('TTS Hook Integration E2E', () => {
  test('Todo completion triggers appropriate TTS with correct voice', async () => {
    // 1. Mock todo completion event
    // 2. Verify TTS hook receives event
    // 3. Verify content analysis runs
    // 4. Verify correct voice selected
    // 5. Verify TTS provider called
    // 6. Verify no blocking of main thread
  });

  test('Settings changes apply immediately without restart', async () => {
    // 1. Load initial settings
    // 2. Trigger TTS event
    // 3. Change voice in settings file
    // 4. Trigger another TTS event
    // 5. Verify new voice used (cache TTL test)
  });

  test('Multiple rapid events are properly debounced', async () => {
    // 1. Send 5 rapid progress events
    // 2. Verify only last event processed
    // 3. Verify debounce timing respected
    // 4. Verify no duplicate TTS calls
  });

  test('Graceful degradation when Ollama unavailable', async () => {
    // 1. Mock Ollama service down
    // 2. Trigger complex technical content
    // 3. Verify fallback to system TTS
    // 4. Verify appropriate warning logged
  });
});
```

### Task 9 - Documentation Updates 📚

**CRITICAL PRIORITIES:**
1. Update planning documentation with completion status
2. Create user configuration guide
3. Document troubleshooting steps
4. Provide examples and best practices

**Files to Create/Modify:**
```bash
UPDATE docs/planning/tts.md:
  - MARK Phase 1 as completed
  - DOCUMENT actual vs planned implementation
  - NOTE any deviations or improvements made
  - ADD performance benchmarks achieved

CREATE docs/features/tts-configuration.md:
  - COMPLETE .apm-voice-settings.json schema documentation
  - EXAMPLES for common use cases
  - GUIDE for premium voice setup on macOS
  - TROUBLESHOOTING common issues
  - BEST PRACTICES for voice selection

CREATE docs/features/tts-hook-integration.md:
  - EXPLAIN how automatic TTS works
  - DOCUMENT event types and triggers
  - CUSTOMIZATION options and settings
  - PERFORMANCE considerations
  - DEBUGGING guide for hook issues

UPDATE README.md:
  - ADD TTS automation features to feature list
  - LINK to configuration documentation
  - QUICK start guide for voice setup
  - EXAMPLES of automatic speech in action
```

---

## Critical Implementation Notes

### ⚠️ Issues to Address First

1. **Content Analyzer Test Failures (3/29 failing):**
   - Fix content type classification edge cases
   - Improve "completed" vs completion detection logic  
   - Enhance percentage extraction for progress content

2. **Jest Test Environment Issues:**
   - Resolve chalk module import problems in test environment
   - Update Jest configuration for ES modules if needed
   - Ensure all tests can run consistently

3. **Error Handling Robustness:**
   - Add better provider initialization error handling
   - Improve Ollama connection failure recovery
   - Enhance voice availability checking

### 🎯 Performance Requirements

- **Hook latency:** <3s for all TTS events
- **Memory usage:** <50MB additional footprint
- **Debouncing:** Default 500ms, configurable
- **Voice detection cache:** 5-minute TTL
- **Settings cache:** 30-second TTL

### 🔧 Integration Points

**Claude Code Integration:**
- `src/sessions/hooks/claude-code-integration.ts` - Main integration point
- `hookTodoWrite()` - Task completion triggers
- `onAgentResponseComplete()` - Agent response triggers

**Activity Tracking:**
- Maintain existing activity tracking for CLI commands
- Skip activity tracking for hook-triggered TTS (`hookMode` flag)
- Preserve session ID propagation

**Configuration:**
- `.apm-voice-settings.json` in project root
- Auto-initialization via CLI command
- Hot-reload with TTL-based caching

---

## Validation Strategy

### Level 1: Unit Tests
```bash
# Fix existing test failures first
pnpm test src/tts/__tests__/core/content-analyzer.test.ts
pnpm test src/tts/__tests__/hooks/hook-handler.test.ts

# Run all TTS tests
pnpm test src/tts/ --coverage
# Target: >90% coverage for all new code
```

### Level 2: Integration Tests  
```bash
# Initialize and test settings
pnpm cli tts:init-settings
pnpm cli tts:list-voices
pnpm cli tts:validate-settings

# Test CLI commands still work
pnpm cli speak "Testing backwards compatibility"
pnpm cli speak:mistral7b "Testing Mistral integration"

# Test hook integration
tsx scripts/validate-tts-integration.ts
```

### Level 3: End-to-End Validation
```bash
# Performance testing
time pnpm cli speak "Performance test"
time pnpm cli speak:mistral7b "Performance test with Mistral"

# Real workflow simulation
# (Create test script simulating actual Claude Code workflow)

# Stress testing
# (Multiple rapid events, voice switching, error conditions)
```

---

## Success Criteria Checklist

**Core Functionality:**
- [ ] All 6 remaining tasks completed (4-9)
- [ ] Hook integration triggers TTS automatically on agent events
- [ ] Voice settings control TTS behavior and voice selection
- [ ] Different voices used for different content types
- [ ] Content intelligently analyzed and routed to appropriate provider
- [ ] Premium macOS voices detected and utilized

**Technical Requirements:**
- [ ] All tests pass with >90% coverage
- [ ] No TypeScript errors (`pnpm ts-check`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Performance <3s for hook-triggered speech
- [ ] Zero regression on existing CLI commands

**User Experience:**
- [ ] Settings file easily configurable
- [ ] CLI commands for voice management
- [ ] Comprehensive documentation and examples
- [ ] Graceful error handling and helpful messages
- [ ] Automatic initialization and setup

---

## Confidence Score: 8/10

**High confidence because:**
- ✅ Strong foundation completed (Tasks 1-3)
- ✅ Clear patterns established for remaining work
- ✅ Existing codebase integration points identified
- ✅ Comprehensive test strategy defined

**Moderate risk areas:**
- ⚠️ Jest test environment needs fixing
- ⚠️ Content analyzer edge cases need refinement  
- ⚠️ macOS voice detection variations across versions
- ⚠️ Ollama service integration stability

**Mitigation strategies in place for all risk areas.**