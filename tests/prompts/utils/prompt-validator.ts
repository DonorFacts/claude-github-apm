import { TestResult } from './prompt-tester';

export interface ValidationResult {
  tokenReduction: number;
  bothCompleted: boolean;
  qualityDelta: number;
  winner: 'A' | 'B' | 'tie';
  reasons: string[];
}

export interface ValidationReport {
  recommendation: string;
  overallImprovement: number;
  fullReport: string;
}

export class PromptValidator {
  private weights = {
    tokenEfficiency: 0.4,
    taskCompletion: 0.3,
    responseQuality: 0.2,
    userExperience: 0.1
  };

  compare(resultA: TestResult, resultB: TestResult): ValidationResult {
    const tokenReduction = ((resultA.totalTokens - resultB.totalTokens) / resultA.totalTokens) * 100;
    const bothCompleted = resultA.taskCompleted && resultB.taskCompleted;
    const qualityDelta = Math.abs((resultA.qualityScore || 0) - (resultB.qualityScore || 0));

    const reasons: string[] = [];
    let winner: 'A' | 'B' | 'tie' = 'tie';

    // Token efficiency comparison
    if (tokenReduction > 20) {
      reasons.push(`Version B uses ${tokenReduction.toFixed(1)}% fewer tokens`);
      winner = 'B';
    } else if (tokenReduction < -20) {
      reasons.push(`Version A uses ${Math.abs(tokenReduction).toFixed(1)}% fewer tokens`);
      winner = 'A';
    }

    // Task completion comparison
    if (resultA.taskCompleted && !resultB.taskCompleted) {
      reasons.push('Version A completes the task while B does not');
      winner = 'A';
    } else if (!resultA.taskCompleted && resultB.taskCompleted) {
      reasons.push('Version B completes the task while A does not');
      winner = 'B';
    }

    // Quality comparison
    const qualityA = resultA.qualityScore || 0;
    const qualityB = resultB.qualityScore || 0;
    if (qualityA - qualityB > 2) {
      reasons.push(`Version A has significantly better quality (${qualityA} vs ${qualityB})`);
      winner = winner === 'B' ? 'tie' : 'A';
    } else if (qualityB - qualityA > 2) {
      reasons.push(`Version B has significantly better quality (${qualityB} vs ${qualityA})`);
      winner = winner === 'A' ? 'tie' : 'B';
    }

    return {
      tokenReduction,
      bothCompleted,
      qualityDelta,
      winner,
      reasons
    };
  }

  generateReport(results: TestResult[]): ValidationReport {
    const scenarios = this.groupByScenario(results);
    let totalScoreA = 0;
    let totalScoreB = 0;
    let scenarioReports: string[] = [];

    for (const [scenarioName, scenarioResults] of scenarios) {
      const resultA = scenarioResults.find(r => r.version === 'v1');
      const resultB = scenarioResults.find(r => r.version === 'v2');

      if (!resultA || !resultB) continue;

      const comparison = this.compare(resultA, resultB);
      const scoreA = this.calculateScore(resultA);
      const scoreB = this.calculateScore(resultB);

      totalScoreA += scoreA;
      totalScoreB += scoreB;

      scenarioReports.push(this.formatScenarioReport(
        scenarioName,
        resultA,
        resultB,
        comparison,
        scoreA,
        scoreB
      ));
    }

    const avgScoreA = totalScoreA / scenarios.size;
    const avgScoreB = totalScoreB / scenarios.size;
    const overallImprovement = ((avgScoreB - avgScoreA) / avgScoreA) * 100;

    const recommendation = this.getRecommendation(avgScoreA, avgScoreB, overallImprovement);

    const fullReport = this.formatFullReport(
      scenarioReports,
      avgScoreA,
      avgScoreB,
      overallImprovement,
      recommendation
    );

    return {
      recommendation,
      overallImprovement,
      fullReport
    };
  }

  private groupByScenario(results: TestResult[]): Map<string, TestResult[]> {
    const grouped = new Map<string, TestResult[]>();
    
    for (const result of results) {
      const existing = grouped.get(result.scenario) || [];
      existing.push(result);
      grouped.set(result.scenario, existing);
    }
    
    return grouped;
  }

  private calculateScore(result: TestResult): number {
    // Token efficiency (inverted - lower is better)
    const tokenScore = Math.max(0, 10 - (result.totalTokens / 100));
    
    // Task completion
    const completionScore = result.taskCompleted ? 10 : 0;
    
    // Response quality
    const qualityScore = result.qualityScore || 5;
    
    // Time efficiency (faster is better)
    const timeScore = Math.max(0, 10 - result.timeSeconds);

    return (
      tokenScore * this.weights.tokenEfficiency +
      completionScore * this.weights.taskCompletion +
      qualityScore * this.weights.responseQuality +
      timeScore * this.weights.userExperience
    );
  }

  private formatScenarioReport(
    scenario: string,
    resultA: TestResult,
    resultB: TestResult,
    comparison: ValidationResult,
    scoreA: number,
    scoreB: number
  ): string {
    return `
## Scenario: ${scenario}

### Quantitative Metrics
| Metric | Version A | Version B | Winner |
|--------|-----------|-----------|---------|
| Input Tokens | ${resultA.inputTokens} | ${resultB.inputTokens} | ${resultA.inputTokens > resultB.inputTokens ? 'B' : 'A'} |
| Output Tokens | ${resultA.outputTokens} | ${resultB.outputTokens} | ${resultA.outputTokens > resultB.outputTokens ? 'B' : 'A'} |
| Total Tokens | ${resultA.totalTokens} | ${resultB.totalTokens} | ${resultA.totalTokens > resultB.totalTokens ? 'B' : 'A'} |
| Response Time | ${resultA.timeSeconds.toFixed(2)}s | ${resultB.timeSeconds.toFixed(2)}s | ${resultA.timeSeconds > resultB.timeSeconds ? 'B' : 'A'} |

### Qualitative Assessment
- Task Completed: A=${resultA.taskCompleted} B=${resultB.taskCompleted}
- Quality Score: A=${resultA.qualityScore || 'N/A'} B=${resultB.qualityScore || 'N/A'}
- Winner: ${comparison.winner}

### Weighted Scores
- Version A: ${scoreA.toFixed(2)}/10
- Version B: ${scoreB.toFixed(2)}/10

### Key Findings
${comparison.reasons.map(r => `- ${r}`).join('\n')}
`;
  }

  private getRecommendation(avgScoreA: number, avgScoreB: number, improvement: number): string {
    if (improvement > 15) {
      return 'Strongly recommend adopting Version B (optimized prompts)';
    } else if (improvement > 0) {
      return 'Version B shows improvement but consider selective adoption';
    } else if (improvement > -15) {
      return 'Performance is comparable - maintain Version A for stability';
    } else {
      return 'Version A performs better - do not adopt Version B';
    }
  }

  private formatFullReport(
    scenarioReports: string[],
    avgScoreA: number,
    avgScoreB: number,
    overallImprovement: number,
    recommendation: string
  ): string {
    return `# A-B Test Validation Report

## Executive Summary

- Average Score Version A: ${avgScoreA.toFixed(2)}/10
- Average Score Version B: ${avgScoreB.toFixed(2)}/10
- Overall Improvement: ${overallImprovement.toFixed(1)}%
- Recommendation: ${recommendation}

${scenarioReports.join('\n---\n')}

## Overall Analysis

Version B demonstrates ${overallImprovement > 0 ? 'superior' : 'inferior'} performance with:
- ${overallImprovement > 0 ? 'Significant token reduction' : 'Higher token usage'}
- ${overallImprovement > 0 ? 'Maintained task completion' : 'Potential task completion issues'}
- ${overallImprovement > 0 ? 'Comparable quality scores' : 'Quality degradation concerns'}

## Implementation Recommendations

${overallImprovement > 15 ? `
1. Adopt Version B prompts across all agents
2. Monitor for any edge case regressions
3. Document the new prompt patterns
4. Train team on token-efficient prompt design
` : `
1. Maintain current Version A prompts
2. Selectively apply Version B techniques where beneficial
3. Continue iterating on optimization strategies
4. Re-test after addressing identified issues
`}

Generated: ${new Date().toISOString()}
`;
  }
}