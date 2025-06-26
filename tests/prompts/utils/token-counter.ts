/**
 * Token Counter for estimating Claude token usage
 * Based on approximate tokenization rules for Claude
 */
export class TokenCounter {
  /**
   * Estimate token count for a given text
   * Claude uses a similar tokenization to GPT models
   * Rough estimate: ~4 characters per token on average
   */
  count(text: string): number {
    if (!text) return 0;

    // More accurate estimation based on different content types
    let tokens = 0;

    // Split into words for better estimation
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (word.length === 0) continue;
      
      // Short words (1-3 chars) are usually 1 token
      if (word.length <= 3) {
        tokens += 1;
      }
      // Medium words (4-7 chars) are often 1-2 tokens
      else if (word.length <= 7) {
        tokens += Math.ceil(word.length / 4);
      }
      // Longer words need more tokens
      else {
        tokens += Math.ceil(word.length / 3.5);
      }
    }

    // Add tokens for punctuation and special characters
    const punctuation = text.match(/[.,!?;:"'()\[\]{}<>\/\\|@#$%^&*+=`~_-]/g);
    if (punctuation) {
      tokens += punctuation.length * 0.3; // Punctuation often shares tokens
    }

    // Add tokens for newlines and formatting
    const newlines = text.match(/\n/g);
    if (newlines) {
      tokens += newlines.length;
    }

    // Code blocks tend to use more tokens
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      const codeContent = codeBlocks.join('');
      tokens += codeContent.length * 0.1; // Additional tokens for code
    }

    return Math.ceil(tokens);
  }

  /**
   * Compare token usage between two texts
   */
  compare(textA: string, textB: string): {
    tokensA: number;
    tokensB: number;
    difference: number;
    percentageReduction: number;
  } {
    const tokensA = this.count(textA);
    const tokensB = this.count(textB);
    const difference = tokensA - tokensB;
    const percentageReduction = tokensA > 0 ? (difference / tokensA) * 100 : 0;

    return {
      tokensA,
      tokensB,
      difference,
      percentageReduction
    };
  }

  /**
   * Analyze token distribution in text
   */
  analyze(text: string): {
    total: number;
    words: number;
    punctuation: number;
    whitespace: number;
    codeBlocks: number;
    averageTokensPerLine: number;
  } {
    const total = this.count(text);
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const punctuation = (text.match(/[.,!?;:"'()\[\]{}<>\/\\|@#$%^&*+=`~_-]/g) || []).length;
    const whitespace = (text.match(/\s/g) || []).length;
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    const lines = text.split('\n').length;
    const averageTokensPerLine = lines > 0 ? total / lines : 0;

    return {
      total,
      words,
      punctuation,
      whitespace,
      codeBlocks,
      averageTokensPerLine
    };
  }
}