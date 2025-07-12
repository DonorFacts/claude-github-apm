/**
 * Content Analyzer Tests
 * Comprehensive test suite for intelligent content analysis
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { ContentAnalyzer } from '../../core/content-analyzer';
import { ContentAnalysis } from '../../../config/schemas/voice-settings-schema';

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe('analyzeContent', () => {
    test('should identify code content correctly', () => {
      const codeMessage = 'Implementing authentication bug fix in src/auth/login.ts:42 with JWT validation function changes';
      
      const result = analyzer.analyzeContent(codeMessage);
      
      expect(result.contentType).toBe('code');
      expect(result.complexity).toBe('technical');
      expect(result.suggestedProvider).toBe('mistral');
      expect(result.technicalElements.filePaths).toContain('src/auth/login.ts');
      expect(result.technicalElements.codeSnippets.length).toBeGreaterThan(0);
    });

    test('should identify error content correctly', () => {
      const errorMessage = 'TypeError: Cannot read property username of undefined in Login.tsx at line 25';
      
      const result = analyzer.analyzeContent(errorMessage);
      
      expect(result.contentType).toBe('error');
      expect(result.priority).toBe('high');
      expect(result.suggestedProvider).toBe('mistral');
      expect(result.suggestedVoice).toBe('Daniel');
      expect(result.technicalElements.errorMessages.length).toBeGreaterThan(0);
    });

    test('should identify completion content correctly', () => {
      const completionMessage = 'Successfully implemented authentication middleware with full test coverage';
      
      const result = analyzer.analyzeContent(completionMessage);
      
      expect(result.contentType).toBe('completion');
      expect(result.priority).toBe('medium');
      expect(result.suggestedVoice).toBe('Samantha');
    });

    test('should identify progress content correctly', () => {
      const progressMessage = 'Working on user registration: 75% complete, implementing validation logic';
      
      const result = analyzer.analyzeContent(progressMessage);
      
      expect(result.contentType).toBe('progress');
      expect(result.suggestedVoice).toBe('Alex');
      expect(result.technicalElements.metrics).toHaveProperty('%');
    });

    test('should handle simple info content', () => {
      const infoMessage = 'The weather is nice today and I hope you have a great day!';
      
      const result = analyzer.analyzeContent(infoMessage);
      
      expect(result.contentType).toBe('info');
      expect(result.complexity).toBe('simple');
      expect(result.suggestedProvider).toBe('system');
      expect(result.priority).toBe('low');
    });

    test('should handle empty or invalid content', () => {
      const emptyResults = [
        analyzer.analyzeContent(''),
        analyzer.analyzeContent('   '),
        analyzer.analyzeContent('')
      ];

      emptyResults.forEach(result => {
        expect(result.contentType).toBe('info');
        expect(result.complexity).toBe('simple');
        expect(result.suggestedProvider).toBe('system');
        expect(result.technicalElements.filePaths).toEqual([]);
        expect(result.technicalElements.codeSnippets).toEqual([]);
      });
    });
  });

  describe('technical element extraction', () => {
    test('should extract file paths correctly', () => {
      const message = 'Updated src/components/Auth.tsx and tests/auth.test.js, fixed config.json';
      
      const result = analyzer.analyzeContent(message);
      
      expect(result.technicalElements.filePaths).toContain('src/components/Auth.tsx');
      expect(result.technicalElements.filePaths).toContain('tests/auth.test.js');
      expect(result.technicalElements.filePaths).toContain('config.json');
    });

    test('should extract code snippets correctly', () => {
      const message = 'Added async function validateUser() and const JWT_SECRET = process.env.JWT_SECRET';
      
      const result = analyzer.analyzeContent(message);
      
      expect(result.technicalElements.codeSnippets.length).toBeGreaterThan(0);
      expect(result.technicalElements.codeSnippets.some(snippet => 
        snippet.includes('function') || snippet.includes('const')
      )).toBe(true);
    });

    test('should extract error messages correctly', () => {
      const message = 'Encountered multiple issues: failed to connect, timeout error, and invalid credentials';
      
      const result = analyzer.analyzeContent(message);
      
      expect(result.technicalElements.errorMessages.length).toBeGreaterThan(0);
      expect(result.technicalElements.errorMessages.some(error => 
        ['failed', 'timeout', 'error', 'invalid'].some(keyword => 
          error.toLowerCase().includes(keyword)
        )
      )).toBe(true);
    });

    test('should extract metrics correctly', () => {
      const message = 'Performance improved: 95% faster, reduced bundle size by 2.5 MB, 15 tests passing';
      
      const result = analyzer.analyzeContent(message);
      
      expect(result.technicalElements.metrics).toHaveProperty('%');
      expect(result.technicalElements.metrics).toHaveProperty('MB');
      expect(result.technicalElements.metrics).toHaveProperty('tests');
      expect(result.technicalElements.metrics['%']).toBe(95);
      expect(result.technicalElements.metrics['MB']).toBe(2.5);
      expect(result.technicalElements.metrics['tests']).toBe(15);
    });
  });

  describe('complexity calculation', () => {
    test('should classify simple content correctly', () => {
      const simpleMessage = 'Task completed successfully!';
      
      const result = analyzer.analyzeContent(simpleMessage);
      
      expect(result.complexity).toBe('simple');
      expect(result.suggestedProvider).toBe('system');
    });

    test('should classify technical content correctly', () => {
      const technicalMessage = 'Updated the authentication service in auth.service.ts to handle JWT tokens properly';
      
      const result = analyzer.analyzeContent(technicalMessage);
      
      expect(result.complexity).toBe('technical');
      expect(result.suggestedProvider).toBe('mistral');
    });

    test('should classify complex content correctly', () => {
      const complexMessage = `
        Fixed critical security vulnerability in src/auth/jwt-validator.ts:45
        - Updated validateToken() function to properly verify JWT signatures
        - Added rate limiting to prevent brute force attacks 
        - Implemented proper error handling for expired tokens
        - Added comprehensive test coverage: 15 tests, 95% coverage
        - Performance: reduced validation time by 200ms
        Stack trace: Error at validateToken (jwt-validator.ts:45:12)
        Command: npm test && npm run build
      `;
      
      const result = analyzer.analyzeContent(complexMessage);
      
      expect(result.complexity).toBe('complex');
      expect(result.suggestedProvider).toBe('mistral');
      expect(result.technicalElements.filePaths.length).toBeGreaterThan(0);
      expect(result.technicalElements.codeSnippets.length).toBeGreaterThan(0);
      expect(result.technicalElements.metrics).toBeDefined();
    });
  });

  describe('provider suggestion', () => {
    test('should suggest Mistral for complex technical content', () => {
      const complexTechnical = 'Refactored the entire authentication system in src/auth/ with TypeScript interfaces and async/await patterns';
      
      const result = analyzer.analyzeContent(complexTechnical);
      
      expect(result.suggestedProvider).toBe('mistral');
    });

    test('should suggest Mistral for error messages', () => {
      const errorMessage = 'ReferenceError: window is not defined at Server.render';
      
      const result = analyzer.analyzeContent(errorMessage);
      
      expect(result.suggestedProvider).toBe('mistral');
      expect(result.contentType).toBe('error');
    });

    test('should suggest system TTS for simple content', () => {
      const simpleMessage = 'All tests passed successfully!';
      
      const result = analyzer.analyzeContent(simpleMessage);
      
      expect(result.suggestedProvider).toBe('system');
    });
  });

  describe('voice suggestion', () => {
    test('should suggest appropriate voices for each content type', () => {
      const testCases: Array<{ message: string; expectedVoice: string; expectedType: ContentAnalysis['contentType'] }> = [
        { message: 'Error: Failed to authenticate user', expectedVoice: 'Daniel', expectedType: 'error' },
        { message: 'Successfully deployed to production', expectedVoice: 'Samantha', expectedType: 'completion' },
        { message: 'Building project: 50% complete', expectedVoice: 'Alex', expectedType: 'progress' },
        { message: 'Refactored React component for user interface', expectedVoice: 'Victoria', expectedType: 'code' },
        { message: 'Here is some general information', expectedVoice: 'Victoria', expectedType: 'info' }
      ];

      testCases.forEach(({ message, expectedVoice, expectedType }) => {
        const result = analyzer.analyzeContent(message);
        expect(result.contentType).toBe(expectedType);
        expect(result.suggestedVoice).toBe(expectedVoice);
      });
    });
  });

  describe('priority assignment', () => {
    test('should assign high priority to errors', () => {
      const errorMessage = 'Critical error: Database connection failed';
      
      const result = analyzer.analyzeContent(errorMessage);
      
      expect(result.priority).toBe('high');
    });

    test('should assign medium priority to completions', () => {
      const completionMessage = 'Feature implementation completed successfully';
      
      const result = analyzer.analyzeContent(completionMessage);
      
      expect(result.priority).toBe('medium');
    });

    test('should assign medium priority to complex content', () => {
      const complexMessage = 'Implemented OAuth2 authentication flow with PKCE extension in multiple TypeScript modules';
      
      const result = analyzer.analyzeContent(complexMessage);
      
      expect(result.priority).toBe('medium');
    });

    test('should assign low priority to simple content', () => {
      const simpleMessage = 'Working on the next task';
      
      const result = analyzer.analyzeContent(simpleMessage);
      
      expect(result.priority).toBe('low');
    });
  });

  describe('edge cases', () => {
    test('should handle very long text', () => {
      const longText = 'This is a sample message. '.repeat(1000);
      
      const result = analyzer.analyzeContent(longText);
      
      expect(result).toBeDefined();
      expect(result.contentType).toBe('info');
      expect(result.complexity).toBe('simple');
    });

    test('should handle text with special characters', () => {
      const specialCharsMessage = 'Fixed issue with special chars: @#$%^&*()[]{}|\\:";\'<>?,./ in file-name_test.ts';
      
      const result = analyzer.analyzeContent(specialCharsMessage);
      
      expect(result).toBeDefined();
      expect(result.technicalElements.filePaths).toContain('file-name_test.ts');
    });

    test('should handle mixed content types', () => {
      const mixedMessage = 'Error: Failed to load config.json, but successfully implemented fallback in src/config.ts (progress: 80%)';
      
      const result = analyzer.analyzeContent(mixedMessage);
      
      // Should prioritize error detection
      expect(result.contentType).toBe('error');
      expect(result.priority).toBe('high');
      expect(result.technicalElements.filePaths.length).toBeGreaterThan(0);
      expect(result.technicalElements.metrics).toHaveProperty('%');
    });
  });

  describe('getAnalysisStats', () => {
    test('should return analysis statistics', () => {
      const message = 'Fixed bug in src/utils.ts:25 - function now returns async Promise<string>';
      
      const stats = analyzer.getAnalysisStats(message);
      
      expect(stats.textLength).toBe(message.length);
      expect(stats.technicalElementsCount).toBeGreaterThan(0);
      expect(stats.patternMatches).toBeDefined();
      expect(stats.patternMatches.filePaths).toBeGreaterThan(0);
      expect(stats.patternMatches.codeSnippets).toBeGreaterThan(0);
    });

    test('should handle empty text for stats', () => {
      const stats = analyzer.getAnalysisStats('');
      
      expect(stats.textLength).toBe(0);
      expect(stats.technicalElementsCount).toBe(0);
      expect(stats.patternMatches).toBeDefined();
    });
  });

  describe('real-world examples', () => {
    test('should handle typical Claude agent responses', () => {
      const claudeResponses = [
        'I\'ve successfully implemented the user authentication system in src/auth/AuthService.ts with JWT token validation',
        'There was an error in the database query: PostgreSQL connection timeout after 30 seconds',
        'Building the React application... 85% complete, optimizing bundle size',
        'Task completed: All 23 unit tests are now passing with 98% code coverage',
        'I found a bug in the calculateTax function that was causing incorrect results for Canadian customers'
      ];

      claudeResponses.forEach(response => {
        const result = analyzer.analyzeContent(response);
        
        expect(result).toBeDefined();
        expect(['code', 'error', 'progress', 'completion', 'info']).toContain(result.contentType);
        expect(['simple', 'technical', 'complex']).toContain(result.complexity);
        expect(['low', 'medium', 'high']).toContain(result.priority);
        expect(['system', 'mistral']).toContain(result.suggestedProvider);
      });
    });

    test('should handle git commit messages', () => {
      const gitMessages = [
        'feat: add user authentication with JWT tokens',
        'fix: resolve memory leak in WebSocket connection handler',
        'docs: update API documentation with new endpoints',
        'test: add unit tests for payment processing module',
        'refactor: simplify database query logic in user service'
      ];

      gitMessages.forEach(message => {
        const result = analyzer.analyzeContent(message);
        
        expect(result).toBeDefined();
        expect(['code', 'info', 'completion'].includes(result.contentType)).toBe(true);
      });
    });

    test('should handle build/deployment messages', () => {
      const buildMessages = [
        'npm run build completed successfully in 45 seconds',
        'Docker image build failed: missing package.json file',
        'Deploying to production environment... 3 of 5 services updated',
        'All checks passed: 156 tests, 0 failures, build size: 2.3 MB'
      ];

      buildMessages.forEach(message => {
        const result = analyzer.analyzeContent(message);
        
        expect(result).toBeDefined();
        if (message.includes('failed')) {
          expect(result.contentType).toBe('error');
          expect(result.priority).toBe('high');
        }
        if (message.includes('completed successfully') || message.includes('All checks passed')) {
          expect(result.contentType).toBe('completion');
        }
      });
    });
  });
});