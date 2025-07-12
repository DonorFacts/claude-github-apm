/**
 * System TTS Provider
 * Migrated from host-bridge implementation, preserves exact communication patterns
 */

import { TTSProvider, TTSResult, TTSOptions, TTSError } from '../core/interfaces';
import { hostBridge } from '../../integrations/docker/host-bridge/container/index';

export class SystemTTSProvider implements TTSProvider {
  readonly name = 'system';

  /**
   * Speak using system TTS via host-bridge
   * Preserves exact behavior from existing implementation
   */
  async speak(message: string, options?: TTSOptions): Promise<TTSResult> {
    if (!message || message.trim().length === 0) {
      throw new TTSError('INVALID_MESSAGE', 'Message cannot be empty', this.name);
    }

    try {
      const startTime = Date.now();
      
      // Use host-bridge speech_say method (with response wait)
      const success = await hostBridge.speech_say(
        message,
        options?.voice,
        options?.rate
      );

      const duration = Date.now() - startTime;

      return {
        success,
        duration,
        provider: this.name,
        ...(options?.volume !== undefined && { volume: options.volume }),
        ...(options?.language !== undefined && { language: options.language })
      };

    } catch (error) {
      throw new TTSError(
        'SYSTEM_TTS_FAILED',
        `System TTS failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Speak without waiting for completion (fire and forget)
   */
  async speakNoWait(message: string, options?: TTSOptions): Promise<TTSResult> {
    if (!message || message.trim().length === 0) {
      throw new TTSError('INVALID_MESSAGE', 'Message cannot be empty', this.name);
    }

    try {
      // Use host-bridge speech_say_nowait method
      hostBridge.speech_say_nowait(
        message,
        options?.voice,
        options?.rate
      );

      return {
        success: true,
        provider: this.name,
        // No duration available for nowait operations
        ...(options?.volume !== undefined && { volume: options.volume }),
        ...(options?.language !== undefined && { language: options.language })
      };

    } catch (error) {
      throw new TTSError(
        'SYSTEM_TTS_FAILED',
        `System TTS nowait failed: ${error instanceof Error ? error.message : String(error)}`,
        this.name,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Check if system TTS is available via host-bridge daemon
   */
  async isAvailable(): Promise<boolean> {
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
      // Any error means service is not available
      return false;
    }
  }

  /**
   * Get system TTS configuration and status
   */
  async getStatus(): Promise<{
    available: boolean;
    daemonRunning: boolean;
    serviceEnabled: boolean;
    voice?: string;
    timeout?: number;
  }> {
    try {
      const daemonRunning = await hostBridge.isHostDaemonRunning();
      let serviceEnabled = false;
      let voice: string | undefined;
      let timeout: number | undefined;

      if (daemonRunning) {
        try {
          const servicesStatus = hostBridge.getServicesStatus();
          serviceEnabled = servicesStatus?.speech?.enabled === true;
          voice = servicesStatus?.speech?.voice;
          timeout = servicesStatus?.speech?.timeout;
        } catch (error) {
          // Services status unavailable
        }
      }

      return {
        available: daemonRunning && serviceEnabled,
        daemonRunning,
        serviceEnabled,
        voice,
        timeout
      };

    } catch (error) {
      return {
        available: false,
        daemonRunning: false,
        serviceEnabled: false
      };
    }
  }
}