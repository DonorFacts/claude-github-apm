/**
 * Voice Settings Manager - Handles .apm-voice-settings.json configuration
 * Provides cached access to voice configuration with TTL and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import { VoiceSettings, parseVoiceSettings, parseVoiceSettingsWithDefaults } from '../../config/schemas/voice-settings-schema';

interface CachedSettings {
  settings: VoiceSettings;
  timestamp: number;
}

export class VoiceSettingsManager {
  private readonly configFile: string;
  private cache: CachedSettings | null = null;
  private readonly cacheTTLMs = 30000; // 30 seconds TTL as specified in PRP

  constructor(configDir?: string) {
    // Default to project root, following the pattern from the PRP
    const baseDir = configDir || process.cwd();
    this.configFile = path.join(baseDir, '.apm-voice-settings.json');
  }

  /**
   * Load voice settings with caching and validation
   */
  async loadSettings(): Promise<VoiceSettings> {
    // Check cache first
    if (this.cache && this.isCacheValid()) {
      return this.cache.settings;
    }

    try {
      let rawData: unknown = {};

      // Read file if it exists
      if (fs.existsSync(this.configFile)) {
        const fileContent = fs.readFileSync(this.configFile, 'utf8');
        rawData = JSON.parse(fileContent);
      }

      // Parse and validate with defaults
      const settings = parseVoiceSettingsWithDefaults(rawData);

      // Update cache
      this.cache = {
        settings,
        timestamp: Date.now()
      };

      return settings;

    } catch (error) {
      console.warn(`[VoiceSettings] Failed to load settings from ${this.configFile}:`, error);
      
      // Return defaults on error, but don't cache this result
      return parseVoiceSettingsWithDefaults({});
    }
  }

  /**
   * Save settings to file with validation
   */
  async saveSettings(settings: VoiceSettings): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate settings before saving
      const validationResult = parseVoiceSettings(settings);
      if (!validationResult.success) {
        return {
          success: false,
          error: `Invalid settings: ${validationResult.issues.join(', ')}`
        };
      }

      // Write to file with pretty formatting
      const fileContent = JSON.stringify(validationResult.data, null, 2);
      fs.writeFileSync(this.configFile, fileContent, 'utf8');

      // Update cache
      this.cache = {
        settings: validationResult.data,
        timestamp: Date.now()
      };

      return { success: true };

    } catch (error) {
      const errorMessage = `Failed to save settings: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[VoiceSettings] ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get the path to the settings file
   */
  getConfigFilePath(): string {
    return this.configFile;
  }

  /**
   * Check if settings file exists
   */
  configFileExists(): boolean {
    return fs.existsSync(this.configFile);
  }

  /**
   * Create default settings file if it doesn't exist
   */
  async createDefaultSettings(): Promise<{ success: boolean; error?: string; created: boolean }> {
    if (this.configFileExists()) {
      return { success: true, created: false };
    }

    try {
      // Load defaults (this will generate a complete default configuration)
      const defaultSettings = parseVoiceSettingsWithDefaults({});
      
      // Save the defaults
      const saveResult = await this.saveSettings(defaultSettings);
      
      if (saveResult.success) {
        return { success: true, created: true };
      } else {
        return { success: false, error: saveResult.error, created: false };
      }

    } catch (error) {
      const errorMessage = `Failed to create default settings: ${error instanceof Error ? error.message : String(error)}`;
      return { success: false, error: errorMessage, created: false };
    }
  }

  /**
   * Clear the cache to force reload on next access
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Update specific settings without overwriting the entire configuration
   */
  async updateSettings(updates: Partial<VoiceSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      // Load current settings
      const currentSettings = await this.loadSettings();
      
      // Merge updates with current settings
      const updatedSettings = { ...currentSettings, ...updates };
      
      // Save the merged settings
      return await this.saveSettings(updatedSettings);

    } catch (error) {
      const errorMessage = `Failed to update settings: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`[VoiceSettings] ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get settings status for debugging
   */
  async getStatus(): Promise<{
    configFileExists: boolean;
    configFilePath: string;
    cacheValid: boolean;
    lastCacheUpdate?: number;
    settingsValid: boolean;
    validationErrors?: string[];
  }> {
    const status = {
      configFileExists: this.configFileExists(),
      configFilePath: this.configFile,
      cacheValid: this.isCacheValid(),
      lastCacheUpdate: this.cache?.timestamp,
      settingsValid: true,
      validationErrors: undefined as string[] | undefined
    };

    // Test settings validity if file exists
    if (status.configFileExists) {
      try {
        const fileContent = fs.readFileSync(this.configFile, 'utf8');
        const rawData = JSON.parse(fileContent);
        const validationResult = parseVoiceSettings(rawData);
        
        if (!validationResult.success) {
          status.settingsValid = false;
          status.validationErrors = validationResult.issues;
        }
      } catch (error) {
        status.settingsValid = false;
        status.validationErrors = [`File read/parse error: ${error instanceof Error ? error.message : String(error)}`];
      }
    }

    return status;
  }

  /**
   * Check if cached settings are still valid based on TTL
   */
  private isCacheValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const age = Date.now() - this.cache.timestamp;
    return age < this.cacheTTLMs;
  }
}

// Export a singleton instance for convenience
export const voiceSettingsManager = new VoiceSettingsManager();