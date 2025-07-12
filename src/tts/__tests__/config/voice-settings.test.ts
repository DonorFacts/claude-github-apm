/**
 * Voice Settings Manager Tests
 * Comprehensive test suite for voice configuration management
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { VoiceSettingsManager } from '../../config/voice-settings';
import { VoiceSettings, parseVoiceSettings } from '../../../config/schemas/voice-settings-schema';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('VoiceSettingsManager', () => {
  let manager: VoiceSettingsManager;
  let testConfigDir: string;
  let testConfigFile: string;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup test environment
    testConfigDir = '/test/config';
    testConfigFile = path.join(testConfigDir, '.apm-voice-settings.json');
    
    // Create manager instance with test directory
    manager = new VoiceSettingsManager(testConfigDir);
    
    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('loadSettings', () => {
    test('should load valid settings file', async () => {
      const validSettings = {
        defaultVoice: 'Victoria',
        voiceSettings: {
          rate: 180,
          volume: 0.9
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validSettings));

      const settings = await manager.loadSettings();

      expect(settings.defaultVoice).toBe('Victoria');
      expect(settings.voiceSettings.rate).toBe(180);
      expect(settings.voiceSettings.volume).toBe(0.9);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(testConfigFile, 'utf8');
    });

    test('should apply defaults for missing fields', async () => {
      const partialSettings = {
        defaultVoice: 'Custom'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(partialSettings));

      const settings = await manager.loadSettings();

      expect(settings.defaultVoice).toBe('Custom');
      expect(settings.voiceSettings.rate).toBe(200); // default value
      expect(settings.contextualVoices.success).toBe('Samantha'); // default value
      expect(settings.mistralSettings.enableForHooks).toBe(true); // default value
    });

    test('should return defaults when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const settings = await manager.loadSettings();

      expect(settings.defaultVoice).toBe('Samantha');
      expect(settings.voiceSettings.rate).toBe(200);
      expect(settings.voiceSettings.volume).toBe(0.8);
      expect(settings.hookIntegration.enableAutoSpeech).toBe(true);
    });

    test('should handle malformed JSON gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ invalid json }');

      const settings = await manager.loadSettings();

      // Should fall back to defaults
      expect(settings.defaultVoice).toBe('Samantha');
      expect(settings.voiceSettings.rate).toBe(200);
    });

    test('should cache settings with TTL', async () => {
      const validSettings = { defaultVoice: 'Alex' };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(validSettings));

      // First call should read file
      await manager.loadSettings();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);

      // Second call should use cache
      mockFs.readFileSync.mockClear();
      await manager.loadSettings();
      expect(mockFs.readFileSync).not.toHaveBeenCalled();

      // Fast-forward past TTL (30 seconds)
      jest.advanceTimersByTime(31000);

      // Third call should reload from file
      await manager.loadSettings();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('saveSettings', () => {
    test('should save valid settings', async () => {
      const validSettings: VoiceSettings = {
        defaultVoice: 'Daniel',
        voiceSettings: {
          rate: 220,
          volume: 0.7
        },
        contextualVoices: {
          success: 'Samantha',
          error: 'Daniel',
          info: 'Victoria',
          progress: 'Alex',
          completion: 'Samantha'
        },
        mistralSettings: {
          enableForHooks: true,
          summarizationPrompts: {
            code: 'Custom code prompt',
            error: 'Custom error prompt',
            progress: 'Custom progress prompt',
            completion: 'Custom completion prompt'
          },
          contextDepth: 'moderate',
          maxTokens: 150
        },
        hookIntegration: {
          enableAutoSpeech: true,
          speakOnTaskCompletion: true,
          speakOnErrors: false,
          speakOnProgress: 'major_only',
          debounceMs: 750
        }
      };

      const result = await manager.saveSettings(validSettings);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testConfigFile,
        expect.stringMatching(/.*Daniel.*/),
        'utf8'
      );
    });

    test('should reject invalid settings', async () => {
      const invalidSettings = {
        defaultVoice: 'Test',
        voiceSettings: {
          rate: 9999, // Invalid: exceeds max of 720
          volume: 0.5
        }
      } as VoiceSettings;

      const result = await manager.saveSettings(invalidSettings);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid settings');
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should handle file write errors', async () => {
      const validSettings: Partial<VoiceSettings> = {
        defaultVoice: 'Test'
      };

      // Cast to VoiceSettings to bypass TypeScript validation for test
      const settingsToSave = validSettings as VoiceSettings;
      
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await manager.saveSettings(settingsToSave);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('createDefaultSettings', () => {
    test('should create default settings file when it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.writeFileSync.mockImplementation(() => {}); // Mock successful write

      const result = await manager.createDefaultSettings();

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    test('should not overwrite existing settings file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = await manager.createDefaultSettings();

      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    test('should merge partial updates with existing settings', async () => {
      // Setup existing settings
      const existingSettings = {
        defaultVoice: 'Original',
        voiceSettings: { rate: 200, volume: 0.8 }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(existingSettings));
      mockFs.writeFileSync.mockImplementation(() => {}); // Mock successful write

      // Update only the voice
      const updates = { defaultVoice: 'Updated' };
      const result = await manager.updateSettings(updates);

      expect(result.success).toBe(true);
      
      // Should preserve other settings while updating specified field
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const savedSettings = JSON.parse(writeCall[1] as string);
      expect(savedSettings.defaultVoice).toBe('Updated');
      expect(savedSettings.voiceSettings.rate).toBe(200); // Preserved
    });
  });

  describe('getStatus', () => {
    test('should return complete status information', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"defaultVoice": "Test"}');

      const status = await manager.getStatus();

      expect(status.configFileExists).toBe(true);
      expect(status.configFilePath).toBe(testConfigFile);
      expect(status.settingsValid).toBe(true);
      expect(status.validationErrors).toBeUndefined();
    });

    test('should detect invalid settings file', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ invalid json }');

      const status = await manager.getStatus();

      expect(status.configFileExists).toBe(true);
      expect(status.settingsValid).toBe(false);
      expect(status.validationErrors).toBeDefined();
      expect(status.validationErrors!.length).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    test('should clear cache when requested', async () => {
      const settings = { defaultVoice: 'Test' };
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(settings));

      // Load settings to populate cache
      await manager.loadSettings();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);

      // Clear cache
      manager.clearCache();

      // Next load should read file again
      mockFs.readFileSync.mockClear();
      await manager.loadSettings();
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });
});

describe('VoiceSettings Schema Validation', () => {
  test('should validate complete valid settings', () => {
    const validSettings = {
      defaultVoice: 'Samantha',
      voiceSettings: {
        rate: 200,
        volume: 0.8
      },
      contextualVoices: {
        success: 'Samantha',
        error: 'Daniel',
        info: 'Victoria',
        progress: 'Alex',
        completion: 'Samantha'
      },
      mistralSettings: {
        enableForHooks: true,
        summarizationPrompts: {
          code: 'Code prompt',
          error: 'Error prompt',
          progress: 'Progress prompt',
          completion: 'Completion prompt'
        },
        contextDepth: 'moderate' as const,
        maxTokens: 200
      },
      hookIntegration: {
        enableAutoSpeech: true,
        speakOnTaskCompletion: true,
        speakOnErrors: true,
        speakOnProgress: 'major_only' as const,
        debounceMs: 500
      }
    };

    const result = parseVoiceSettings(validSettings);
    expect(result.success).toBe(true);
    
    if (result.success) {
      expect(result.data.defaultVoice).toBe('Samantha');
      expect(result.data.voiceSettings.rate).toBe(200);
    }
  });

  test('should reject invalid rate values', () => {
    const invalidSettings = {
      voiceSettings: {
        rate: 5000, // Too high
        volume: 0.8
      }
    };

    const result = parseVoiceSettings(invalidSettings);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.issues.some(issue => issue.includes('rate'))).toBe(true);
    }
  });

  test('should reject invalid volume values', () => {
    const invalidSettings = {
      voiceSettings: {
        rate: 200,
        volume: 2.0 // Too high (max is 1.0)
      }
    };

    const result = parseVoiceSettings(invalidSettings);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.issues.some(issue => issue.includes('volume'))).toBe(true);
    }
  });

  test('should reject invalid contextDepth values', () => {
    const invalidSettings = {
      mistralSettings: {
        contextDepth: 'invalid_depth'
      }
    };

    const result = parseVoiceSettings(invalidSettings);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      // Check that there's an error related to contextDepth
      expect(result.issues.some(issue => 
        issue.includes('contextDepth')
      )).toBe(true);
    }
  });
});