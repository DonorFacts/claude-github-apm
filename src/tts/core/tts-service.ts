/**
 * TTS Service - Provider orchestrator with fallback support
 * Manages multiple TTS providers and handles graceful degradation
 */

import { TTSProvider, TTSResult, TTSOptions, TTSError, TTSServiceConfig } from './interfaces';
import { SessionFileManager } from '../../sessions/management/session-file-manager';

export class TTSService {
  private providers = new Map<string, TTSProvider>();
  private config: TTSServiceConfig;
  private sessionManager?: SessionFileManager;

  constructor(config: TTSServiceConfig = { providers: {} }) {
    this.config = {
      defaultProvider: 'system',
      fallbackProvider: 'system',
      enableActivityTracking: true,
      ...config
    };

    // Initialize session manager for activity tracking if enabled
    if (this.config.enableActivityTracking && process.env.APM_SESSION_ID) {
      try {
        const sessionsDir = process.env.APM_SESSIONS || 'apm/sessions';
        this.sessionManager = new SessionFileManager(sessionsDir);
      } catch (error) {
        // Silent fail - activity tracking is optional
      }
    }
  }

  /**
   * Register a TTS provider
   */
  registerProvider(provider: TTSProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Unregister a TTS provider
   */
  unregisterProvider(providerName: string): boolean {
    return this.providers.delete(providerName);
  }

  /**
   * Get available provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * Main TTS operation with provider selection and fallback
   */
  async speak(
    message: string, 
    providerName?: string, 
    options?: TTSOptions
  ): Promise<TTSResult> {
    if (!message || message.trim().length === 0) {
      throw new TTSError('INVALID_MESSAGE', 'Message cannot be empty');
    }

    // Update activity tracking before TTS operation
    await this.updateActivityTracking();

    const targetProviderName = providerName || this.config.defaultProvider || 'system';
    const provider = this.selectProvider(targetProviderName);

    try {
      // Check if primary provider is available
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new TTSError(
          'PROVIDER_UNAVAILABLE',
          `Provider '${provider.name}' is not available`,
          provider.name
        );
      }

      // Attempt TTS with primary provider
      const result = await provider.speak(message, options);
      
      // Ensure result includes provider name
      return {
        ...result,
        provider: provider.name
      };

    } catch (error) {
      // Attempt fallback if primary provider fails and fallback is configured
      if (this.config.fallbackProvider && 
          this.config.fallbackProvider !== targetProviderName && 
          this.providers.has(this.config.fallbackProvider)) {
        
        try {
          const fallbackProvider = this.providers.get(this.config.fallbackProvider)!;
          const fallbackAvailable = await fallbackProvider.isAvailable();
          
          if (fallbackAvailable) {
            const fallbackResult = await fallbackProvider.speak(message, options);
            return {
              ...fallbackResult,
              provider: fallbackProvider.name,
              error: `Primary provider '${provider.name}' failed, used fallback '${fallbackProvider.name}'`
            };
          }
        } catch (fallbackError) {
          // Both providers failed, throw enhanced error
          throw new TTSError(
            'ALL_PROVIDERS_FAILED',
            `Primary provider '${provider.name}' and fallback '${this.config.fallbackProvider}' both failed`,
            provider.name,
            error instanceof Error ? error : new Error(String(error))
          );
        }
      }

      // No fallback available or fallback also failed
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        'SPEAK_FAILED',
        `TTS operation failed: ${error instanceof Error ? error.message : String(error)}`,
        provider.name,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check availability of a specific provider
   */
  async isProviderAvailable(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    try {
      return await provider.isAvailable();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get service status and provider information
   */
  async getStatus(): Promise<{
    providers: Array<{ name: string; available: boolean }>;
    defaultProvider: string;
    fallbackProvider?: string;
    activityTrackingEnabled: boolean;
  }> {
    const providerStatuses = await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => ({
        name,
        available: await this.isProviderAvailable(name)
      }))
    );

    return {
      providers: providerStatuses,
      defaultProvider: this.config.defaultProvider || 'system',
      fallbackProvider: this.config.fallbackProvider,
      activityTrackingEnabled: !!this.sessionManager
    };
  }

  /**
   * Select provider with validation
   */
  private selectProvider(providerName: string): TTSProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      const availableProviders = this.getAvailableProviders();
      throw new TTSError(
        'PROVIDER_NOT_FOUND',
        `Provider '${providerName}' not found. Available providers: ${availableProviders.join(', ')}`
      );
    }
    return provider;
  }

  /**
   * Update agent activity tracking
   */
  private async updateActivityTracking(): Promise<void> {
    if (!this.sessionManager || !process.env.APM_SESSION_ID) {
      return;
    }

    try {
      this.sessionManager.updateActivityTimestamps(process.env.APM_SESSION_ID, true, false);
    } catch (error) {
      // Silent fail - don't break TTS if activity tracking fails
    }
  }
}