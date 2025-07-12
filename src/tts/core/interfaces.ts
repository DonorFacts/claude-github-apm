/**
 * TTS Core Interfaces
 * Type-safe abstractions for Text-to-Speech providers
 */

/**
 * Core TTS provider interface for pluggable implementations
 */
export interface TTSProvider {
  readonly name: string;
  speak(message: string, options?: TTSOptions): Promise<TTSResult>;
  isAvailable(): Promise<boolean>;
}

/**
 * TTS configuration options
 */
export interface TTSOptions {
  voice?: string;
  rate?: number;
  volume?: number;
  language?: string;
}

/**
 * Standardized TTS operation result
 */
export interface TTSResult {
  success: boolean;
  duration?: number;
  error?: string;
  audioData?: Buffer;
  provider?: string;
  // Echo back options used for the operation
  voice?: string;
  rate?: number;
  volume?: number;
  language?: string;
}

/**
 * Ollama-specific configuration interface
 */
export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Typed error class for TTS operations
 */
export class TTSError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly provider?: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

/**
 * TTS service configuration
 */
export interface TTSServiceConfig {
  defaultProvider?: string;
  fallbackProvider?: string;
  enableActivityTracking?: boolean;
  providers: {
    system?: {
      enabled: boolean;
    };
    mistral?: {
      enabled: boolean;
      ollama: OllamaConfig;
    };
  };
}