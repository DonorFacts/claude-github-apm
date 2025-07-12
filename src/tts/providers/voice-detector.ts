/**
 * Voice Detector for macOS Premium Voice Detection
 * Parses macOS 'say -v ?' output and identifies premium/enhanced voices
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VoiceInfo {
  name: string;
  locale: string;
  description: string;
  quality: 'premium' | 'enhanced' | 'standard';
  normalizedName: string;
}

export interface VoiceCache {
  voices: VoiceInfo[];
  lastUpdated: number;
  ttlMs: number;
}

export class VoiceDetector {
  private cache: VoiceCache | null = null;
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get available system voices with premium detection
   */
  async getSystemVoices(): Promise<VoiceInfo[]> {
    // Check cache first
    if (this.cache && this.isCacheValid()) {
      return this.cache.voices;
    }

    try {
      const voices = await this.fetchSystemVoices();
      
      // Update cache
      this.cache = {
        voices,
        lastUpdated: Date.now(),
        ttlMs: this.cacheTTL
      };

      return voices;
    } catch (error) {
      // If fetching fails and we have stale cache, use it
      if (this.cache) {
        return this.cache.voices;
      }
      throw error;
    }
  }

  /**
   * Get premium voices only
   */
  async getPremiumVoices(): Promise<VoiceInfo[]> {
    const allVoices = await this.getSystemVoices();
    return allVoices.filter(voice => voice.quality === 'premium');
  }

  /**
   * Get enhanced voices (including premium)
   */
  async getEnhancedVoices(): Promise<VoiceInfo[]> {
    const allVoices = await this.getSystemVoices();
    return allVoices.filter(voice => voice.quality === 'premium' || voice.quality === 'enhanced');
  }

  /**
   * Find voice by name (case-insensitive, supports partial matching)
   */
  async findVoice(voiceName: string): Promise<VoiceInfo | undefined> {
    const allVoices = await this.getSystemVoices();
    const normalizedSearch = this.normalizeVoiceName(voiceName);
    
    // Exact match first
    const exactMatch = allVoices.find(voice => 
      voice.normalizedName === normalizedSearch
    );
    if (exactMatch) return exactMatch;

    // Partial match
    return allVoices.find(voice => 
      voice.normalizedName.includes(normalizedSearch) ||
      normalizedSearch.includes(voice.normalizedName)
    );
  }

  /**
   * Get recommended voice for content type
   */
  async getRecommendedVoice(contentType?: string): Promise<VoiceInfo | undefined> {
    const allVoices = await this.getSystemVoices();
    
    // Priority: Premium > Enhanced > Standard
    const premiumVoices = allVoices.filter(v => v.quality === 'premium');
    const enhancedVoices = allVoices.filter(v => v.quality === 'enhanced');
    
    // Content-specific recommendations
    const recommendations: Record<string, string[]> = {
      error: ['Daniel', 'Alex', 'Fred'],
      completion: ['Samantha', 'Victoria', 'Allison'],
      progress: ['Alex', 'Fred', 'Daniel'],
      code: ['Victoria', 'Samantha', 'Allison'],
      info: ['Victoria', 'Samantha', 'Alex']
    };

    const preferredNames = recommendations[contentType || 'info'] || recommendations.info;
    
    // Try to find preferred voices in premium/enhanced first
    for (const voiceName of preferredNames) {
      const premiumMatch = premiumVoices.find(v => 
        v.normalizedName.includes(this.normalizeVoiceName(voiceName))
      );
      if (premiumMatch) return premiumMatch;
      
      const enhancedMatch = enhancedVoices.find(v => 
        v.normalizedName.includes(this.normalizeVoiceName(voiceName))
      );
      if (enhancedMatch) return enhancedMatch;
    }

    // Fallback to best available premium/enhanced voice
    if (premiumVoices.length > 0) return premiumVoices[0];
    if (enhancedVoices.length > 0) return enhancedVoices[0];
    
    // Last resort: any voice
    return allVoices[0];
  }

  /**
   * Validate if a voice is available
   */
  async isVoiceAvailable(voiceName: string): Promise<boolean> {
    const voice = await this.findVoice(voiceName);
    return voice !== undefined;
  }

  /**
   * Get voice detection statistics
   */
  async getDetectionStats(): Promise<{
    totalVoices: number;
    premiumCount: number;
    enhancedCount: number;
    standardCount: number;
    cacheAge: number;
    cacheValid: boolean;
  }> {
    const allVoices = await this.getSystemVoices();
    
    return {
      totalVoices: allVoices.length,
      premiumCount: allVoices.filter(v => v.quality === 'premium').length,
      enhancedCount: allVoices.filter(v => v.quality === 'enhanced').length,
      standardCount: allVoices.filter(v => v.quality === 'standard').length,
      cacheAge: this.cache ? Date.now() - this.cache.lastUpdated : 0,
      cacheValid: this.isCacheValid()
    };
  }

  /**
   * Clear voice cache (force refresh on next request)
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Fetch voices from system using 'say -v ?' command
   */
  private async fetchSystemVoices(): Promise<VoiceInfo[]> {
    try {
      const { stdout } = await execAsync('say -v ?');
      return this.parseVoiceOutput(stdout);
    } catch (error) {
      throw new Error(`Failed to fetch system voices: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse the output from 'say -v ?' command
   */
  private parseVoiceOutput(output: string): VoiceInfo[] {
    const lines = output.split('\n').filter(line => line.trim());
    const voices: VoiceInfo[] = [];

    for (const line of lines) {
      const voice = this.parseVoiceLine(line);
      if (voice) {
        voices.push(voice);
      }
    }

    // Sort by quality (premium first) then by name
    return voices.sort((a, b) => {
      const qualityOrder = { premium: 0, enhanced: 1, standard: 2 };
      const qualityDiff = qualityOrder[a.quality] - qualityOrder[b.quality];
      if (qualityDiff !== 0) return qualityDiff;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Parse a single line from 'say -v ?' output
   * Format: "Samantha  en_US    # Hello, my name is Samantha. I am an American-English voice."
   */
  private parseVoiceLine(line: string): VoiceInfo | null {
    // Match pattern: VoiceName  locale  # description
    const match = line.match(/^([^\s]+)\s+([^\s]+)\s+#\s*(.*)$/);
    if (!match) return null;

    const [, name, locale, description] = match;
    const quality = this.detectVoiceQuality(name, description);
    const normalizedName = this.normalizeVoiceName(name);

    return {
      name: name.trim(),
      locale: locale.trim(),
      description: description.trim(),
      quality,
      normalizedName
    };
  }

  /**
   * Detect voice quality based on name and description patterns
   */
  private detectVoiceQuality(name: string, description: string): 'premium' | 'enhanced' | 'standard' {
    const nameWithDescription = `${name} ${description}`.toLowerCase();
    
    // Premium indicators
    if (name.includes('(Enhanced)') || 
        nameWithDescription.includes('premium') ||
        nameWithDescription.includes('neural') ||
        nameWithDescription.includes('enhanced neural')) {
      return 'premium';
    }

    // Enhanced indicators  
    if (nameWithDescription.includes('enhanced') ||
        nameWithDescription.includes('high quality') ||
        nameWithDescription.includes('improved') ||
        this.isHighQualityVoice(name)) {
      return 'enhanced';
    }

    return 'standard';
  }

  /**
   * Check if voice is known to be high quality based on name
   */
  private isHighQualityVoice(name: string): boolean {
    const highQualityVoices = [
      'Samantha', 'Alex', 'Victoria', 'Daniel', 'Karen', 'Moira', 'Rishi', 'Tessa'
    ];
    return highQualityVoices.includes(name);
  }

  /**
   * Normalize voice name for comparison
   */
  normalizeVoiceName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s*\(enhanced\)\s*/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return (Date.now() - this.cache.lastUpdated) < this.cache.ttlMs;
  }
}