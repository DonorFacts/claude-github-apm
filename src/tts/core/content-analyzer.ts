/**
 * Content Analyzer - Intelligent content analysis for TTS routing
 * Analyzes text content to determine optimal TTS provider and voice selection
 */

import { ContentAnalysis } from '../../config/schemas/voice-settings-schema';

export class ContentAnalyzer {
  // Technical patterns for content analysis
  private readonly patterns = {
    filePaths: /\b[\w\-\/\.]+\.(ts|js|tsx|jsx|md|json|yaml|yml|py|java|cpp|c|h|css|html|xml|sql|sh|bash|zsh)\b/gi,
    codeSnippets: /(function|class|const|let|var|import|export|async|await|return|if|else|for|while|try|catch|throw|=>|===|!==|\{.*\}|\[.*\])/g,
    errorMessages: /(error|exception|failed|failure|issue|problem|bug|crash|broken|invalid|undefined|null|cannot|unable|denied|timeout|refused|missing)/gi,
    progressIndicators: /(\d+%|progress|complete|completed|finished|done|step \d+|task \d+)/gi,
    successIndicators: /(success|successful|successfully|completed|finished|done|fixed|resolved|implemented|created|added|updated|deployed)/gi,
    lineNumbers: /:\d+/g,
    stackTrace: /(at\s+[\w\.]+|Error:\s+|TypeError:\s+|ReferenceError:\s+|SyntaxError:\s+)/gi,
    urls: /(https?:\/\/[^\s]+)/gi,
    commands: /(\$|npm|yarn|pnpm|git|docker|kubectl|tsx|node|python)\s+[\w\-]+/gi,
    metrics: /(\d+\s*(ms|seconds?|minutes?|hours?|bytes?|kb|mb|gb|tb|files?|lines?|tests?))/gi
  };

  /**
   * Main content analysis method
   */
  analyzeContent(text: string): ContentAnalysis {
    if (!text || text.trim().length === 0) {
      return this.createDefaultAnalysis();
    }

    const normalizedText = text.toLowerCase();
    
    // Extract technical elements first
    const technicalElements = this.extractTechnicalElements(text);
    
    // Determine content type based on patterns and keywords
    const contentType = this.determineContentType(normalizedText, technicalElements);
    
    // Calculate technical complexity
    const complexity = this.calculateComplexity(text, technicalElements);
    
    // Determine priority based on content type and complexity
    const priority = this.determinePriority(contentType, complexity);
    
    // Suggest provider based on complexity and content type
    const suggestedProvider = this.suggestProvider(contentType, complexity);
    
    // Suggest voice based on content type
    const suggestedVoice = this.suggestVoice(contentType);

    return {
      contentType,
      complexity,
      priority,
      technicalElements,
      suggestedProvider,
      suggestedVoice
    };
  }

  /**
   * Extract technical elements from text
   */
  private extractTechnicalElements(text: string): ContentAnalysis['technicalElements'] {
    const elements = {
      filePaths: this.extractMatches(text, this.patterns.filePaths),
      codeSnippets: this.extractMatches(text, this.patterns.codeSnippets),
      errorMessages: this.extractMatches(text, this.patterns.errorMessages),
      metrics: this.extractMetrics(text)
    };

    // Remove duplicates and limit results
    elements.filePaths = [...new Set(elements.filePaths)].slice(0, 10);
    elements.codeSnippets = [...new Set(elements.codeSnippets)].slice(0, 10);
    elements.errorMessages = [...new Set(elements.errorMessages)].slice(0, 5);

    return elements;
  }

  /**
   * Determine content type based on text analysis
   */
  private determineContentType(normalizedText: string, technicalElements: ContentAnalysis['technicalElements']): ContentAnalysis['contentType'] {
    // Check for explicit error patterns first (highest priority)
    if (/\b(error|exception|failed|failure|crash|broken|invalid|timeout|refused|denied|typeerror|referenceerror|syntaxerror)\b/i.test(normalizedText) ||
        /cannot read property|is not defined|is not a function|unexpected token/i.test(normalizedText)) {
      return 'error';
    }

    // Strong progress indicators (percentages and working on patterns, but not completed actions)
    const hasStrongProgressIndicators = (/\b\d+%\b/.test(normalizedText) ||
        /\b(working on|building|updating|step \d+|progress)\b/i.test(normalizedText) ||
        this.patterns.progressIndicators.test(normalizedText)) &&
        !/\b(completed|finished|done|successful|successfully)\b/i.test(normalizedText);

    // Strong code indicators (file paths, code snippets, etc.)
    const hasStrongCodeIndicators = technicalElements.filePaths.length > 0 || 
        technicalElements.codeSnippets.length > 0 ||
        /\b(class\s|method|api|debug|refactor|bug|authentication|jwt|component|module|typescript|javascript)\b/i.test(normalizedText);

    // Progress patterns override code indicators when there are strong progress signals
    if (hasStrongProgressIndicators) {
      return 'progress';
    }

    // Check for completion patterns (past tense achievements and completion indicators)
    if ((/\b(completed|finished|done|success|successful|successfully|resolved|deployed|fixed|passed)\b/i.test(normalizedText) ||
         /\ball checks passed|build (completed|successful)|tests? passed/i.test(normalizedText)) &&
        !/\b(error|failed|issue|problem|working on|building|updating)\b/i.test(normalizedText)) {
      return 'completion';
    }

    // Check for code-related patterns
    if (hasStrongCodeIndicators || /\b(implementing|implement|code|test|validation|function\s*\()\b/i.test(normalizedText)) {
      return 'code';
    }

    // Default to info
    return 'info';
  }

  /**
   * Calculate technical complexity based on content analysis
   */
  private calculateComplexity(text: string, technicalElements: ContentAnalysis['technicalElements']): ContentAnalysis['complexity'] {
    let technicalDensity = 0;
    const textLength = text.length;

    if (textLength === 0) {
      return 'simple';
    }

    // Calculate technical density score
    technicalDensity += technicalElements.filePaths.length * 0.2;
    technicalDensity += technicalElements.codeSnippets.length * 0.15;
    technicalDensity += technicalElements.errorMessages.length * 0.25;
    technicalDensity += Object.keys(technicalElements.metrics).length * 0.1;

    // Check for additional complexity indicators
    const complexPatterns = [
      this.patterns.stackTrace,
      this.patterns.urls,
      this.patterns.commands,
      this.patterns.lineNumbers
    ];

    complexPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        technicalDensity += matches.length * 0.1;
      }
    });

    // Normalize density based on text length (longer text can handle more technical terms)
    const normalizedDensity = technicalDensity / Math.max(textLength / 100, 1);

    // Determine complexity level with balanced thresholds
    if (normalizedDensity > 0.5 || technicalDensity > 3.5) {
      return 'complex';
    } else if (normalizedDensity > 0.15 || technicalDensity > 1) {
      return 'technical';
    } else {
      return 'simple';
    }
  }

  /**
   * Determine priority based on content type and complexity
   */
  private determinePriority(contentType: ContentAnalysis['contentType'], complexity: ContentAnalysis['complexity']): ContentAnalysis['priority'] {
    // Errors are always high priority
    if (contentType === 'error') {
      return 'high';
    }

    // Task completion is medium-high priority
    if (contentType === 'completion') {
      return 'medium';
    }

    // Complex technical content gets higher priority
    if (complexity === 'complex') {
      return 'medium';
    }

    // Everything else is low priority
    return 'low';
  }

  /**
   * Suggest TTS provider based on content analysis
   */
  private suggestProvider(contentType: ContentAnalysis['contentType'], complexity: ContentAnalysis['complexity']): 'system' | 'mistral' {
    // Use Mistral for complex technical content that benefits from AI enhancement
    if (complexity === 'complex' || complexity === 'technical') {
      return 'mistral';
    }

    // Use Mistral for error messages (needs simplification)
    if (contentType === 'error') {
      return 'mistral';
    }

    // Use Mistral for code-related content (needs natural explanation)
    if (contentType === 'code') {
      return 'mistral';
    }

    // Use system TTS for simple content
    return 'system';
  }

  /**
   * Suggest voice based on content type
   */
  private suggestVoice(contentType: ContentAnalysis['contentType']): string | undefined {
    // These correspond to the contextualVoices in VoiceSettings
    const voiceMap: Record<ContentAnalysis['contentType'], string> = {
      error: 'Daniel',
      info: 'Victoria',
      progress: 'Alex',
      completion: 'Samantha',
      code: 'Victoria' // Use info voice for code content
    };

    return voiceMap[contentType];
  }

  /**
   * Extract pattern matches from text
   */
  private extractMatches(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern);
    return matches ? matches.map(match => match.trim()).filter(Boolean) : [];
  }

  /**
   * Extract metrics from text
   */
  private extractMetrics(text: string): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Extract standard metrics pattern
    const matches = text.match(this.patterns.metrics);
    if (matches) {
      matches.forEach(match => {
        const parts = match.trim().split(/\s+/);
        if (parts.length >= 2) {
          const value = parseFloat(parts[0]);
          const unit = parts.slice(1).join(' ');
          
          if (!isNaN(value)) {
            metrics[unit] = value;
          }
        }
      });
    }

    // Extract percentages specifically
    const percentMatches = text.match(/(\d+(?:\.\d+)?)%/g);
    if (percentMatches) {
      percentMatches.forEach(match => {
        const value = parseFloat(match.replace('%', ''));
        if (!isNaN(value)) {
          metrics['%'] = value;
        }
      });
    }

    // Extract numbers with units (more flexible pattern)
    const flexibleMatches = text.match(/(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?|hours?|bytes?|kb|mb|gb|tb|files?|lines?|tests?)/gi);
    if (flexibleMatches) {
      flexibleMatches.forEach(match => {
        const parts = match.trim().split(/\s+/);
        if (parts.length >= 1) {
          const numberPart = parts[0];
          const unitPart = parts.slice(1).join(' ') || match.replace(/\d+(?:\.\d+)?/g, '').trim();
          const value = parseFloat(numberPart);
          
          if (!isNaN(value) && unitPart) {
            metrics[unitPart] = value;
          }
        }
      });
    }

    return metrics;
  }

  /**
   * Create default analysis for empty or invalid content
   */
  private createDefaultAnalysis(): ContentAnalysis {
    return {
      contentType: 'info',
      complexity: 'simple',
      priority: 'low',
      technicalElements: {
        filePaths: [],
        codeSnippets: [],
        errorMessages: [],
        metrics: {}
      },
      suggestedProvider: 'system',
      suggestedVoice: 'Victoria'
    };
  }

  /**
   * Get analysis statistics for debugging
   */
  getAnalysisStats(text: string): {
    textLength: number;
    technicalElementsCount: number;
    patternMatches: Record<string, number>;
  } {
    const technicalElements = this.extractTechnicalElements(text);
    const patternMatches: Record<string, number> = {};

    Object.entries(this.patterns).forEach(([key, pattern]) => {
      const matches = text.match(pattern);
      patternMatches[key] = matches ? matches.length : 0;
    });

    return {
      textLength: text.length,
      technicalElementsCount: 
        technicalElements.filePaths.length +
        technicalElements.codeSnippets.length +
        technicalElements.errorMessages.length +
        Object.keys(technicalElements.metrics).length,
      patternMatches
    };
  }
}