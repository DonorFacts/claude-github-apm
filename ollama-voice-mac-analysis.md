# Ollama Voice Mac - Technical Analysis & Integration Patterns

## Executive Summary

The `ollama-voice-mac` repository by apeatling is a Python-based offline voice assistant that integrates Mistral 7B via Ollama with OpenAI Whisper for speech recognition. This analysis provides comprehensive technical details for TypeScript/Node.js integration patterns.

## 1. Main Functionality and Architecture

### Core Components
- **Local AI Processing**: Runs entirely offline using local models
- **Speech-to-Text**: OpenAI Whisper for voice recognition
- **Language Model**: Mistral 7B via Ollama for text generation
- **Text-to-Speech**: macOS system voices (recommends "Zoe Premium")
- **Interface**: Space bar press-and-hold for voice input

### Architecture Pattern
```
Voice Input → Whisper (STT) → Ollama/Mistral (LLM) → System TTS → Audio Output
```

## 2. Ollama and Mistral 7B Integration

### Configuration Structure (assistant.yaml)
```yaml
ollama:
  url: "http://localhost:11434/api/generate"
  model: "mistral"

whisperRecognition:
  model: "whisper/base.en.pt"
  language: "en"

conversation:
  # Conversation parameters
```

### API Integration Pattern
- **Endpoint**: `http://localhost:11434/api/generate`
- **Model**: `mistral`
- **Protocol**: HTTP POST requests to local Ollama server
- **Response**: Streaming or non-streaming text generation

## 3. Key Dependencies and APIs

### Python Dependencies (Equivalent Node.js Libraries)
- **PyAudio** → `node-record-lpcm16`, `mic`, `node-microphone`
- **Whisper** → `@openai/whisper-api`, `whisper-node`
- **HTTP Client** → `fetch`, `axios`, `ollama` (official JS client)
- **YAML Config** → `js-yaml`, `yaml`
- **TTS** → `say.js`, `node-tts-api`, `google-tts-api`

### Required Services
1. **Ollama Server**: Local LLM hosting service
2. **Whisper Model**: Speech recognition model
3. **Mistral 7B**: Language model via Ollama

## 4. Voice/TTS Functionality Implementation

### Speech Recognition Pipeline
1. **Audio Capture**: Continuous microphone monitoring
2. **Trigger Detection**: Space bar press-and-hold
3. **Audio Processing**: Convert to format compatible with Whisper
4. **Transcription**: Send audio to Whisper model
5. **Text Output**: Return transcribed text for LLM processing

### Text-to-Speech Pipeline
1. **Response Processing**: Clean and format LLM output
2. **Voice Synthesis**: Use system TTS or external service
3. **Audio Playback**: Stream audio to system speakers

## 5. TypeScript Integration Patterns

### Recommended Architecture

#### Option 1: Official Ollama JS Client
```typescript
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: 'http://localhost:11434'
});

// Chat with streaming
const response = await ollama.chat({
  model: 'mistral',
  messages: [{ role: 'user', content: transcribedText }],
  stream: true
});

for await (const part of response) {
  // Process streaming response
  console.log(part.message.content);
}
```

#### Option 2: Direct HTTP API
```typescript
interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
}

async function generateResponse(prompt: string): Promise<string> {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral',
      prompt,
      stream: false
    })
  });
  
  const data = await response.json();
  return data.response;
}
```

### Voice Integration Pattern
```typescript
interface VoiceAssistant {
  startListening(): Promise<void>;
  stopListening(): Promise<string>; // Returns transcribed text
  speak(text: string): Promise<void>;
  processWithLLM(text: string): Promise<string>;
}

class OllamaVoiceAssistant implements VoiceAssistant {
  private ollama: Ollama;
  private isRecording = false;
  
  constructor() {
    this.ollama = new Ollama();
  }
  
  async startListening(): Promise<void> {
    // Implement microphone capture
  }
  
  async stopListening(): Promise<string> {
    // Process audio with Whisper
    // Return transcribed text
  }
  
  async speak(text: string): Promise<void> {
    // Implement TTS
  }
  
  async processWithLLM(text: string): Promise<string> {
    const response = await this.ollama.chat({
      model: 'mistral',
      messages: [{ role: 'user', content: text }]
    });
    return response.message.content;
  }
}
```

## 6. Node.js Integration Examples

### Complete Implementation Structure
```typescript
// src/services/voice-assistant.ts
import { Ollama } from 'ollama';
import { createWriteStream } from 'fs';
import { spawn } from 'child_process';

export class VoiceAssistantService {
  private ollama: Ollama;
  private config: AssistantConfig;
  
  constructor(config: AssistantConfig) {
    this.ollama = new Ollama({ host: config.ollama.url });
    this.config = config;
  }
  
  async transcribeAudio(audioPath: string): Promise<string> {
    // Use whisper-node or OpenAI Whisper API
    const whisper = spawn('whisper', [audioPath, '--model', 'base.en']);
    // Process output and return transcription
  }
  
  async generateResponse(prompt: string): Promise<string> {
    const response = await this.ollama.chat({
      model: this.config.ollama.model,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.message.content;
  }
  
  async synthesizeSpeech(text: string): Promise<void> {
    // Use system TTS or external service
    const say = require('say');
    say.speak(text, this.config.voice.name);
  }
}
```

### Configuration Management
```typescript
// src/config/assistant-config.ts
export interface AssistantConfig {
  ollama: {
    url: string;
    model: string;
  };
  whisper: {
    model: string;
    language: string;
  };
  voice: {
    name: string;
    speed: number;
  };
  conversation: {
    maxTokens: number;
    temperature: number;
  };
}

export const defaultConfig: AssistantConfig = {
  ollama: {
    url: "http://localhost:11434",
    model: "mistral"
  },
  whisper: {
    model: "base.en",
    language: "en"
  },
  voice: {
    name: "Zoe",
    speed: 1.0
  },
  conversation: {
    maxTokens: 1000,
    temperature: 0.7
  }
};
```

## 7. Configuration Requirements

### Prerequisites
1. **Ollama Installation**: Download and install Ollama
2. **Model Downloads**:
   ```bash
   ollama pull mistral
   ```
3. **Whisper Setup**: Install Whisper model locally
4. **Audio Dependencies**: Install system audio libraries

### Environment Setup
```bash
# Install Node.js dependencies
npm install ollama js-yaml say
npm install -D @types/node typescript tsx

# Development dependencies for audio
npm install node-record-lpcm16 mic
```

### Configuration File (TypeScript)
```typescript
// config/assistant.yml equivalent in TypeScript
export const assistantConfig = {
  messages: {
    spaceBarInteraction: "Press and hold space to speak",
    loading: "Processing...",
    error: "Sorry, I didn't catch that"
  },
  whisperRecognition: {
    model: "whisper/base.en.pt",
    language: "en"
  },
  ollama: {
    url: "http://localhost:11434/api/generate",
    model: "mistral"
  },
  conversation: {
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: "You are a helpful voice assistant."
  }
};
```

## 8. Best Integration Approaches

### Approach 1: Modular Service Architecture
- **Pros**: Clean separation of concerns, testable, scalable
- **Cons**: More complex setup
- **Best For**: Production applications, complex workflows

### Approach 2: Single Script Implementation
- **Pros**: Simple setup, quick prototyping
- **Cons**: Less maintainable, harder to test
- **Best For**: Proof of concepts, simple demos

### Approach 3: Event-Driven Architecture
- **Pros**: Responsive, handles concurrent operations
- **Cons**: More complex state management
- **Best For**: Real-time applications, multiple users

## 9. Performance and Optimization Considerations

### Latency Optimization
1. **Model Preloading**: Keep Ollama models warm
2. **Audio Streaming**: Process audio in chunks
3. **Response Caching**: Cache common responses
4. **Concurrent Processing**: Parallel audio and text processing

### Resource Management
1. **Memory Usage**: Monitor model memory consumption
2. **CPU Optimization**: Use hardware acceleration when available
3. **Audio Buffer Management**: Prevent audio dropouts
4. **Connection Pooling**: Reuse HTTP connections to Ollama

## 10. Implementation Recommendations

### Phase 1: Basic Integration
1. Set up Ollama with Mistral 7B
2. Implement basic HTTP client for Ollama API
3. Add simple TTS using system voices
4. Create basic configuration management

### Phase 2: Voice Integration
1. Add Whisper integration for STT
2. Implement audio capture and processing
3. Add hotkey/trigger detection
4. Implement streaming responses

### Phase 3: Advanced Features
1. Add conversation memory
2. Implement custom voice models
3. Add multi-language support
4. Performance optimization and caching

### Sample Implementation Timeline
- **Week 1**: Ollama integration and basic chat
- **Week 2**: TTS implementation and configuration
- **Week 3**: STT integration with Whisper
- **Week 4**: Voice pipeline and hotkey detection
- **Week 5**: Testing, optimization, and documentation

## Conclusion

The ollama-voice-mac project provides an excellent blueprint for building offline voice assistants with TypeScript. The key success factors are:

1. **Local-First Architecture**: All processing happens locally
2. **Modular Design**: Separate STT, LLM, and TTS components
3. **Configuration-Driven**: Easy customization via config files
4. **Performance Focus**: Optimized for real-time voice interaction

The TypeScript ecosystem provides all necessary tools for implementing a similar solution with the official Ollama JS client, modern audio libraries, and comprehensive TTS options.