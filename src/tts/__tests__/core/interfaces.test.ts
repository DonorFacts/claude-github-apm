/**
 * Tests for TTS Core Interfaces
 * Validates TypeScript interface compliance and error handling
 */

import { TTSProvider, TTSOptions, TTSResult, TTSError, OllamaConfig } from '../../core/interfaces';

describe('TTS Core Interfaces', () => {
  describe('TTSError', () => {
    test('should create error with required parameters', () => {
      const error = new TTSError('SPEAK_FAILED', 'TTS operation failed');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('TTSError');
      expect(error.code).toBe('SPEAK_FAILED');
      expect(error.message).toBe('TTS operation failed');
      expect(error.provider).toBeUndefined();
      expect(error.originalError).toBeUndefined();
    });

    test('should create error with optional parameters', () => {
      const originalError = new Error('Network failure');
      const error = new TTSError(
        'NETWORK_ERROR',
        'Failed to connect to TTS service',
        'mistral',
        originalError
      );
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Failed to connect to TTS service');
      expect(error.provider).toBe('mistral');
      expect(error.originalError).toBe(originalError);
    });

    test('should be throwable and catchable', () => {
      const throwError = () => {
        throw new TTSError('TEST_ERROR', 'Test error message', 'test-provider');
      };

      expect(throwError).toThrow(TTSError);
      expect(throwError).toThrow('Test error message');
      
      try {
        throwError();
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        if (error instanceof TTSError) {
          expect(error.code).toBe('TEST_ERROR');
          expect(error.provider).toBe('test-provider');
        }
      }
    });
  });

  describe('Interface Compliance', () => {
    test('TTSProvider interface should be implementable', () => {
      class MockTTSProvider implements TTSProvider {
        readonly name = 'mock';
        
        async speak(message: string, options?: TTSOptions): Promise<TTSResult> {
          return { success: true, provider: this.name };
        }
        
        async isAvailable(): Promise<boolean> {
          return true;
        }
      }

      const provider = new MockTTSProvider();
      expect(provider.name).toBe('mock');
      expect(typeof provider.speak).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
    });

    test('TTSProvider methods should return correct types', async () => {
      class TestProvider implements TTSProvider {
        readonly name = 'test';
        
        async speak(message: string, options?: TTSOptions): Promise<TTSResult> {
          return {
            success: true,
            duration: 1500,
            provider: this.name
          };
        }
        
        async isAvailable(): Promise<boolean> {
          return true;
        }
      }

      const provider = new TestProvider();
      const result = await provider.speak('test message');
      const available = await provider.isAvailable();

      expect(result).toMatchObject({
        success: true,
        duration: 1500,
        provider: 'test'
      });
      expect(typeof available).toBe('boolean');
      expect(available).toBe(true);
    });

    test('TTSOptions should be optional with all optional properties', async () => {
      class FlexibleProvider implements TTSProvider {
        readonly name = 'flexible';
        
        async speak(message: string, options?: TTSOptions): Promise<TTSResult> {
          // Should work with no options
          if (!options) {
            return { success: true };
          }
          
          // Should work with partial options
          return {
            success: true,
            provider: this.name,
            // Echo back the options to verify they're passed correctly
            audioData: Buffer.from(JSON.stringify(options))
          };
        }
        
        async isAvailable(): Promise<boolean> {
          return true;
        }
      }

      const provider = new FlexibleProvider();
      
      // No options
      const result1 = await provider.speak('test');
      expect(result1.success).toBe(true);
      
      // Partial options
      const result2 = await provider.speak('test', { voice: 'system' });
      expect(result2.success).toBe(true);
      expect(result2.audioData).toBeDefined();
      
      // Full options
      const result3 = await provider.speak('test', {
        voice: 'Zoe',
        rate: 1.5,
        volume: 0.8,
        language: 'en'
      });
      expect(result3.success).toBe(true);
    });
  });

  describe('Type Safety', () => {
    test('OllamaConfig should enforce required properties', () => {
      const validConfig: OllamaConfig = {
        baseUrl: 'http://localhost:11434',
        model: 'mistral:7b',
        timeout: 30000
      };
      
      expect(validConfig.baseUrl).toBe('http://localhost:11434');
      expect(validConfig.model).toBe('mistral:7b');
      expect(validConfig.timeout).toBe(30000);
      
      // Optional properties
      const configWithOptionals: OllamaConfig = {
        ...validConfig,
        maxTokens: 1000,
        temperature: 0.7
      };
      
      expect(configWithOptionals.maxTokens).toBe(1000);
      expect(configWithOptionals.temperature).toBe(0.7);
    });

    test('TTSResult should allow flexible return values', () => {
      const minimalResult: TTSResult = { success: true };
      expect(minimalResult.success).toBe(true);
      
      const fullResult: TTSResult = {
        success: false,
        duration: 2500,
        error: 'Network timeout',
        audioData: Buffer.from('mock audio data'),
        provider: 'system'
      };
      
      expect(fullResult.success).toBe(false);
      expect(fullResult.duration).toBe(2500);
      expect(fullResult.error).toBe('Network timeout');
      expect(fullResult.audioData).toBeInstanceOf(Buffer);
      expect(fullResult.provider).toBe('system');
    });
  });
});