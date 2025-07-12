/**
 * Hook Handler Tests
 * Comprehensive test suite for TTS hook event processing
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HookHandler } from '../../hooks/hook-handler';
import { TTSHookEvent } from '../../../config/schemas/voice-settings-schema';
import { VoiceSettingsManager } from '../../config/voice-settings';
import { ContentAnalyzer } from '../../core/content-analyzer';
import { TTSService } from '../../core/tts-service';

// Mock dependencies
jest.mock('../../config/voice-settings');
jest.mock('../../core/content-analyzer');
jest.mock('../../core/tts-service');
jest.mock('../../providers/system-tts');
jest.mock('../../providers/mistral-tts');

const mockVoiceSettingsManager = VoiceSettingsManager as jest.MockedClass<typeof VoiceSettingsManager>;
const mockContentAnalyzer = ContentAnalyzer as jest.MockedClass<typeof ContentAnalyzer>;
const mockTTSService = TTSService as jest.MockedClass<typeof TTSService>;

describe('HookHandler', () => {
  let handler: HookHandler;
  let mockSettings: any;
  let mockAnalysis: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup default mock settings
    mockSettings = {
      hookIntegration: {
        enableAutoSpeech: true,
        speakOnTaskCompletion: true,
        speakOnErrors: true,
        speakOnProgress: 'major_only',
        debounceMs: 500
      },
      contextualVoices: {
        code: 'Victoria',
        error: 'Daniel',
        completion: 'Samantha',
        progress: 'Alex',
        info: 'Victoria'
      },
      defaultVoice: 'Samantha',
      voiceSettings: {
        rate: 200,
        volume: 0.8
      },
      mistralSettings: {
        enableForHooks: true,
        summarizationPrompts: {
          code: 'Test code prompt',
          error: 'Test error prompt',
          progress: 'Test progress prompt',
          completion: 'Test completion prompt'
        }
      }
    };

    // Setup default mock analysis
    mockAnalysis = {
      contentType: 'code',
      complexity: 'technical',
      priority: 'medium',
      suggestedProvider: 'mistral',
      suggestedVoice: 'Victoria',
      technicalElements: {
        filePaths: ['src/test.ts'],
        codeSnippets: ['function'],
        errorMessages: [],
        metrics: {}
      }
    };

    // Mock VoiceSettingsManager
    const mockSettingsInstance = {
      loadSettings: jest.fn<() => Promise<any>>().mockResolvedValue(mockSettings)
    };
    mockVoiceSettingsManager.mockImplementation(() => mockSettingsInstance as any);

    // Mock ContentAnalyzer
    const mockAnalyzerInstance = {
      analyzeContent: jest.fn<(content: string) => any>().mockReturnValue(mockAnalysis)
    };
    mockContentAnalyzer.mockImplementation(() => mockAnalyzerInstance as any);

    // Mock TTSService
    const mockTTSServiceInstance = {
      registerProvider: jest.fn<(provider: any) => void>(),
      hasProvider: jest.fn<(name: string) => boolean>().mockReturnValue(true),
      isProviderAvailable: jest.fn<(name: string) => Promise<boolean>>().mockResolvedValue(true),
      speak: jest.fn<(message: string, provider?: string, options?: any) => Promise<any>>().mockResolvedValue({ success: true }),
      getStatus: jest.fn<() => Promise<any>>().mockResolvedValue({ providers: [] }),
      getAvailableProviders: jest.fn<() => string[]>().mockReturnValue(['system', 'mistral'])
    };
    mockTTSService.mockImplementation(() => mockTTSServiceInstance as any);

    // Create handler instance
    handler = new HookHandler();
  });

  afterEach(() => {
    jest.useRealTimers();
    handler.dispose();
  });

  describe('handleHookEvent', () => {
    test('should process valid hook event', async () => {
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed successfully',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);

      // Fast-forward past debounce time
      jest.advanceTimersByTime(600);

      // Allow promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify content was analyzed
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('Task completed successfully');
    });

    test('should respect enableAutoSpeech setting', async () => {
      // Disable auto speech
      mockSettings.hookIntegration.enableAutoSpeech = false;

      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);

      // TTS should not be called
      expect(mockTTSService.prototype.speak).not.toHaveBeenCalled();
    });

    test('should handle error events when enabled', async () => {
      const event: TTSHookEvent = {
        type: 'error',
        content: 'An error occurred',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('An error occurred');
    });

    test('should skip error events when disabled', async () => {
      mockSettings.hookIntegration.speakOnErrors = false;

      const event: TTSHookEvent = {
        type: 'error',
        content: 'An error occurred',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);

      expect(mockTTSService.prototype.speak).not.toHaveBeenCalled();
    });

    test('should handle progress events based on settings', async () => {
      // Test major_only setting with high priority
      const highPriorityEvent: TTSHookEvent = {
        type: 'progress',
        content: 'Critical progress update',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now(),
          priority: 'high'
        }
      };

      await handler.handleHookEvent(highPriorityEvent);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('Critical progress update');

      // Reset mocks
      jest.clearAllMocks();

      // Test major_only setting with low priority (should be skipped)
      const lowPriorityEvent: TTSHookEvent = {
        type: 'progress',
        content: 'Minor progress update',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now(),
          priority: 'low'
        }
      };

      await handler.handleHookEvent(lowPriorityEvent);
      jest.advanceTimersByTime(600);

      expect(mockTTSService.prototype.speak).not.toHaveBeenCalled();
    });
  });

  describe('debouncing', () => {
    test('should debounce rapid events', async () => {
      const event1: TTSHookEvent = {
        type: 'progress',
        content: 'Progress 1',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now(),
          priority: 'high'
        }
      };

      const event2: TTSHookEvent = {
        type: 'progress',
        content: 'Progress 2',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now(),
          priority: 'high'
        }
      };

      // Send two rapid events
      await handler.handleHookEvent(event1);
      await handler.handleHookEvent(event2);

      // Fast-forward past debounce time
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Should only process the last event
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledTimes(1);
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('Progress 2');
    });

    test('should handle different session IDs separately', async () => {
      const event1: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task 1 completed',
        metadata: {
          sessionId: 'session-1',
          timestamp: Date.now()
        }
      };

      const event2: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task 2 completed',
        metadata: {
          sessionId: 'session-2',
          timestamp: Date.now()
        }
      };

      // Send events for different sessions
      await handler.handleHookEvent(event1);
      await handler.handleHookEvent(event2);

      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Both events should be processed (different sessions)
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledTimes(2);
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('Task 1 completed');
      expect(mockContentAnalyzer.prototype.analyzeContent).toHaveBeenCalledWith('Task 2 completed');
    });
  });

  describe('voice selection', () => {
    test('should select appropriate voice based on content type', async () => {
      // Test error content
      mockAnalysis.contentType = 'error';
      
      const event: TTSHookEvent = {
        type: 'error',
        content: 'Error occurred',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      // Verify TTS was called with error voice
      expect(mockTTSService.prototype.speak).toHaveBeenCalledWith(
        'Error occurred',
        'system', // provider
        expect.objectContaining({
          voice: 'Daniel' // error voice from settings
        })
      );
    });

    test('should fallback to default voice if content type voice not found', async () => {
      // Test unknown content type
      mockAnalysis.contentType = 'unknown' as any;
      
      const event: TTSHookEvent = {
        type: 'agent_response',
        content: 'Unknown content',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockTTSService.prototype.speak).toHaveBeenCalledWith(
        'Unknown content',
        'system',
        expect.objectContaining({
          voice: 'Samantha' // default voice
        })
      );
    });
  });

  describe('provider selection', () => {
    test('should use Mistral when suggested and enabled', async () => {
      mockAnalysis.suggestedProvider = 'mistral';
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Complex technical task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockTTSService.prototype.speak).toHaveBeenCalledWith(
        'Complex technical task completed',
        'mistral',
        expect.any(Object)
      );
    });

    test('should fallback to system when Mistral not available', async () => {
      mockAnalysis.suggestedProvider = 'mistral';
      
      // Mock Mistral as not available
      const mockTTSInstance = mockTTSService.mock.instances[0] as any;
      mockTTSInstance.isProviderAvailable.mockResolvedValue(false);
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Technical task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockTTSService.prototype.speak).toHaveBeenCalledWith(
        'Technical task completed',
        'system', // fallback to system
        expect.any(Object)
      );
    });

    test('should use system when Mistral disabled in settings', async () => {
      mockSettings.mistralSettings.enableForHooks = false;
      mockAnalysis.suggestedProvider = 'mistral';
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      await handler.handleHookEvent(event);
      jest.advanceTimersByTime(600);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockTTSService.prototype.speak).toHaveBeenCalledWith(
        'Task completed',
        'system',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    test('should handle TTS service errors gracefully', async () => {
      // Mock TTS service to throw error
      const mockTTSInstance = mockTTSService.mock.instances[0] as any;
      mockTTSInstance.speak.mockRejectedValue(new Error('TTS failed'));
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      // Should not throw
      expect(async () => {
        await handler.handleHookEvent(event);
        jest.advanceTimersByTime(600);
        await new Promise(resolve => setTimeout(resolve, 0));
      }).not.toThrow();
    });

    test('should handle settings loading errors gracefully', async () => {
      // Mock settings manager to throw error
      const mockSettingsInstance = mockVoiceSettingsManager.mock.instances[0] as any;
      mockSettingsInstance.loadSettings.mockRejectedValue(new Error('Settings failed'));
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      // Should not throw
      expect(async () => {
        await handler.handleHookEvent(event);
        jest.advanceTimersByTime(600);
        await new Promise(resolve => setTimeout(resolve, 0));
      }).not.toThrow();
    });

    test('should handle content analysis errors gracefully', async () => {
      // Mock content analyzer to throw error
      const mockAnalyzerInstance = mockContentAnalyzer.mock.instances[0] as any;
      mockAnalyzerInstance.analyzeContent.mockImplementation(() => {
        throw new Error('Analysis failed');
      });
      
      const event: TTSHookEvent = {
        type: 'task_completion',
        content: 'Task completed',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now()
        }
      };

      // Should not throw
      expect(async () => {
        await handler.handleHookEvent(event);
        jest.advanceTimersByTime(600);
        await new Promise(resolve => setTimeout(resolve, 0));
      }).not.toThrow();
    });
  });

  describe('status and lifecycle', () => {
    test('should report enabled status correctly', async () => {
      const enabled = await handler.isEnabled();
      expect(enabled).toBe(true);

      // Test disabled state
      mockSettings.hookIntegration.enableAutoSpeech = false;
      const disabled = await handler.isEnabled();
      expect(disabled).toBe(false);
    });

    test('should provide comprehensive status information', async () => {
      const status = await handler.getStatus();

      expect(status).toEqual({
        initialized: expect.any(Boolean),
        settingsLoaded: true,
        ttsServiceStatus: expect.any(Object),
        activeDebounceTimers: 0,
        providers: ['system', 'mistral']
      });
    });

    test('should clean up timers on dispose', async () => {
      const event: TTSHookEvent = {
        type: 'progress',
        content: 'Progress update',
        metadata: {
          sessionId: 'test-session',
          timestamp: Date.now(),
          priority: 'high'
        }
      };

      // Create a debounced event
      await handler.handleHookEvent(event);

      // Verify timer exists
      const statusBefore = await handler.getStatus();
      expect(statusBefore.activeDebounceTimers).toBe(1);

      // Dispose handler
      handler.dispose();

      // Verify timers cleared
      const statusAfter = await handler.getStatus();
      expect(statusAfter.activeDebounceTimers).toBe(0);
    });
  });
});