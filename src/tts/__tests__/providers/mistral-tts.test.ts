/**
 * Tests for Mistral TTS Provider
 * Validates Ollama integration, AI enhancement, and TTSProvider interface compliance
 */

import { MistralTTSProvider } from '../../providers/mistral-tts';
import { TTSError, OllamaConfig } from '../../core/interfaces';
import { createTestOllamaConfig } from '../../config/ollama-config';

// Mock Ollama
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    generate: jest.fn(),
    list: jest.fn()
  }))
}));

// Mock hostBridge
jest.mock('../../../integrations/docker/host-bridge/container/index', () => ({
  hostBridge: {
    speech_say: jest.fn(),
    isHostDaemonRunning: jest.fn(),
    getServicesStatus: jest.fn()
  }
}));

import { Ollama } from 'ollama';
import { hostBridge } from '../../../integrations/docker/host-bridge/container/index';

// Helper to create mock Ollama responses
function createMockGenerateResponse(response: string) {
  return {
    model: 'mistral:7b',
    created_at: new Date('2024-01-01T00:00:00Z'),
    response,
    done: true,
    done_reason: 'stop' as const,
    context: [1, 2, 3],
    total_duration: 1000000,
    load_duration: 100000,
    prompt_eval_count: 10,
    prompt_eval_duration: 200000,
    eval_count: 20,
    eval_duration: 700000
  };
}

function createMockModelResponse(name: string) {
  return {
    name,
    model: name,
    modified_at: new Date('2024-01-01T00:00:00Z'),
    digest: 'abc123def456',
    size: 1000000,
    size_vram: 500000,
    details: {
      parent_model: '',
      format: 'gguf' as const,
      family: 'mistral',
      families: ['mistral'],
      parameter_size: '7B',
      quantization_level: 'Q4_0'
    },
    expires_at: new Date('2024-12-31T23:59:59Z')
  };
}

describe('MistralTTSProvider', () => {
  let provider: MistralTTSProvider;
  let mockOllama: jest.Mocked<InstanceType<typeof Ollama>>;
  let mockHostBridge: jest.Mocked<typeof hostBridge>;
  let config: OllamaConfig;

  beforeEach(() => {
    config = createTestOllamaConfig();
    
    // Setup Ollama mock with relaxed typing for testing
    mockOllama = {
      generate: jest.fn(),
      list: jest.fn()
    } as any;
    
    (Ollama as jest.Mock).mockImplementation(() => mockOllama);
    
    // Setup hostBridge mock
    mockHostBridge = hostBridge as jest.Mocked<typeof hostBridge>;
    
    provider = new MistralTTSProvider(config);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Interface Compliance', () => {
    test('should implement TTSProvider interface', () => {
      expect(provider.name).toBe('mistral');
      expect(typeof provider.speak).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
    });

    test('should initialize with Ollama client', () => {
      expect(Ollama).toHaveBeenCalledWith({
        host: config.baseUrl
      });
    });
  });

  describe('AI-Enhanced TTS Operations', () => {
    test('should enhance text and speak successfully', async () => {
      // Mock Ollama response
      (mockOllama.generate as jest.Mock).mockResolvedValue({
        response: 'This is an enhanced version of the test message that sounds more natural.'
      } as any);
      
      // Mock system TTS success
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('test message');

      expect(mockOllama.generate).toHaveBeenCalledWith({
        model: config.model,
        prompt: expect.stringContaining('test message'),
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens
        }
      });

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith(
        'This is an enhanced version of the test message that sounds more natural.',
        undefined,
        undefined
      );

      expect(result).toMatchObject({
        success: true,
        provider: 'mistral'
      });
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    test('should pass TTS options to system speech', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('Enhanced text')
      );
      mockHostBridge.speech_say.mockResolvedValue(true);

      const options = {
        voice: 'Zoe',
        rate: 1.5,
        volume: 0.8,
        language: 'en-US'
      };

      const result = await provider.speak('test', options);

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith('Enhanced text', 'Zoe', 1.5);
      expect(result.voice).toBe('Zoe');
      expect(result.rate).toBe(1.5);
      expect(result.volume).toBe(0.8);
      expect(result.language).toBe('en-US');
    });

    test('should include debug information in audioData', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('Enhanced message')
      );
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('original message');

      expect(result.audioData).toBeDefined();
      const debugInfo = JSON.parse(result.audioData!.toString());
      expect(debugInfo).toEqual({
        original: 'original message',
        enhanced: 'Enhanced message',
        model: config.model
      });
    });

    test('should fallback to original text if enhancement fails', async () => {
      mockOllama.generate.mockRejectedValue(new Error('Ollama offline'));
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('fallback test');

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith('fallback test', undefined, undefined);
      expect(result.success).toBe(true);
    });

    test('should fallback to original text if enhancement returns empty', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('   ')
      );
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('empty enhancement test');

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith('empty enhancement test', undefined, undefined);
    });

    test('should clean response text properly', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('Improved: "This is a cleaned response with quotes and prefix"')
      );
      mockHostBridge.speech_say.mockResolvedValue(true);

      await provider.speak('test');

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith(
        'This is a cleaned response with quotes and prefix',
        undefined,
        undefined
      );
    });

    test('should reject empty messages', async () => {
      await expect(provider.speak('')).rejects.toThrow(TTSError);
      await expect(provider.speak('   ')).rejects.toThrow(TTSError);
      
      try {
        await provider.speak('');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        if (error instanceof TTSError) {
          expect(error.code).toBe('INVALID_MESSAGE');
          expect(error.provider).toBe('mistral');
        }
      }
    });

    test('should handle system TTS failure', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('Enhanced text')
      );
      mockHostBridge.speech_say.mockRejectedValue(new Error('TTS service down'));

      await expect(provider.speak('test')).rejects.toThrow(TTSError);
      
      try {
        await provider.speak('test');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('MISTRAL_TTS_FAILED');
          expect(error.message).toContain('TTS service down');
          expect(error.provider).toBe('mistral');
        }
      }
    });
  });

  describe('Availability Checking', () => {
    test('should return true when all services available', async () => {
      // Mock Ollama connectivity
      mockOllama.list.mockResolvedValue({
        models: [
          createMockModelResponse('mistral:7b')
        ]
      });

      // Mock system TTS availability
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { enabled: true, timeout: 30000, description: 'TTS', voice: 'system' },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });

    test('should return false when Ollama server unavailable', async () => {
      mockOllama.list.mockRejectedValue(new Error('Connection refused'));

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should return false when model not available', async () => {
      mockOllama.list.mockResolvedValue({
        models: [
          createMockModelResponse('llama2:7b')
        ]
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should return false when system TTS unavailable', async () => {
      mockOllama.list.mockResolvedValue({
        models: [{ name: 'mistral:7b', size: 1000000, digest: 'abc123' }]
      });

      mockHostBridge.isHostDaemonRunning.mockResolvedValue(false);

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should handle model name matching correctly', async () => {
      const provider = new MistralTTSProvider({
        ...config,
        model: 'mistral' // Without version tag
      });

      mockOllama.list.mockResolvedValue({
        models: [
          createMockModelResponse('mistral:7b'),
          createMockModelResponse('mistral:latest')
        ]
      });

      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { enabled: true, timeout: 30000, description: 'TTS', voice: 'system' },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
    });
  });

  describe('Status Information', () => {
    test('should return comprehensive status when all available', async () => {
      mockOllama.list.mockResolvedValue({
        models: [{ name: 'mistral:7b', size: 1000000, digest: 'abc123' }]
      });
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { enabled: true, timeout: 30000, description: 'TTS', voice: 'system' },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: true,
        ollamaConnected: true,
        modelAvailable: true,
        systemTtsAvailable: true,
        model: config.model,
        baseUrl: config.baseUrl
      });
    });

    test('should report partial availability correctly', async () => {
      mockOllama.list.mockResolvedValue({
        models: [createMockModelResponse('llama2:7b')]
      });
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(false);

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: false,
        ollamaConnected: true,
        modelAvailable: false,
        systemTtsAvailable: false,
        model: config.model,
        baseUrl: config.baseUrl
      });
    });

    test('should handle complete failure gracefully', async () => {
      mockOllama.list.mockRejectedValue(new Error('Total connection failure'));

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: false,
        ollamaConnected: false,
        modelAvailable: false,
        systemTtsAvailable: false,
        model: config.model,
        baseUrl: config.baseUrl,
        error: 'Total connection failure'
      });
    });
  });

  describe('Text Enhancement', () => {
    test('should create proper enhancement prompt', async () => {
      mockOllama.generate.mockResolvedValue(
        createMockGenerateResponse('Enhanced text')
      );
      mockHostBridge.speech_say.mockResolvedValue(true);

      await provider.speak('hello world');

      expect(mockOllama.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/.*hello world.*/)
        })
      );

      const call = mockOllama.generate.mock.calls[0][0];
      expect(call.prompt).toContain('improve this text for natural speech synthesis');
      expect(call.prompt).toContain('hello world');
    });

    test('should handle various response formats', async () => {
      const testCases = [
        { input: 'Enhanced: "Hello there!"', expected: 'Hello there!' },
        { input: 'Improved: Simple text', expected: 'Simple text' },
        { input: '"Quoted response"', expected: 'Quoted response' },
        { input: '  Trimmed text  ', expected: 'Trimmed text' },
        { input: 'Output: Clean text', expected: 'Clean text' }
      ];

      for (const testCase of testCases) {
        mockOllama.generate.mockResolvedValue(
          createMockGenerateResponse(testCase.input)
        );
        mockHostBridge.speech_say.mockResolvedValue(true);

        await provider.speak('test');

        expect(mockHostBridge.speech_say).toHaveBeenCalledWith(
          testCase.expected,
          undefined,
          undefined
        );

        jest.clearAllMocks();
      }
    });
  });

  describe('Error Handling', () => {
    test('should preserve error context in TTSError', async () => {
      const originalError = new Error('Network timeout');
      mockOllama.generate.mockResolvedValue(createMockGenerateResponse('Enhanced'));
      mockHostBridge.speech_say.mockRejectedValue(originalError);

      try {
        await provider.speak('test');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('MISTRAL_TTS_FAILED');
          expect(error.provider).toBe('mistral');
          expect(error.originalError).toBe(originalError);
          expect(error.message).toContain('Network timeout');
        }
      }
    });

    test('should handle non-Error exceptions', async () => {
      mockOllama.generate.mockResolvedValue(createMockGenerateResponse('Enhanced'));
      mockHostBridge.speech_say.mockRejectedValue('String error');

      try {
        await provider.speak('test');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.originalError).toBeInstanceOf(Error);
          expect(error.originalError?.message).toBe('String error');
        }
      }
    });

    test('should propagate TTSError instances', async () => {
      const ttsError = new TTSError('CUSTOM_ERROR', 'Custom error message', 'mistral');
      mockOllama.generate.mockRejectedValue(ttsError);

      await expect(provider.speak('test')).rejects.toBe(ttsError);
    });
  });
});