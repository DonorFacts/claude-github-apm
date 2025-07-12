/**
 * Mistral TTS Provider
 * AI-powered TTS using Mistral 7B via Ollama with system TTS synthesis
 */

import { Ollama } from 'ollama';
import { TTSProvider, TTSResult, TTSOptions, TTSError, OllamaConfig } from '../core/interfaces';
import { hostBridge } from '../../integrations/docker/host-bridge/container/index';
import { buildPrompt, PromptContext, getMaxTokens, validatePromptLength } from './prompt-templates';

export class MistralTTSProvider implements TTSProvider {
  readonly name = 'mistral';
  private ollama: Ollama;
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
    this.ollama = new Ollama({
      host: config.baseUrl
    });
  }

  /**
   * AI-enhanced TTS: Generate enhanced text via Mistral, then synthesize with system TTS
   */
  async speak(message: string, options?: TTSOptions & { 
    contentType?: string;
    context?: PromptContext;
    hookMode?: boolean;
  }): Promise<TTSResult> {
    if (!message || message.trim().length === 0) {
      throw new TTSError('INVALID_MESSAGE', 'Message cannot be empty', this.name);
    }

    try {
      const startTime = Date.now();
      
      // Step 1: Enhance text via Mistral 7B with contextual prompts
      const enhancedText = await this.generateEnhancedText(
        message, 
        options?.contentType,
        options?.context
      );
      
      // Step 2: Synthesize enhanced text using system TTS
      const ttsSuccess = await hostBridge.speech_say(
        enhancedText,
        options?.voice,
        options?.rate
      );

      const duration = Date.now() - startTime;

      return {
        success: ttsSuccess,
        duration,
        provider: this.name,
        voice: options?.voice,
        rate: options?.rate,
        volume: options?.volume,
        language: options?.language,
        // Include enhanced text in audioData as debugging info
        audioData: Buffer.from(JSON.stringify({
          original: message,
          enhanced: enhancedText,
          model: this.config.model,
          contentType: options?.contentType,
          context: options?.context
        }))
      };

    } catch (error) {
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        'MISTRAL_TTS_FAILED',
        `Mistral TTS failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if Mistral TTS is available (Ollama server + model + system TTS)
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check 1: Ollama server connectivity
      const ollamaAvailable = await this.isOllamaAvailable();
      if (!ollamaAvailable) {
        return false;
      }

      // Check 2: Mistral model availability
      const modelAvailable = await this.isModelAvailable();
      if (!modelAvailable) {
        return false;
      }

      // Check 3: System TTS availability (for final synthesis)
      const systemTtsAvailable = await this.isSystemTtsAvailable();
      return systemTtsAvailable;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get detailed status information
   */
  async getStatus(): Promise<{
    available: boolean;
    ollamaConnected: boolean;
    modelAvailable: boolean;
    systemTtsAvailable: boolean;
    model: string;
    baseUrl: string;
    error?: string;
  }> {
    let ollamaConnected = false;
    let modelAvailable = false;
    let systemTtsAvailable = false;
    let error: string | undefined;

    try {
      ollamaConnected = await this.isOllamaAvailable();
      
      if (ollamaConnected) {
        modelAvailable = await this.isModelAvailable();
      }
      
      systemTtsAvailable = await this.isSystemTtsAvailable();

    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    return {
      available: ollamaConnected && modelAvailable && systemTtsAvailable,
      ollamaConnected,
      modelAvailable,
      systemTtsAvailable,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
      error
    };
  }

  /**
   * Generate enhanced text via Mistral 7B with contextual prompts
   */
  private async generateEnhancedText(
    message: string, 
    contentType?: string,
    context?: PromptContext
  ): Promise<string> {
    try {
      const prompt = this.createContextualPrompt(message, contentType, context);
      
      // Validate prompt length
      const validation = validatePromptLength(prompt, contentType || 'info');
      if (!validation.valid) {
        // If prompt is too long, fallback to basic enhancement
        return this.createBasicEnhancement(message);
      }

      // Determine max tokens for this request
      const maxTokens = Math.min(
        getMaxTokens(contentType || 'info'),
        this.config.maxTokens || 200
      );
      
      const response = await this.ollama.generate({
        model: this.config.model,
        prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: maxTokens
        }
      });

      const enhancedText = this.extractTextFromResponse(response.response);
      
      // Fallback to original if enhancement failed
      if (!enhancedText || enhancedText.trim().length === 0) {
        return message;
      }

      return enhancedText;

    } catch (error) {
      // If AI enhancement fails, fallback to original message
      return message;
    }
  }

  /**
   * Create contextual prompt based on content type and context
   */
  createContextualPrompt(message: string, contentType?: string, context?: PromptContext): string {
    // Use contextual prompt if content type is provided
    if (contentType) {
      try {
        return buildPrompt(contentType, message, context);
      } catch (error) {
        // Fallback to basic prompt if template building fails
        return this.createEnhancementPrompt(message);
      }
    }

    // Fallback to basic enhancement prompt
    return this.createEnhancementPrompt(message);
  }

  /**
   * Create basic enhancement for cases where contextual prompts fail
   */
  private createBasicEnhancement(message: string): string {
    // For simple cases, just clean up the message without AI enhancement
    return message
      .replace(/([.!?])\s*$/, '$1') // Ensure proper ending punctuation
      .trim();
  }

  /**
   * Create prompt for text enhancement
   */
  private createEnhancementPrompt(message: string): string {
    return `Improve this text for natural speech synthesis. Make it more conversational and pleasant to hear, but keep the same meaning. Only return the improved text, nothing else.

Original: ${message}

Improved:`;
  }

  /**
   * Extract clean text from Ollama response
   */
  private extractTextFromResponse(response: string): string {
    // Remove common prefixes and clean up the response
    const cleaned = response
      .replace(/^(Improved:|Enhanced:|Output:|Result:)\s*/i, '')
      .replace(/^["'](.*)["']$/s, '$1') // Remove surrounding quotes
      .trim();

    return cleaned;
  }

  /**
   * Check if Ollama server is available
   */
  private async isOllamaAvailable(): Promise<boolean> {
    try {
      // Simple connectivity test
      await this.ollama.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if the configured model is available
   */
  private async isModelAvailable(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      const modelExists = models.models.some(model => 
        model.name === this.config.model || 
        model.name.startsWith(this.config.model.split(':')[0])
      );
      return modelExists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if system TTS is available
   */
  private async isSystemTtsAvailable(): Promise<boolean> {
    try {
      // Check if host-bridge daemon is running
      const isDaemonRunning = await hostBridge.isHostDaemonRunning();
      if (!isDaemonRunning) {
        return false;
      }

      // Check if speech service is enabled in configuration
      const servicesStatus = hostBridge.getServicesStatus();
      return servicesStatus?.speech?.enabled === true;

    } catch (error) {
      return false;
    }
  }
}