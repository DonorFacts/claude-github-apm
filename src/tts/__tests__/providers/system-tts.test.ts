/**
 * Tests for System TTS Provider
 * Validates host-bridge integration and TTSProvider interface compliance
 */

import { SystemTTSProvider } from '../../providers/system-tts';
import { TTSError } from '../../core/interfaces';
import { hostBridge } from '../../../integrations/docker/host-bridge/container/index';

// Mock the hostBridge module
jest.mock('../../../integrations/docker/host-bridge/container/index', () => ({
  hostBridge: {
    speech_say: jest.fn(),
    speech_say_nowait: jest.fn(),
    isHostDaemonRunning: jest.fn(),
    getServicesStatus: jest.fn()
  }
}));

describe('SystemTTSProvider', () => {
  let provider: SystemTTSProvider;
  let mockHostBridge: jest.Mocked<typeof hostBridge>;

  beforeEach(() => {
    provider = new SystemTTSProvider();
    mockHostBridge = hostBridge as jest.Mocked<typeof hostBridge>;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Interface Compliance', () => {
    test('should implement TTSProvider interface', () => {
      expect(provider.name).toBe('system');
      expect(typeof provider.speak).toBe('function');
      expect(typeof provider.isAvailable).toBe('function');
    });

    test('should have readonly name property', () => {
      // TypeScript readonly is enforced at compile-time
      expect(provider.name).toBe('system');
      expect(typeof provider.name).toBe('string');
    });
  });

  describe('Basic TTS Operations', () => {
    test('should speak message successfully', async () => {
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('test message');

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith('test message', undefined, undefined);
      expect(result).toMatchObject({
        success: true,
        provider: 'system'
      });
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    test('should pass voice and rate options', async () => {
      mockHostBridge.speech_say.mockResolvedValue(true);

      await provider.speak('test message', {
        voice: 'Zoe',
        rate: 1.5
      });

      expect(mockHostBridge.speech_say).toHaveBeenCalledWith('test message', 'Zoe', 1.5);
    });

    test('should include additional options in result', async () => {
      mockHostBridge.speech_say.mockResolvedValue(true);

      const result = await provider.speak('test message', {
        volume: 0.8,
        language: 'en-US'
      });

      expect(result.volume).toBe(0.8);
      expect(result.language).toBe('en-US');
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
          expect(error.provider).toBe('system');
        }
      }
    });

    test('should handle host-bridge speech failures', async () => {
      mockHostBridge.speech_say.mockRejectedValue(new Error('Host daemon offline'));

      await expect(provider.speak('test message')).rejects.toThrow(TTSError);
      
      try {
        await provider.speak('test message');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('SYSTEM_TTS_FAILED');
          expect(error.message).toContain('Host daemon offline');
          expect(error.provider).toBe('system');
          expect(error.originalError).toBeInstanceOf(Error);
        }
      }
    });

    test('should return false success when host-bridge returns false', async () => {
      mockHostBridge.speech_say.mockResolvedValue(false);

      const result = await provider.speak('test message');

      expect(result.success).toBe(false);
      expect(result.provider).toBe('system');
    });
  });

  describe('NoWait Operations', () => {
    test('should perform nowait speech operation', async () => {
      mockHostBridge.speech_say_nowait.mockImplementation(() => {});

      const result = await provider.speakNoWait('test message');

      expect(mockHostBridge.speech_say_nowait).toHaveBeenCalledWith('test message', undefined, undefined);
      expect(result).toEqual({
        success: true,
        provider: 'system'
      });
    });

    test('should pass options to nowait operation', async () => {
      mockHostBridge.speech_say_nowait.mockImplementation(() => {});

      const result = await provider.speakNoWait('test message', {
        voice: 'Alex',
        rate: 2.0,
        volume: 0.5,
        language: 'en-GB'
      });

      expect(mockHostBridge.speech_say_nowait).toHaveBeenCalledWith('test message', 'Alex', 2.0);
      expect(result.volume).toBe(0.5);
      expect(result.language).toBe('en-GB');
    });

    test('should reject empty messages in nowait', async () => {
      await expect(provider.speakNoWait('')).rejects.toThrow(TTSError);
      
      try {
        await provider.speakNoWait('   ');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('INVALID_MESSAGE');
        }
      }
    });

    test('should handle nowait operation failures', async () => {
      mockHostBridge.speech_say_nowait.mockImplementation(() => {
        throw new Error('Queue write failed');
      });

      await expect(provider.speakNoWait('test message')).rejects.toThrow(TTSError);
      
      try {
        await provider.speakNoWait('test message');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('SYSTEM_TTS_FAILED');
          expect(error.message).toContain('nowait failed');
          expect(error.message).toContain('Queue write failed');
        }
      }
    });
  });

  describe('Availability Checking', () => {
    test('should return true when daemon running and speech enabled', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { enabled: true, timeout: 30000, description: 'TTS Service', voice: 'system' },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const available = await provider.isAvailable();

      expect(available).toBe(true);
      expect(mockHostBridge.isHostDaemonRunning).toHaveBeenCalled();
      expect(mockHostBridge.getServicesStatus).toHaveBeenCalled();
    });

    test('should return false when daemon not running', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(false);

      const available = await provider.isAvailable();

      expect(available).toBe(false);
      expect(mockHostBridge.getServicesStatus).not.toHaveBeenCalled();
    });

    test('should return false when speech service disabled', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { enabled: false, timeout: 30000, description: 'TTS Service', voice: 'system' },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should return false when daemon check throws error', async () => {
      mockHostBridge.isHostDaemonRunning.mockRejectedValue(new Error('Check failed'));

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });

    test('should return false when services status throws error', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockImplementation(() => {
        throw new Error('Config read failed');
      });

      const available = await provider.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe('Status Information', () => {
    test('should return comprehensive status when all services available', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockReturnValue({
        speech: { 
          enabled: true, 
          timeout: 30000, 
          description: 'TTS Service',
          voice: 'Zoe'
        },
        vscode: { enabled: true, timeout: 10000, description: 'VS Code', command: 'code', path_translation: true },
        audio: { enabled: true, timeout: 5000, description: 'Audio', sounds_dir: '/sounds' }
      });

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: true,
        daemonRunning: true,
        serviceEnabled: true,
        voice: 'Zoe',
        timeout: 30000
      });
    });

    test('should return limited status when daemon not running', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(false);

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: false,
        daemonRunning: false,
        serviceEnabled: false
      });
    });

    test('should handle daemon running but services unavailable', async () => {
      mockHostBridge.isHostDaemonRunning.mockResolvedValue(true);
      mockHostBridge.getServicesStatus.mockImplementation(() => {
        throw new Error('Services config unavailable');
      });

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: false,
        daemonRunning: true,
        serviceEnabled: false
      });
    });

    test('should handle complete failure gracefully', async () => {
      mockHostBridge.isHostDaemonRunning.mockRejectedValue(new Error('Total failure'));

      const status = await provider.getStatus();

      expect(status).toEqual({
        available: false,
        daemonRunning: false,
        serviceEnabled: false
      });
    });
  });

  describe('Error Handling', () => {
    test('should preserve error context in TTSError', async () => {
      const originalError = new Error('Network timeout');
      mockHostBridge.speech_say.mockRejectedValue(originalError);

      try {
        await provider.speak('test');
      } catch (error) {
        if (error instanceof TTSError) {
          expect(error.code).toBe('SYSTEM_TTS_FAILED');
          expect(error.provider).toBe('system');
          expect(error.originalError).toBe(originalError);
          expect(error.message).toContain('Network timeout');
        }
      }
    });

    test('should handle non-Error exceptions', async () => {
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
  });
});