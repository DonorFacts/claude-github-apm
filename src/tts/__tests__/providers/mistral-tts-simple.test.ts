/**
 * Simplified Mistral TTS Provider Tests
 * Basic validation of core functionality with simplified mocking
 */

import { MistralTTSProvider } from '../../providers/mistral-tts';
import { TTSError } from '../../core/interfaces';
import { createTestOllamaConfig } from '../../config/ollama-config';

// Mock Ollama with simplified mocking
jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({
    generate: jest.fn(),
    list: jest.fn()
  }))
}));

// Mock hostBridge with simplified mocking
jest.mock('../../../integrations/docker/host-bridge/container/index', () => ({
  hostBridge: {
    speech_say: jest.fn(),
    isHostDaemonRunning: jest.fn(),
    getServicesStatus: jest.fn()
  }
}));

describe('MistralTTSProvider - Core Functionality', () => {
  let provider: MistralTTSProvider;

  beforeEach(() => {
    const config = createTestOllamaConfig();
    provider = new MistralTTSProvider(config);
    jest.clearAllMocks();
  });

  test('should implement TTSProvider interface', () => {
    expect(provider.name).toBe('mistral');
    expect(typeof provider.speak).toBe('function');
    expect(typeof provider.isAvailable).toBe('function');
  });

  test('should reject empty messages', async () => {
    await expect(provider.speak('')).rejects.toThrow(TTSError);
    await expect(provider.speak('   ')).rejects.toThrow(TTSError);
  });

  test('should create instance with configuration', () => {
    const config = createTestOllamaConfig({
      model: 'custom-model',
      baseUrl: 'http://custom-host:8080'
    });
    
    const customProvider = new MistralTTSProvider(config);
    expect(customProvider.name).toBe('mistral');
  });
});