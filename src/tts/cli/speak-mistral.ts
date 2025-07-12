#!/usr/bin/env tsx
/**
 * Mistral TTS CLI Command - AI-powered speech with Mistral 7B via Ollama
 * 
 * Usage: pnpm cli speak:mistral7b "message"
 */

import { Argv } from 'yargs';
import { TTSService } from '../core/tts-service';
import { SystemTTSProvider } from '../providers/system-tts';
import { MistralTTSProvider } from '../providers/mistral-tts';
import { loadOllamaConfig } from '../config/ollama-config';
import { TTSError } from '../core/interfaces';
import chalk from 'chalk';

export function speakMistralCommand(yargs: Argv) {
  return yargs.command(
    'speak:mistral7b <message>',
    'AI-powered speech with Mistral 7B via Ollama',
    (yargs) => {
      return yargs
        .positional('message', {
          describe: 'Message for AI-enhanced TTS',
          type: 'string'
        })
        .option('voice', {
          describe: 'Voice to use for synthesis',
          type: 'string',
          alias: 'v'
        })
        .option('rate', {
          describe: 'Speech rate (0.5-2.0)',
          type: 'number',
          alias: 'r'
        })
        .option('fallback', {
          describe: 'Enable fallback to system TTS if Mistral fails',
          type: 'boolean',
          default: true,
          alias: 'f'
        })
        .option('debug', {
          describe: 'Show debug information',
          type: 'boolean',
          default: false,
          alias: 'd'
        })
        .example('$0 speak:mistral7b "Hello world"', 'Speak with Mistral enhancement')
        .example('$0 speak:mistral7b "Task completed" --voice Zoe --rate 1.2', 'Speak with custom voice and rate')
        .example('$0 speak:mistral7b "Debug test" --debug --no-fallback', 'Debug mode without fallback');
    },
    async (argv) => {
      const message = argv.message as string;
      const options = {
        voice: argv.voice as string | undefined,
        rate: argv.rate as number | undefined
      };
      const enableFallback = argv.fallback as boolean;
      const debug = argv.debug as boolean;

      try {
        if (debug) {
          console.log(chalk.blue('🔍 Debug mode enabled'));
          console.log(chalk.gray(`Message: "${message}"`));
          console.log(chalk.gray(`Options: ${JSON.stringify(options)}`));
          console.log(chalk.gray(`Fallback enabled: ${enableFallback}`));
        }

        // Initialize TTS service
        const ttsService = new TTSService({
          defaultProvider: 'mistral',
          fallbackProvider: enableFallback ? 'system' : undefined,
          enableActivityTracking: true,
          providers: {}
        });

        // Register system TTS provider
        const systemProvider = new SystemTTSProvider();
        ttsService.registerProvider(systemProvider);

        // Register Mistral TTS provider
        try {
          const ollamaConfig = loadOllamaConfig();
          if (debug) {
            console.log(chalk.gray(`Ollama config: ${JSON.stringify(ollamaConfig)}`));
          }
          
          const mistralProvider = new MistralTTSProvider(ollamaConfig);
          ttsService.registerProvider(mistralProvider);

          if (debug) {
            console.log(chalk.blue('📊 Checking service status...'));
            const status = await ttsService.getStatus();
            console.log(chalk.gray(`Service status: ${JSON.stringify(status, null, 2)}`));
          }

        } catch (configError) {
          throw new TTSError(
            'CONFIG_ERROR',
            `Failed to load Ollama configuration: ${configError instanceof Error ? configError.message : String(configError)}`
          );
        }

        // Perform TTS operation
        if (debug) {
          console.log(chalk.blue('🎤 Starting Mistral TTS operation...'));
        }

        const startTime = Date.now();
        const result = await ttsService.speak(message, 'mistral', options);
        const totalTime = Date.now() - startTime;

        // Report success
        if (result.success) {
          const providerUsed = result.provider || 'unknown';
          const wasFallback = providerUsed !== 'mistral';
          
          if (wasFallback && enableFallback) {
            console.log(chalk.yellow('⚠️'), `Mistral unavailable, used ${providerUsed} TTS`);
          } else if (wasFallback) {
            console.log(chalk.red('✗'), `Mistral TTS failed and fallback disabled`);
            process.exit(1);
          } else {
            console.log(chalk.green('✅'), `Mistral TTS completed successfully`);
          }

          if (debug) {
            console.log(chalk.gray(`Provider used: ${providerUsed}`));
            console.log(chalk.gray(`Duration: ${result.duration || totalTime}ms`));
            console.log(chalk.gray(`Total time: ${totalTime}ms`));
            
            if (result.audioData) {
              try {
                const debugInfo = JSON.parse(result.audioData.toString());
                console.log(chalk.gray(`Original: "${debugInfo.original}"`));
                console.log(chalk.gray(`Enhanced: "${debugInfo.enhanced}"`));
                console.log(chalk.gray(`Model used: ${debugInfo.model}`));
              } catch (parseError) {
                // Ignore debug info parsing errors
              }
            }
          }

        } else {
          console.log(chalk.red('✗'), `TTS operation failed: ${result.error || 'Unknown error'}`);
          process.exit(1);
        }

      } catch (error) {
        if (error instanceof TTSError) {
          switch (error.code) {
            case 'INVALID_MESSAGE':
              console.error(chalk.red('✗'), 'Message cannot be empty');
              break;
            case 'CONFIG_ERROR':
              console.error(chalk.red('✗'), `Configuration error: ${error.message}`);
              if (debug && error.originalError) {
                console.error(chalk.gray(error.originalError.message));
              }
              break;
            case 'PROVIDER_NOT_FOUND':
              console.error(chalk.red('✗'), 'Mistral TTS provider not available');
              console.error(chalk.gray('💡 Ensure Ollama is running: ollama serve'));
              console.error(chalk.gray('💡 Ensure Mistral model is available: ollama pull mistral:7b'));
              break;
            case 'MISTRAL_TTS_FAILED':
              console.error(chalk.red('✗'), `Mistral TTS error: ${error.message}`);
              if (debug && error.originalError) {
                console.error(chalk.gray(`Original error: ${error.originalError.message}`));
              }
              break;
            default:
              console.error(chalk.red('✗'), `TTS error [${error.code}]: ${error.message}`);
          }
        } else {
          console.error(chalk.red('✗'), `Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
          if (debug && error instanceof Error) {
            console.error(chalk.gray(error.stack || 'No stack trace available'));
          }
        }
        process.exit(1);
      }
    }
  );
}