/**
 * Ollama Configuration Management
 * Handles configuration loading and validation for Ollama integration
 */

import { OllamaConfig } from '../core/interfaces';

/**
 * Default Ollama configuration
 */
export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'mistral:7b',
  timeout: 30000,
  maxTokens: 1000,
  temperature: 0.7
};

/**
 * Load Ollama configuration from environment variables with defaults
 */
export function loadOllamaConfig(): OllamaConfig {
  const config: OllamaConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_CONFIG.baseUrl,
    model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_CONFIG.model,
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || String(DEFAULT_OLLAMA_CONFIG.timeout)),
    maxTokens: process.env.OLLAMA_MAX_TOKENS 
      ? parseInt(process.env.OLLAMA_MAX_TOKENS) 
      : DEFAULT_OLLAMA_CONFIG.maxTokens,
    temperature: process.env.OLLAMA_TEMPERATURE 
      ? parseFloat(process.env.OLLAMA_TEMPERATURE) 
      : DEFAULT_OLLAMA_CONFIG.temperature
  };

  validateOllamaConfig(config);
  return config;
}

/**
 * Validate Ollama configuration
 */
export function validateOllamaConfig(config: OllamaConfig): void {
  // Validate base URL format
  try {
    new URL(config.baseUrl);
  } catch (error) {
    throw new Error(`Invalid Ollama base URL: ${config.baseUrl}`);
  }

  // Validate model name format
  if (!config.model || config.model.trim().length === 0) {
    throw new Error('Ollama model name cannot be empty');
  }

  // Validate timeout
  if (!Number.isInteger(config.timeout) || config.timeout <= 0) {
    throw new Error(`Timeout must be a positive integer, got: ${config.timeout}`);
  }

  // Validate optional fields
  if (config.maxTokens !== undefined) {
    if (!Number.isInteger(config.maxTokens) || config.maxTokens <= 0) {
      throw new Error(`Max tokens must be a positive integer, got: ${config.maxTokens}`);
    }
  }

  if (config.temperature !== undefined) {
    if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
      throw new Error(`Temperature must be a number between 0 and 2, got: ${config.temperature}`);
    }
  }
}

/**
 * Create Ollama configuration for testing
 */
export function createTestOllamaConfig(overrides: Partial<OllamaConfig> = {}): OllamaConfig {
  return {
    ...DEFAULT_OLLAMA_CONFIG,
    ...overrides
  };
}

/**
 * Get configuration summary for logging/debugging
 */
export function getOllamaConfigSummary(config: OllamaConfig): Record<string, any> {
  return {
    baseUrl: config.baseUrl,
    model: config.model,
    timeout: `${config.timeout}ms`,
    maxTokens: config.maxTokens,
    temperature: config.temperature
  };
}