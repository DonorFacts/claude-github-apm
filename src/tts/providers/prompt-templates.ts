/**
 * Prompt Templates for Contextual TTS Enhancement
 * Context-aware prompt generation for different content types
 */

export interface PromptTemplate {
  type: 'code' | 'error' | 'progress' | 'completion' | 'info';
  template: string;
  maxTokens: number;
  placeholders: string[];
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  code: {
    type: 'code',
    template: `Convert this technical update into natural, conversational speech:

Technical Update: {{message}}
{{#context}}Current Branch: {{currentBranch}}{{/context}}
{{#context.activeFiles}}Files: {{activeFiles}}{{/context.activeFiles}}

Instructions:
- Focus on what was accomplished, not technical details
- Use natural, friendly language suitable for voice output  
- Keep under 2 sentences
- Avoid jargon and acronyms where possible
- Explain what the change does for the user

Response:`,
    maxTokens: 150,
    placeholders: ['message', 'context.currentBranch', 'context.activeFiles']
  },
  
  error: {
    type: 'error',
    template: `Explain this technical error in simple, helpful terms:

Error: {{message}}
{{#context}}Context: {{errorContext}}{{/context}}

Instructions:
- Use friendly, non-technical language
- Explain what went wrong in simple terms
- Suggest a general direction for fixing it
- Keep encouraging and solution-focused
- Avoid technical jargon

Response:`,
    maxTokens: 200,
    placeholders: ['message', 'context.errorContext']
  },

  progress: {
    type: 'progress',
    template: `Express this progress update in a positive, conversational way:

Progress: {{message}}
{{#context}}Task: {{taskName}}{{/context}}
{{#context.metrics}}Metrics: {{metrics}}{{/context.metrics}}

Instructions:
- Use encouraging, upbeat language
- Make progress sound positive and meaningful
- Keep it conversational and brief
- Include percentage if available naturally

Response:`,
    maxTokens: 120,
    placeholders: ['message', 'context.taskName', 'context.metrics']
  },

  completion: {
    type: 'completion',
    template: `Celebrate this achievement with natural, encouraging speech:

Achievement: {{message}}
{{#context}}Task: {{taskName}}{{/context}}
{{#context.results}}Results: {{results}}{{/context.results}}

Instructions:
- Use celebratory, positive language
- Make the accomplishment sound meaningful
- Keep it warm and encouraging
- Mention key results if provided

Response:`,
    maxTokens: 140,
    placeholders: ['message', 'context.taskName', 'context.results']
  },

  info: {
    type: 'info',
    template: `Convert this information into clear, natural speech:

Information: {{message}}

Instructions:
- Use clear, conversational language
- Make it easy to understand when spoken
- Keep it brief and to the point
- Sound natural and friendly

Response:`,
    maxTokens: 100,
    placeholders: ['message']
  }
};

export interface PromptContext {
  currentBranch?: string;
  activeFiles?: string[];
  taskName?: string;
  errorContext?: string;
  metrics?: Record<string, number>;
  results?: string;
  sessionId?: string;
  agentRole?: string;
}

/**
 * Build a contextual prompt from template and context
 */
export function buildPrompt(
  templateType: string, 
  message: string, 
  context?: PromptContext
): string {
  const template = PROMPT_TEMPLATES[templateType];
  if (!template) {
    // Fallback to basic prompt if template not found
    return `Convert to natural speech: "${message}"`;
  }
  
  let prompt = template.template;
  
  // Replace main message placeholder
  prompt = prompt.replace('{{message}}', message);
  
  if (context) {
    // Replace context placeholders
    prompt = prompt.replace('{{currentBranch}}', context.currentBranch || '');
    prompt = prompt.replace('{{taskName}}', context.taskName || '');
    prompt = prompt.replace('{{errorContext}}', context.errorContext || '');
    prompt = prompt.replace('{{results}}', context.results || '');
    
    // Handle activeFiles array
    if (context.activeFiles && context.activeFiles.length > 0) {
      const fileList = context.activeFiles.slice(0, 3).join(', ');
      prompt = prompt.replace('{{activeFiles}}', fileList);
    } else {
      prompt = prompt.replace('{{activeFiles}}', '');
    }
    
    // Handle metrics object
    if (context.metrics && Object.keys(context.metrics).length > 0) {
      const metricStrings = Object.entries(context.metrics)
        .slice(0, 3)
        .map(([key, value]) => `${value}${key}`)
        .join(', ');
      prompt = prompt.replace('{{metrics}}', metricStrings);
    } else {
      prompt = prompt.replace('{{metrics}}', '');
    }
  }
  
  // Remove unused context blocks (conditional sections)
  prompt = prompt.replace(/\{\{#context\}\}.*?\{\{\/context\}\}/gs, '');
  prompt = prompt.replace(/\{\{#context\.[\w.]+\}\}.*?\{\{\/context\.[\w.]+\}\}/gs, '');
  
  // Clean up extra whitespace and newlines
  prompt = prompt.replace(/\n\s*\n/g, '\n').trim();
  
  return prompt;
}

/**
 * Get maximum tokens for a template type
 */
export function getMaxTokens(templateType: string): number {
  const template = PROMPT_TEMPLATES[templateType];
  return template ? template.maxTokens : 100; // Default fallback
}

/**
 * Get all available template types
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(PROMPT_TEMPLATES);
}

/**
 * Validate that a prompt doesn't exceed token limits
 */
export function validatePromptLength(prompt: string, templateType: string): {
  valid: boolean;
  estimatedTokens: number;
  maxTokens: number;
} {
  // Rough estimation: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil(prompt.length / 4);
  const maxTokens = getMaxTokens(templateType);
  
  return {
    valid: estimatedTokens <= maxTokens,
    estimatedTokens,
    maxTokens
  };
}