/**
 * Tests for TTS Service
 * Validates provider orchestration, fallback behavior, and activity tracking
 */

import { TTSService } from '../../core/tts-service';
import { TTSProvider, TTSResult, TTSOptions, TTSError } from '../../core/interfaces';

// Mock SessionFileManager to avoid chalk dependency
const mockSessionFileManager = {
  updateActivityTimestamps: jest.fn()
};

jest.mock('../../../sessions/management/session-file-manager', () => ({
  SessionFileManager: jest.fn().mockImplementation(() => mockSessionFileManager)
}));

describe('TTSService', () => {
  let service: TTSService;
  let mockSystemProvider: jest.Mocked<TTSProvider>;
  let mockMistralProvider: jest.Mocked<TTSProvider>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = process.env;
    
    // Create fresh service instance
    service = new TTSService({
      defaultProvider: 'system',
      fallbackProvider: 'system',
      enableActivityTracking: true,
      providers: {}
    });

    // Create mock providers
    mockSystemProvider = {
      name: 'system',
      speak: jest.fn(),
      isAvailable: jest.fn()
    };

    mockMistralProvider = {
      name: 'mistral',
      speak: jest.fn(),
      isAvailable: jest.fn()
    };

    // Register providers
    service.registerProvider(mockSystemProvider);
    service.registerProvider(mockMistralProvider);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Provider Management', () => {
    test('should register and retrieve providers', () => {
      expect(service.hasProvider('system')).toBe(true);
      expect(service.hasProvider('mistral')).toBe(true);
      expect(service.hasProvider('nonexistent')).toBe(false);
      
      expect(service.getAvailableProviders()).toEqual(['system', 'mistral']);
    });

    test('should unregister providers', () => {
      expect(service.unregisterProvider('mistral')).toBe(true);
      expect(service.hasProvider('mistral')).toBe(false);
      expect(service.unregisterProvider('nonexistent')).toBe(false);
    });

    test('should check provider availability', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockMistralProvider.isAvailable.mockResolvedValue(false);

      expect(await service.isProviderAvailable('system')).toBe(true);
      expect(await service.isProviderAvailable('mistral')).toBe(false);
      expect(await service.isProviderAvailable('nonexistent')).toBe(false);
    });

    test('should handle provider availability check errors', async () => {
      mockSystemProvider.isAvailable.mockRejectedValue(new Error('Network error'));

      expect(await service.isProviderAvailable('system')).toBe(false);
    });
  });

  describe('TTS Operations', () => {
    test('should use default provider when none specified', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockResolvedValue({ success: true, duration: 1000 });

      const result = await service.speak('test message');

      expect(mockSystemProvider.isAvailable).toHaveBeenCalled();
      expect(mockSystemProvider.speak).toHaveBeenCalledWith('test message', undefined);
      expect(result).toEqual({
        success: true,
        duration: 1000,
        provider: 'system'
      });
    });

    test('should use specified provider when available', async () => {
      mockMistralProvider.isAvailable.mockResolvedValue(true);
      mockMistralProvider.speak.mockResolvedValue({ success: true, duration: 2500 });

      const result = await service.speak('test message', 'mistral');

      expect(mockMistralProvider.isAvailable).toHaveBeenCalled();
      expect(mockMistralProvider.speak).toHaveBeenCalledWith('test message', undefined);
      expect(result).toEqual({
        success: true,
        duration: 2500,
        provider: 'mistral'
      });
    });

    test('should pass options to provider', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockResolvedValue({ success: true });

      const options: TTSOptions = {
        voice: 'Zoe',
        rate: 1.5,
        volume: 0.8
      };

      await service.speak('test message', 'system', options);

      expect(mockSystemProvider.speak).toHaveBeenCalledWith('test message', options);
    });

    test('should reject empty messages', async () => {
      await expect(service.speak('')).rejects.toThrow(TTSError);
      await expect(service.speak('   ')).rejects.toThrow(TTSError);
      
      try {
        await service.speak('');
      } catch (error) {
        expect(error).toBeInstanceOf(TTSError);
        if (error instanceof TTSError) {
          expect(error.code).toBe('INVALID_MESSAGE');
        }
      }
    });

    test('should throw error for nonexistent provider', async () => {
      await expect(service.speak('test', 'nonexistent')).rejects.toThrow(TTSError);
      
      try {
        await service.speak('test', 'nonexistent');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('PROVIDER_NOT_FOUND');
          expect(error.message).toContain('nonexistent');
          expect(error.message).toContain('system, mistral');
        }
      }
    });
  });

  describe('Fallback Behavior', () => {
    test('should fallback to system provider when primary fails', async () => {
      const serviceWithFallback = new TTSService({
        defaultProvider: 'mistral',
        fallbackProvider: 'system',
        providers: {}
      });
      serviceWithFallback.registerProvider(mockSystemProvider);
      serviceWithFallback.registerProvider(mockMistralProvider);

      // Primary provider fails
      mockMistralProvider.isAvailable.mockResolvedValue(true);
      mockMistralProvider.speak.mockRejectedValue(new Error('Ollama offline'));
      
      // Fallback provider succeeds
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockResolvedValue({ success: true, duration: 1500 });

      const result = await serviceWithFallback.speak('test message', 'mistral');

      expect(mockMistralProvider.speak).toHaveBeenCalled();
      expect(mockSystemProvider.speak).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        duration: 1500,
        provider: 'system',
        error: "Primary provider 'mistral' failed, used fallback 'system'"
      });
    });

    test('should not fallback to same provider', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockRejectedValue(new Error('TTS failed'));

      await expect(service.speak('test', 'system')).rejects.toThrow(TTSError);
      
      // Should only call system provider once (no fallback to itself)
      expect(mockSystemProvider.speak).toHaveBeenCalledTimes(1);
    });

    test('should throw error when both primary and fallback fail', async () => {
      const serviceWithFallback = new TTSService({
        defaultProvider: 'mistral',
        fallbackProvider: 'system',
        providers: {}
      });
      serviceWithFallback.registerProvider(mockSystemProvider);
      serviceWithFallback.registerProvider(mockMistralProvider);

      // Both providers fail
      mockMistralProvider.isAvailable.mockResolvedValue(true);
      mockMistralProvider.speak.mockRejectedValue(new Error('Mistral failed'));
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockRejectedValue(new Error('System failed'));

      await expect(serviceWithFallback.speak('test', 'mistral')).rejects.toThrow(TTSError);
      
      try {
        await serviceWithFallback.speak('test', 'mistral');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('ALL_PROVIDERS_FAILED');
          expect(error.message).toContain('mistral');
          expect(error.message).toContain('system');
        }
      }
    });

    test('should handle unavailable primary provider', async () => {
      const serviceWithFallback = new TTSService({
        defaultProvider: 'mistral',
        fallbackProvider: 'system',
        providers: {}
      });
      serviceWithFallback.registerProvider(mockSystemProvider);
      serviceWithFallback.registerProvider(mockMistralProvider);

      // Primary provider unavailable
      mockMistralProvider.isAvailable.mockResolvedValue(false);
      
      // Fallback provider available
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockResolvedValue({ success: true });

      const result = await serviceWithFallback.speak('test', 'mistral');

      expect(result.provider).toBe('system');
      expect(mockSystemProvider.speak).toHaveBeenCalled();
    });
  });

  describe('Activity Tracking', () => {
    test('should initialize session manager with environment variables', () => {
      const { SessionFileManager } = require('../../../sessions/management/session-file-manager');
      
      process.env.APM_SESSION_ID = 'test-session-123';
      process.env.APM_SESSIONS = '/test/sessions';

      new TTSService({ enableActivityTracking: true, providers: {} });

      expect(SessionFileManager).toHaveBeenCalledWith('/test/sessions');
    });

    test('should use default sessions directory when APM_SESSIONS not set', () => {
      const { SessionFileManager } = require('../../../sessions/management/session-file-manager');
      
      process.env.APM_SESSION_ID = 'test-session-123';
      delete process.env.APM_SESSIONS;

      new TTSService({ enableActivityTracking: true, providers: {} });

      expect(SessionFileManager).toHaveBeenCalledWith('apm/sessions');
    });

    test('should not initialize session manager when no session ID', () => {
      const { SessionFileManager } = require('../../../sessions/management/session-file-manager');
      
      delete process.env.APM_SESSION_ID;

      new TTSService({ enableActivityTracking: true, providers: {} });

      expect(SessionFileManager).not.toHaveBeenCalled();
    });

    test('should handle session manager initialization errors gracefully', () => {
      const { SessionFileManager } = require('../../../sessions/management/session-file-manager');
      
      process.env.APM_SESSION_ID = 'test-session-123';
      SessionFileManager.mockImplementation(() => {
        throw new Error('Session manager init failed');
      });

      // Should not throw
      expect(() => new TTSService({ enableActivityTracking: true, providers: {} })).not.toThrow();
    });
  });

  describe('Service Status', () => {
    test('should return comprehensive status information', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockMistralProvider.isAvailable.mockResolvedValue(false);

      const status = await service.getStatus();

      expect(status).toEqual({
        providers: [
          { name: 'system', available: true },
          { name: 'mistral', available: false }
        ],
        defaultProvider: 'system',
        fallbackProvider: 'system',
        activityTrackingEnabled: false // No session manager in test
      });
    });

    test('should report activity tracking status correctly', async () => {
      const { SessionFileManager } = require('../../../sessions/management/session-file-manager');
      
      // Clear the mock first
      SessionFileManager.mockClear();
      
      process.env.APM_SESSION_ID = 'test-session';
      process.env.APM_SESSIONS = 'test/sessions';
      
      // Ensure the mock doesn't throw
      SessionFileManager.mockImplementation(() => mockSessionFileManager);
      
      // Create a new service that should initialize session manager
      const trackingService = new TTSService({ enableActivityTracking: true, providers: {} });
      trackingService.registerProvider(mockSystemProvider);
      
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      
      const status = await trackingService.getStatus();
      
      // Verify SessionFileManager was called to create the instance
      expect(SessionFileManager).toHaveBeenCalledWith('test/sessions');
      expect(status.activityTrackingEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should convert non-TTSError exceptions to TTSError', async () => {
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockRejectedValue(new Error('Generic error'));

      await expect(service.speak('test')).rejects.toThrow(TTSError);
      
      try {
        await service.speak('test');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('SPEAK_FAILED');
          expect(error.message).toContain('Generic error');
          expect(error.provider).toBe('system');
          expect(error.originalError).toBeInstanceOf(Error);
        }
      }
    });

    test('should preserve TTSError instances from providers', async () => {
      const originalError = new TTSError('CUSTOM_ERROR', 'Custom error message', 'system');
      
      mockSystemProvider.isAvailable.mockResolvedValue(true);
      mockSystemProvider.speak.mockRejectedValue(originalError);

      await expect(service.speak('test')).rejects.toThrow(originalError);
    });
  });
});