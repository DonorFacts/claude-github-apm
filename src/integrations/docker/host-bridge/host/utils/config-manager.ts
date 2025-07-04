/**
 * Configuration Manager
 * Manages services.json configuration file
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ServicesConfig } from '../../shared/types';

export class ConfigManager {
  private readonly configFile: string;
  
  constructor(configDir: string) {
    this.configFile = path.join(configDir, 'services.json');
  }
  
  /**
   * Load or create the services configuration
   */
  loadOrCreateConfig(): ServicesConfig {
    if (fs.existsSync(this.configFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      } catch (error) {
        console.error('Failed to parse services.json, creating new config');
      }
    }
    
    // Create default configuration
    const defaultConfig: ServicesConfig = {
      vscode: {
        enabled: true,
        timeout: 10000,
        description: 'VS Code integration',
        command: 'code',
        path_translation: true
      },
      audio: {
        enabled: true,
        timeout: 5000,
        description: 'Audio notifications',
        sounds_dir: '/System/Library/Sounds'
      },
      speech: {
        enabled: true,
        timeout: 30000,
        description: 'Text-to-speech',
        voice: 'system'
      }
    };
    
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }
  
  /**
   * Save the services configuration
   */
  saveConfig(config: ServicesConfig): void {
    fs.writeFileSync(
      this.configFile,
      JSON.stringify(config, null, 2)
    );
  }
}