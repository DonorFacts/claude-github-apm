/**
 * Agent Similarity Detection Algorithm
 * 
 * Compares proposed agent profiles with existing agents to prevent
 * capability duplication and suggest enhancements to existing agents
 * instead of creating new ones.
 */

export interface AgentCapability {
  name: string;
  category: 'technical' | 'domain' | 'process' | 'soft-skill';
  proficiency: number; // 0-1 scale
  evidence?: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  specialization: string;
  capabilities: AgentCapability[];
  keywords: string[]; // Extracted keywords for quick matching
  communicationStyle?: {
    tone: string;
    detailLevel: string;
    proactivity: string;
  };
}

export interface SimilarityResult {
  similar: boolean;
  agent?: string;
  overlapScore: number;
  sharedCapabilities: string[];
  uniqueCapabilities: string[];
  recommendation: 'create-new' | 'enhance-existing' | 'create-subspecialty';
  reasoning: string;
}

/**
 * Calculate similarity between two agent profiles
 */
export function calculateSimilarity(
  newProfile: AgentProfile,
  existingProfile: AgentProfile
): number {
  let score = 0;
  let weights = {
    specialization: 0.3,
    capabilities: 0.5,
    keywords: 0.2
  };

  // 1. Specialization similarity (using simple string matching for now)
  const specializationSimilarity = calculateStringSimilarity(
    newProfile.specialization.toLowerCase(),
    existingProfile.specialization.toLowerCase()
  );
  score += specializationSimilarity * weights.specialization;

  // 2. Capability overlap
  const capabilityOverlap = calculateCapabilityOverlap(
    newProfile.capabilities,
    existingProfile.capabilities
  );
  score += capabilityOverlap * weights.capabilities;

  // 3. Keyword matching
  const keywordOverlap = calculateKeywordOverlap(
    newProfile.keywords,
    existingProfile.keywords
  );
  score += keywordOverlap * weights.keywords;

  return score;
}

/**
 * Check similarity against all existing agents
 */
export function checkAgentSimilarity(
  newProfile: AgentProfile,
  existingAgents: AgentProfile[]
): SimilarityResult {
  let highestSimilarity = 0;
  let mostSimilarAgent: AgentProfile | null = null;
  
  // Find the most similar existing agent
  for (const agent of existingAgents) {
    const similarity = calculateSimilarity(newProfile, agent);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      mostSimilarAgent = agent;
    }
  }

  // Determine recommendation based on similarity score
  if (highestSimilarity < 0.3) {
    return {
      similar: false,
      overlapScore: highestSimilarity,
      sharedCapabilities: [],
      uniqueCapabilities: newProfile.capabilities.map(c => c.name),
      recommendation: 'create-new',
      reasoning: 'Proposed agent has sufficiently unique capabilities'
    };
  }

  if (highestSimilarity > 0.7) {
    const shared = findSharedCapabilities(newProfile, mostSimilarAgent!);
    const unique = findUniqueCapabilities(newProfile, mostSimilarAgent!);
    
    return {
      similar: true,
      agent: mostSimilarAgent!.name,
      overlapScore: highestSimilarity,
      sharedCapabilities: shared,
      uniqueCapabilities: unique,
      recommendation: 'enhance-existing',
      reasoning: `High overlap (${Math.round(highestSimilarity * 100)}%) with ${mostSimilarAgent!.name}. Consider enhancing that agent instead.`
    };
  }

  // Medium similarity (0.3 - 0.7)
  const shared = findSharedCapabilities(newProfile, mostSimilarAgent!);
  const unique = findUniqueCapabilities(newProfile, mostSimilarAgent!);
  
  return {
    similar: true,
    agent: mostSimilarAgent!.name,
    overlapScore: highestSimilarity,
    sharedCapabilities: shared,
    uniqueCapabilities: unique,
    recommendation: 'create-subspecialty',
    reasoning: `Moderate overlap (${Math.round(highestSimilarity * 100)}%) with ${mostSimilarAgent!.name}. Consider creating a subspecialized agent.`
  };
}

/**
 * Helper: Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Helper: Calculate capability overlap
 */
function calculateCapabilityOverlap(
  caps1: AgentCapability[],
  caps2: AgentCapability[]
): number {
  if (caps1.length === 0 || caps2.length === 0) return 0;

  let overlapScore = 0;
  let comparisons = 0;

  for (const cap1 of caps1) {
    for (const cap2 of caps2) {
      comparisons++;
      // Compare capability names and categories
      const nameSimilarity = calculateStringSimilarity(
        cap1.name.toLowerCase(),
        cap2.name.toLowerCase()
      );
      const categorySame = cap1.category === cap2.category ? 0.3 : 0;
      const proficiencyDiff = 1 - Math.abs(cap1.proficiency - cap2.proficiency);
      
      overlapScore += (nameSimilarity * 0.5 + categorySame + proficiencyDiff * 0.2);
    }
  }

  return overlapScore / comparisons;
}

/**
 * Helper: Calculate keyword overlap using Jaccard similarity
 */
function calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1.map(k => k.toLowerCase()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Helper: Find shared capabilities between profiles
 */
function findSharedCapabilities(
  profile1: AgentProfile,
  profile2: AgentProfile
): string[] {
  const shared: string[] = [];
  
  for (const cap1 of profile1.capabilities) {
    for (const cap2 of profile2.capabilities) {
      const similarity = calculateStringSimilarity(
        cap1.name.toLowerCase(),
        cap2.name.toLowerCase()
      );
      if (similarity > 0.8 && cap1.category === cap2.category) {
        shared.push(cap1.name);
        break;
      }
    }
  }
  
  return shared;
}

/**
 * Helper: Find unique capabilities in profile1 not in profile2
 */
function findUniqueCapabilities(
  profile1: AgentProfile,
  profile2: AgentProfile
): string[] {
  const unique: string[] = [];
  
  for (const cap1 of profile1.capabilities) {
    let isUnique = true;
    for (const cap2 of profile2.capabilities) {
      const similarity = calculateStringSimilarity(
        cap1.name.toLowerCase(),
        cap2.name.toLowerCase()
      );
      if (similarity > 0.8 && cap1.category === cap2.category) {
        isUnique = false;
        break;
      }
    }
    if (isUnique) {
      unique.push(cap1.name);
    }
  }
  
  return unique;
}

/**
 * Helper: Basic Levenshtein distance implementation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Generate keywords from agent profile for quick matching
 */
export function extractKeywords(profile: AgentProfile): string[] {
  const keywords: Set<string> = new Set();
  
  // Extract from specialization
  profile.specialization.split(/\s+/).forEach(word => {
    if (word.length > 3) keywords.add(word.toLowerCase());
  });
  
  // Extract from capabilities
  profile.capabilities.forEach(cap => {
    cap.name.split(/\s+/).forEach(word => {
      if (word.length > 3) keywords.add(word.toLowerCase());
    });
    keywords.add(cap.category);
  });
  
  return Array.from(keywords);
}