/**
 * Tests for Mistral TTS CLI Command
 * Validates CLI interface and argument handling
 */

import { speakMistralCommand } from '../../cli/speak-mistral';
import yargs from 'yargs';

// Mock all dependencies
jest.mock('../../core/tts-service');
jest.mock('../../providers/system-tts');
jest.mock('../../providers/mistral-tts');
jest.mock('../../config/ollama-config');
jest.mock('chalk', () => ({
  green: jest.fn((text) => text),
  red: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  gray: jest.fn((text) => text)
}));

describe('speakMistralCommand', () => {
  let mockArgv: any;

  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation();

    // Mock argv
    mockArgv = {
      message: 'test message',
      voice: undefined,
      rate: undefined,
      fallback: true,
      debug: false
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should register command with yargs', () => {
    const mockYargs = {
      command: jest.fn().mockReturnThis()
    };

    speakMistralCommand(mockYargs as any);

    expect(mockYargs.command).toHaveBeenCalledWith(
      'speak:mistral7b <message>',
      'AI-powered speech with Mistral 7B via Ollama',
      expect.any(Function),
      expect.any(Function)
    );
  });

  test('should configure positional and optional arguments', () => {
    const mockBuilder = {
      positional: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      example: jest.fn().mockReturnThis()
    };

    const mockYargs = {
      command: jest.fn((cmd, desc, builder, handler) => {
        builder(mockBuilder);
        return mockYargs;
      })
    };

    speakMistralCommand(mockYargs as any);

    // Check positional argument
    expect(mockBuilder.positional).toHaveBeenCalledWith('message', {
      describe: 'Message for AI-enhanced TTS',
      type: 'string'
    });

    // Check options
    expect(mockBuilder.option).toHaveBeenCalledWith('voice', expect.objectContaining({
      describe: 'Voice to use for synthesis',
      type: 'string',
      alias: 'v'
    }));

    expect(mockBuilder.option).toHaveBeenCalledWith('rate', expect.objectContaining({
      describe: 'Speech rate (0.5-2.0)',
      type: 'number',
      alias: 'r'
    }));

    expect(mockBuilder.option).toHaveBeenCalledWith('fallback', expect.objectContaining({
      describe: 'Enable fallback to system TTS if Mistral fails',
      type: 'boolean',
      default: true,
      alias: 'f'
    }));

    expect(mockBuilder.option).toHaveBeenCalledWith('debug', expect.objectContaining({
      describe: 'Show debug information',
      type: 'boolean',
      default: false,
      alias: 'd'
    }));

    // Check examples
    expect(mockBuilder.example).toHaveBeenCalledTimes(3);
  });

  test('should handle command registration structure', () => {
    // Test that the command can be integrated with real yargs
    const cli = yargs(['speak:mistral7b', 'test']);
    
    speakMistralCommand(cli);
    
    // Verify the command was registered (this will not execute the handler)
    const commands = cli.getUsageInstance();
    expect(commands).toBeDefined();
  });

  test('should have proper command structure', () => {
    let capturedHandler: Function | undefined;
    let capturedBuilder: Function | undefined;

    const mockYargs = {
      command: jest.fn((cmd, desc, builder, handler) => {
        capturedBuilder = builder;
        capturedHandler = handler;
        return mockYargs;
      })
    };

    speakMistralCommand(mockYargs as any);

    expect(capturedBuilder).toBeInstanceOf(Function);
    expect(capturedHandler).toBeInstanceOf(Function);
  });

  test('should validate required message parameter', () => {
    // This test ensures the command definition requires a message
    const mockBuilder = {
      positional: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      example: jest.fn().mockReturnThis()
    };

    const mockYargs = {
      command: jest.fn((cmd, desc, builder, handler) => {
        builder(mockBuilder);
        return mockYargs;
      })
    };

    speakMistralCommand(mockYargs as any);

    // Verify message is defined as a positional argument
    expect(mockBuilder.positional).toHaveBeenCalledWith('message', expect.objectContaining({
      type: 'string'
    }));
  });
});