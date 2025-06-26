import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { PromptTester, TestScenario, TestResult } from './utils/prompt-tester';
import { TokenCounter } from './utils/token-counter';
import { PromptValidator } from './utils/prompt-validator';

describe('Prompt A-B Testing', () => {
  let tester: PromptTester;
  let validator: PromptValidator;

  beforeEach(() => {
    tester = new PromptTester();
    validator = new PromptValidator();
  });

  describe('Scenario 1: Cold Initialization', () => {
    const scenario: TestScenario = {
      name: 'Cold Initialization',
      userPrompt: 'Initialize as prompt engineer',
      setup: async () => {
        // Clean state - no existing memory/context
      },
      expectedBehaviors: [
        'Set terminal title',
        'Check/create memory',
        'Provide status report',
        'List capabilities'
      ]
    };

    it('should test Version A (original)', async () => {
      const promptA = await tester.loadPrompts('v1');
      const result = await tester.runScenario(scenario, promptA);
      
      expect(result.taskCompleted).toBe(true);
      expect(result.response).toContain('Prompt Engineer initialized');
      expect(result.inputTokens).toBeGreaterThan(400); // Original is verbose
    });

    it('should test Version B (optimized)', async () => {
      const promptB = await tester.loadPrompts('v2');
      const result = await tester.runScenario(scenario, promptB);
      
      expect(result.taskCompleted).toBe(true);
      expect(result.response).toContain('Prompt Engineer ready');
      expect(result.inputTokens).toBeLessThan(200); // Optimized version
    });

    it('should compare A vs B performance', async () => {
      const promptA = await tester.loadPrompts('v1');
      const promptB = await tester.loadPrompts('v2');
      
      const resultA = await tester.runScenario(scenario, promptA);
      const resultB = await tester.runScenario(scenario, promptB);
      
      const comparison = validator.compare(resultA, resultB);
      
      // Version B should use fewer tokens
      expect(comparison.tokenReduction).toBeGreaterThan(50);
      // Both should complete the task
      expect(comparison.bothCompleted).toBe(true);
      // Quality should be maintained
      expect(comparison.qualityDelta).toBeLessThan(1); // Within 1 point
    });
  });

  describe('Scenario 2: Warm Initialization with Context', () => {
    const scenario: TestScenario = {
      name: 'Warm Initialization',
      userPrompt: 'Initialize as prompt engineer',
      setup: async () => {
        // Create existing context
        const contextDir = 'apm/agents/prompt-engineer/context';
        await fs.promises.mkdir(contextDir, { recursive: true });
        await fs.promises.writeFile(
          path.join(contextDir, 'latest.md'),
          `# Current Context\n\nWorking on: Optimizing manager agent prompts\nStatus: In progress\nNext: Review token usage patterns`
        );
      },
      expectedBehaviors: [
        'Load existing memory and context',
        'Recognize work in progress',
        'Ask about resuming vs new work',
        'Handle user choice'
      ]
    };

    it('should handle existing context efficiently in Version B', async () => {
      const promptB = await tester.loadPrompts('v2');
      const result = await tester.runScenario(scenario, promptB);
      
      expect(result.response).toContain('work in progress');
      expect(result.response).toMatch(/resume|continue/i);
      expect(result.taskCompleted).toBe(true);
    });
  });

  describe('Scenario 3: Prompt Optimization Task', () => {
    const scenario: TestScenario = {
      name: 'Prompt Optimization',
      userPrompt: 'I have a 500-line agent prompt that\'s using too many tokens. Help me optimize it.',
      expectedBehaviors: [
        'Analyze token usage patterns',
        'Suggest consolidation strategies',
        'Provide specific improvements',
        'Maintain functionality'
      ]
    };

    it('should provide actionable optimization advice', async () => {
      const promptB = await tester.loadPrompts('v2');
      const result = await tester.runScenario(scenario, promptB);
      
      expect(result.response).toMatch(/token|consolidat|reduc|optimiz/i);
      expect(result.qualityScore).toBeGreaterThan(7);
    });
  });

  describe('Token Efficiency Analysis', () => {
    it('should measure token reduction across all scenarios', async () => {
      const scenarios = await tester.getAllScenarios();
      const results: Array<{scenario: string, reduction: number}> = [];
      
      for (const scenario of scenarios) {
        const promptA = await tester.loadPrompts('v1');
        const promptB = await tester.loadPrompts('v2');
        
        const resultA = await tester.runScenario(scenario, promptA);
        const resultB = await tester.runScenario(scenario, promptB);
        
        const reduction = ((resultA.totalTokens - resultB.totalTokens) / resultA.totalTokens) * 100;
        results.push({ scenario: scenario.name, reduction });
      }
      
      const avgReduction = results.reduce((sum, r) => sum + r.reduction, 0) / results.length;
      
      expect(avgReduction).toBeGreaterThan(40); // Expect 40%+ token reduction
      
      // Log results for review
      console.log('Token Reduction by Scenario:');
      results.forEach(r => console.log(`  ${r.scenario}: ${r.reduction.toFixed(1)}%`));
    });
  });

  describe('Performance Validation', () => {
    it('should validate overall performance improvement', async () => {
      const allResults = await tester.runFullComparison();
      const report = validator.generateReport(allResults);
      
      expect(report.recommendation).toMatch(/Version B|optimized/i);
      expect(report.overallImprovement).toBeGreaterThan(15); // 15% threshold
      
      // Write report for manual review
      await fs.promises.writeFile(
        'tests/prompts/ab-test-report.md',
        report.fullReport
      );
    });
  });
});