/**
 * TTS Hook Handler - Core TTS event processing for hooks
 * 
 * Handles TTS hook events with content analysis, voice selection, and provider routing
 */

import { TTSHookEvent } from '../../config/schemas/voice-settings-schema';
import { VoiceSettingsManager } from '../config/voice-settings';
import { ContentAnalyzer } from '../core/content-analyzer';
import { TTSService } from '../core/tts-service';
import { SystemTTSProvider } from '../providers/system-tts';
import { MistralTTSProvider } from '../providers/mistral-tts';

interface DebounceTimer {
  timer: NodeJS.Timeout;
  lastEvent: TTSHookEvent;
}

export class HookHandler {
  private ttsService: TTSService;
  private contentAnalyzer: ContentAnalyzer;
  private settingsManager: VoiceSettingsManager;
  private debounceTimers = new Map<string, DebounceTimer>();
  private isInitialized = false;

  constructor() {
    this.contentAnalyzer = new ContentAnalyzer();
    this.settingsManager = new VoiceSettingsManager();
    this.ttsService = new TTSService({
      defaultProvider: 'system',
      fallbackProvider: 'system',
      enableActivityTracking: false, // Hooks already handle activity tracking
      providers: {}
    });

    // Initialize providers
    this.initializeProviders();
  }

  /**
   * Main hook event handler
   */
  async handleHookEvent(event: TTSHookEvent): Promise<void> {
    try {
      // Ensure initialization
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Load settings and check if hook integration is enabled
      const settings = await this.settingsManager.loadSettings();
      if (!settings.hookIntegration.enableAutoSpeech) {
        return;
      }

      // Check event type settings
      if (!this.shouldProcessEvent(event, settings)) {
        return;
      }

      // Handle debouncing
      await this.handleDebouncing(event, settings);

    } catch (error) {
      // Log error but don't throw - hooks should not break agent flow
      console.error('[TTS Hook Handler] Error processing event:', error);
    }
  }

  /**
   * Check if TTS integration is enabled
   */
  async isEnabled(): Promise<boolean> {
    try {
      const settings = await this.settingsManager.loadSettings();
      return settings.hookIntegration.enableAutoSpeech;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get handler status for debugging
   */
  async getStatus(): Promise<{
    initialized: boolean;
    settingsLoaded: boolean;
    ttsServiceStatus: any;
    activeDebounceTimers: number;
    providers: string[];
  }> {
    try {
      const settings = await this.settingsManager.loadSettings();
      const ttsStatus = await this.ttsService.getStatus();

      return {
        initialized: this.isInitialized,
        settingsLoaded: !!settings,
        ttsServiceStatus: ttsStatus,
        activeDebounceTimers: this.debounceTimers.size,
        providers: this.ttsService.getAvailableProviders()
      };
    } catch (error) {
      return {
        initialized: this.isInitialized,
        settingsLoaded: false,
        ttsServiceStatus: null,
        activeDebounceTimers: this.debounceTimers.size,
        providers: []
      };
    }
  }

  /**
   * Initialize TTS providers and system
   */
  private async initialize(): Promise<void> {
    try {
      // Check if providers are already registered
      if (this.ttsService.getAvailableProviders().length === 0) {
        await this.initializeProviders();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('[TTS Hook Handler] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize TTS providers
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Register system TTS provider
      const systemProvider = new SystemTTSProvider();
      this.ttsService.registerProvider(systemProvider);

      // Register Mistral TTS provider if available
      try {
        const mistralProvider = new MistralTTSProvider({
          baseUrl: 'http://localhost:11434',
          model: 'mistral:7b',
          timeout: 30000,
          temperature: 0.3,
          maxTokens: 200
        });

        // Only register if Mistral/Ollama is available
        const isAvailable = await mistralProvider.isAvailable();
        if (isAvailable) {
          this.ttsService.registerProvider(mistralProvider);
        }
      } catch (error) {
        // Mistral provider not available - continue with system TTS only
        console.warn('[TTS Hook Handler] Mistral provider not available:', error);
      }
    } catch (error) {
      console.error('[TTS Hook Handler] Provider initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if event should be processed based on settings
   */
  private shouldProcessEvent(event: TTSHookEvent, settings: any): boolean {
    switch (event.type) {
      case 'error':
        return settings.hookIntegration.speakOnErrors;
      
      case 'task_completion':
        return settings.hookIntegration.speakOnTaskCompletion;
      
      case 'progress':
        const progressSetting = settings.hookIntegration.speakOnProgress;
        if (progressSetting === 'none') return false;
        if (progressSetting === 'major_only') {
          // Consider high priority progress as "major"
          return event.metadata.priority === 'high';
        }
        return true; // 'all'
      
      case 'agent_response':
        // Always process agent responses if auto speech is enabled
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Handle debouncing logic
   */
  private async handleDebouncing(event: TTSHookEvent, settings: any): Promise<void> {
    const debounceKey = `${event.type}-${event.metadata.sessionId}`;
    const debounceMs = settings.hookIntegration.debounceMs || 500;

    // Clear existing timer if present
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer.timer);
    }

    // Create new debounced timer
    const timer = setTimeout(async () => {
      try {
        // Process the most recent event
        await this.processEvent(event, settings);
        
        // Clean up timer
        this.debounceTimers.delete(debounceKey);
      } catch (error) {
        console.error('[TTS Hook Handler] Error in debounced processing:', error);
        this.debounceTimers.delete(debounceKey);
      }
    }, debounceMs);

    // Store timer and event
    this.debounceTimers.set(debounceKey, {
      timer,
      lastEvent: event
    });
  }

  /**
   * Process the actual TTS event
   */
  private async processEvent(event: TTSHookEvent, settings: any): Promise<void> {
    try {
      // Analyze content
      const analysis = this.contentAnalyzer.analyzeContent(event.content);

      // Select voice based on content type
      const voice = settings.contextualVoices[analysis.contentType] || settings.defaultVoice;

      // Determine provider
      let provider = 'system';
      if (settings.mistralSettings.enableForHooks && analysis.suggestedProvider === 'mistral') {
        // Check if Mistral provider is actually available
        if (this.ttsService.hasProvider('mistral')) {
          const mistralAvailable = await this.ttsService.isProviderAvailable('mistral');
          if (mistralAvailable) {
            provider = 'mistral';
          }
        }
      }

      // Prepare TTS options
      const ttsOptions = {
        voice,
        rate: settings.voiceSettings.rate,
        volume: settings.voiceSettings.volume
      };

      // Execute TTS with error handling
      try {
        const result = await this.ttsService.speak(event.content, provider, ttsOptions);
        
        if (!result.success && result.error) {
          console.warn(`[TTS Hook Handler] TTS failed with ${provider}:`, result.error);
        }
      } catch (ttsError) {
        console.error(`[TTS Hook Handler] TTS execution failed:`, ttsError);
      }

    } catch (error) {
      console.error('[TTS Hook Handler] Event processing failed:', error);
    }
  }

  /**
   * Build enhanced message for Mistral TTS
   */
  private async buildEnhancedMessage(
    event: TTSHookEvent, 
    analysis: any, 
    settings: any
  ): Promise<string> {
    try {
      // Get appropriate prompt template based on content type
      const promptType = analysis.contentType === 'completion' ? 'completion' :
                        analysis.contentType === 'error' ? 'error' :
                        analysis.contentType === 'progress' ? 'progress' : 'code';

      const promptTemplate = settings.mistralSettings.summarizationPrompts[promptType];

      // For now, return the original content
      // TODO: Implement actual prompt enhancement using Mistral
      return event.content;

    } catch (error) {
      // Fallback to original content
      return event.content;
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Clear all active timers
    this.debounceTimers.forEach(({ timer }) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();
  }
}