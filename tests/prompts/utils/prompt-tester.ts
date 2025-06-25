import * as fs from 'fs';
import * as path from 'path';
import { TokenCounter } from './token-counter';

export interface TestScenario {
  name: string;
  userPrompt: string;
  setup?: () => Promise<void>;
  expectedBehaviors: string[];
  cleanup?: () => Promise<void>;
}

export interface TestResult {
  scenario: string;
  version: 'v1' | 'v2';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timeSeconds: number;
  taskCompleted: boolean;
  response: string;
  qualityScore?: number;
  errors?: string[];
}

export interface PromptSet {
  agentInit: string;
  roleInit: string;
  combined: string;
}

export class PromptTester {
  private tokenCounter: TokenCounter;
  private mockResponses: Map<string, string>;

  constructor() {
    this.tokenCounter = new TokenCounter();
    this.mockResponses = new Map();
    this.setupMockResponses();
  }

  async loadPrompts(version: 'v1' | 'v2'): Promise<PromptSet> {
    let agentInitPath: string;
    let roleInitPath: string;

    if (version === 'v1') {
      agentInitPath = 'src/prompts/agents/init.md';
      roleInitPath = 'src/prompts/agents/prompt-engineer/init.md';
    } else {
      agentInitPath = 'src/prompts/agents/init-v2.md';
      roleInitPath = 'src/prompts/agents/prompt-engineer/v2/init.md';
    }

    const agentInit = await fs.promises.readFile(agentInitPath, 'utf-8');
    const roleInit = await fs.promises.readFile(roleInitPath, 'utf-8');

    return {
      agentInit,
      roleInit,
      combined: `${agentInit}\n\n${roleInit}`
    };
  }

  async runScenario(scenario: TestScenario, prompts: PromptSet): Promise<TestResult> {
    const startTime = Date.now();

    // Setup
    if (scenario.setup) {
      await scenario.setup();
    }

    // Simulate prompt execution
    const fullPrompt = `${prompts.combined}\n\nUser: ${scenario.userPrompt}`;
    const inputTokens = this.tokenCounter.count(fullPrompt);

    // Get mock response
    const response = this.getMockResponse(scenario.name, prompts);
    const outputTokens = this.tokenCounter.count(response);

    // Check expected behaviors
    const taskCompleted = this.checkExpectedBehaviors(response, scenario.expectedBehaviors);
    const qualityScore = this.assessQuality(response, scenario);

    // Cleanup
    if (scenario.cleanup) {
      await scenario.cleanup();
    }

    const timeSeconds = (Date.now() - startTime) / 1000;

    return {
      scenario: scenario.name,
      version: prompts.agentInit.includes('init-v2') ? 'v2' : 'v1',
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      timeSeconds,
      taskCompleted,
      response,
      qualityScore
    };
  }

  async getAllScenarios(): Promise<TestScenario[]> {
    return [
      {
        name: 'Cold Initialization',
        userPrompt: 'Initialize as prompt engineer',
        expectedBehaviors: [
          'Set terminal title',
          'Check/create memory',
          'Provide status report',
          'List capabilities'
        ]
      },
      {
        name: 'Warm Initialization',
        userPrompt: 'Initialize as prompt engineer',
        setup: async () => {
          // Mock context exists
        },
        expectedBehaviors: [
          'Load existing memory and context',
          'Recognize work in progress',
          'Ask about resuming',
          'Handle user choice'
        ]
      },
      {
        name: 'Prompt Optimization',
        userPrompt: 'I have a 500-line agent prompt that\'s using too many tokens. Help me optimize it.',
        expectedBehaviors: [
          'Analyze token usage',
          'Suggest strategies',
          'Provide improvements',
          'Maintain functionality'
        ]
      },
      {
        name: 'Create Agent Prompt',
        userPrompt: 'Create a prompt for a new QA engineer agent that focuses on automated testing',
        expectedBehaviors: [
          'Design role prompt',
          'Include components',
          'Apply best practices',
          'Ensure compatibility'
        ]
      },
      {
        name: 'Context Degradation',
        userPrompt: 'Continue optimizing the implementation prompts we were working on',
        setup: async () => {
          // Simulate near-limit context
        },
        expectedBehaviors: [
          'Detect limitations',
          'Alert user',
          'Suggest handover',
          'Maintain continuity'
        ]
      }
    ];
  }

  async runFullComparison(): Promise<TestResult[]> {
    const scenarios = await this.getAllScenarios();
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      const promptsV1 = await this.loadPrompts('v1');
      const promptsV2 = await this.loadPrompts('v2');

      results.push(await this.runScenario(scenario, promptsV1));
      results.push(await this.runScenario(scenario, promptsV2));
    }

    return results;
  }

  private setupMockResponses() {
    // V1 responses (verbose)
    this.mockResponses.set('Cold Initialization-v1', `
Setting terminal title to Prompt Engineer...

✅ Agent initialized successfully
- Role: prompt-engineer
- Terminal: Prompt Engineer (title set)
- Git workspace: main branch
- Memory loaded: No - this is first activation
- Context loaded: No

As the APM Prompt Engineer Agent, I am responsible for:

1. Prompt Architecture: Designing and optimizing prompts for maximum AI effectiveness
2. Vibe Coding Guidance: Implementing rapid, intuitive development while maintaining structure
3. Context Optimization: Crafting prompts that maximize information density and clarity
4. Framework Integration: Ensuring prompts align with project management methodologies
5. Best Practices Evangelism: Promoting and implementing cutting-edge prompt engineering techniques

I can help you:
- Create new agent initialization prompts
- Design command-specific prompts
- Optimize existing prompts
- Review prompt architecture

What prompt engineering work would you like me to focus on?
    `);

    // V2 responses (concise)
    this.mockResponses.set('Cold Initialization-v2', `
✅ Prompt Engineer ready
- Memory: fresh
- Context: none

Ready for: prompt creation, optimization, review, or architecture work.
    `);

    // Add more mock responses as needed
  }

  private getMockResponse(scenarioName: string, prompts: PromptSet): string {
    const version = prompts.agentInit.includes('init-v2') ? 'v2' : 'v1';
    const key = `${scenarioName}-${version}`;
    return this.mockResponses.get(key) || 'Mock response not found';
  }

  private checkExpectedBehaviors(response: string, behaviors: string[]): boolean {
    const lowerResponse = response.toLowerCase();
    return behaviors.every(behavior => {
      const keywords = behavior.toLowerCase().split(/\s+/);
      return keywords.some(keyword => lowerResponse.includes(keyword));
    });
  }

  private assessQuality(response: string, scenario: TestScenario): number {
    let score = 5; // Base score

    // Clarity
    if (response.includes('✅')) score += 1;
    if (response.split('\n').filter(l => l.trim()).length < 20) score += 1; // Conciseness

    // Completeness
    const behaviorsCovered = scenario.expectedBehaviors.filter(b => 
      this.checkExpectedBehaviors(response, [b])
    ).length;
    score += (behaviorsCovered / scenario.expectedBehaviors.length) * 2;

    // Structure
    if (response.includes('-') || response.includes('•')) score += 1;

    return Math.min(10, score);
  }
}