import { supabase } from './supabase';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type PriorityScore = 4 | 3 | 2 | 1;

export interface PriorityResult {
  priorityLevel: PriorityLevel;
  priorityScore: PriorityScore;
  detectedKeywords: string[];
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * Calculate priority for a complaint by looking up active keywords from the
 * database at calculation time. This keeps priority mapping admin-controlled.
 *
 * IMPORTANT: The returned `detectedKeywords` should be stored on the complaint
 * record so historical complaints preserve the keywords that were active when
 * they were submitted. Keyword config changes must NOT retroactively change
 * existing complaints.
 */
export async function calculatePriority(
  category: string,
  description: string,
  location: string,
): Promise<PriorityResult> {
  const combinedText = `${category} ${description} ${location}`;
  const normalized = normalizeText(combinedText);

  // Fetch only active keywords from database.
  const { data: keywords, error } = await supabase
    .from('priority_keywords')
    .select('keyword, priority_level, priority_score')
    .eq('is_active', true)
    .order('priority_score', { ascending: false });

  if (error) {
    // Fail open to LOW priority if DB is unavailable, but log the issue.
    console.error('Failed to load priority keywords:', error);
    return {
      priorityLevel: 'LOW',
      priorityScore: 1,
      detectedKeywords: [],
    };
  }

  const matched: string[] = [];
  let highestLevel: PriorityLevel = 'LOW';
  let highestScore: PriorityScore = 1;

  for (const kw of keywords || []) {
    const normalizedKeyword = normalizeText(kw.keyword);
    if (normalized.includes(normalizedKeyword) && !matched.includes(kw.keyword)) {
      matched.push(kw.keyword);
      const score = kw.priority_score as PriorityScore;
      if (score > highestScore) {
        highestScore = score;
        highestLevel = kw.priority_level as PriorityLevel;
      }
    }
  }

  return {
    priorityLevel: highestLevel,
    priorityScore: highestScore,
    detectedKeywords: matched,
  };
}

export function formatPriorityLabel(level: PriorityLevel): string {
  return level;
}
