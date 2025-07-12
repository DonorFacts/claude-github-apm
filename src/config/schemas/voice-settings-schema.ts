/**
 * Voice Settings Schema - Zod validation schema for TTS voice configuration
 * Defines type-safe configuration for Claude Code TTS integration
 */

import { z } from 'zod';

// Voice settings configuration schema
export const VoiceSettingsSchema = z.object({
  defaultVoice: z.string().default('Samantha'),
  
  voiceSettings: z.object({
    rate: z.number().min(90).max(720).default(200),
    volume: z.number().min(0).max(1).default(0.8),
    pitch: z.number().optional()
  }).default({
    rate: 200,
    volume: 0.8
  }),
  
  contextualVoices: z.object({
    success: z.string(),
    error: z.string(), 
    info: z.string(),
    progress: z.string(),
    completion: z.string()
  }).default({
    success: 'Samantha',
    error: 'Daniel',
    info: 'Victoria', 
    progress: 'Alex',
    completion: 'Samantha'
  }),
  
  mistralSettings: z.object({
    enableForHooks: z.boolean().default(true),
    summarizationPrompts: z.object({
      code: z.string().default('Convert this technical update into natural speech focusing on what was accomplished. Keep it under 2 sentences.'),
      error: z.string().default('Explain this technical error in simple, friendly terms for voice output.'),
      progress: z.string().default('Express this progress update in a positive, conversational way suitable for voice output.'),
      completion: z.string().default('Celebrate this task completion with natural, encouraging speech.')
    }).default({
      code: 'Convert this technical update into natural speech focusing on what was accomplished. Keep it under 2 sentences.',
      error: 'Explain this technical error in simple, friendly terms for voice output.',
      progress: 'Express this progress update in a positive, conversational way suitable for voice output.',
      completion: 'Celebrate this task completion with natural, encouraging speech.'
    }),
    contextDepth: z.enum(['minimal', 'moderate', 'full']).default('moderate'),
    maxTokens: z.number().min(50).max(500).optional().default(200)
  }).default({
    enableForHooks: true,
    summarizationPrompts: {
      code: 'Convert this technical update into natural speech focusing on what was accomplished. Keep it under 2 sentences.',
      error: 'Explain this technical error in simple, friendly terms for voice output.',
      progress: 'Express this progress update in a positive, conversational way suitable for voice output.',
      completion: 'Celebrate this task completion with natural, encouraging speech.'
    },
    contextDepth: 'moderate',
    maxTokens: 200
  }),
  
  hookIntegration: z.object({
    enableAutoSpeech: z.boolean().default(true),
    speakOnTaskCompletion: z.boolean().default(true),
    speakOnErrors: z.boolean().default(true),
    speakOnProgress: z.enum(['all', 'major_only', 'none']).default('major_only'),
    debounceMs: z.number().min(100).max(10000).default(500)
  }).default({
    enableAutoSpeech: true,
    speakOnTaskCompletion: true,
    speakOnErrors: true,
    speakOnProgress: 'major_only',
    debounceMs: 500
  }),
  
  premiumVoicesDetected: z.array(z.string()).optional()
});

// Export the TypeScript type
export type VoiceSettings = z.infer<typeof VoiceSettingsSchema>;

// Content analysis types
export const ContentAnalysisSchema = z.object({
  contentType: z.enum(['code', 'error', 'progress', 'completion', 'info']),
  complexity: z.enum(['simple', 'technical', 'complex']),
  priority: z.enum(['low', 'medium', 'high']),
  technicalElements: z.object({
    filePaths: z.array(z.string()),
    codeSnippets: z.array(z.string()),
    errorMessages: z.array(z.string()),
    metrics: z.record(z.string(), z.number())
  }),
  suggestedProvider: z.enum(['system', 'mistral']),
  suggestedVoice: z.string().optional()
});

export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;

// Hook event types
export const TTSHookEventSchema = z.object({
  type: z.enum(['agent_response', 'task_completion', 'error', 'progress']),
  content: z.string(),
  metadata: z.object({
    sessionId: z.string(),
    timestamp: z.number(),
    agentRole: z.string().optional(),
    taskId: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  }),
  context: z.object({
    recentActivity: z.array(z.string()),
    currentBranch: z.string().optional(),
    activeFiles: z.array(z.string()).optional()
  }).optional()
});

export type TTSHookEvent = z.infer<typeof TTSHookEventSchema>;

/**
 * Parse and validate voice settings with helpful error messages
 */
export function parseVoiceSettings(data: unknown): { 
  success: true; 
  data: VoiceSettings; 
} | { 
  success: false; 
  error: string; 
  issues: string[]; 
} {
  try {
    const result = VoiceSettingsSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => 
        `${issue.path.join('.')}: ${issue.message}`
      );
      return {
        success: false,
        error: 'Voice settings validation failed',
        issues
      };
    }
    
    return {
      success: false,
      error: 'Unknown validation error',
      issues: [String(error)]
    };
  }
}

/**
 * Safe parse that returns defaults on failure
 */
export function parseVoiceSettingsWithDefaults(data: unknown): VoiceSettings {
  const result = parseVoiceSettings(data);
  if (result.success) {
    return result.data;
  }
  
  // Return defaults if parsing fails
  return VoiceSettingsSchema.parse({});
}

/**
 * Validate that a voice settings object is complete
 */
export function validateVoiceSettings(settings: Partial<VoiceSettings>): {
  isValid: boolean;
  missingFields: string[];
  invalidFields: string[];
} {
  const result = VoiceSettingsSchema.safeParse(settings);
  
  if (result.success) {
    return {
      isValid: true,
      missingFields: [],
      invalidFields: []
    };
  }
  
  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    if (issue.code === 'invalid_type' && 'received' in issue && issue.received === 'undefined') {
      missingFields.push(path);
    } else {
      invalidFields.push(`${path}: ${issue.message}`);
    }
  });
  
  return {
    isValid: false,
    missingFields,
    invalidFields
  };
}