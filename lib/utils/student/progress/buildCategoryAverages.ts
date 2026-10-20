// lib/utils/student/progress/buildCategoryAverages.ts
//
// Pure function — no React, no Supabase.
// Computes per-category average scores from released submissions.

import type {
  RawSubmission,
  CategoryAvg,
} from '@/lib/types/student/progress/progress.types'

/**
 * Groups released submissions by category name (via examCategoryMap),
 * averages their percentages, and returns sorted descending by score.
 *
 * @param submissions    All raw submissions for the student.
 * @param examCategoryMap  Map<examId, categoryName> built from exam + category data.
 */
export function buildCategoryAverages(
  submissions:      RawSubmission[],
  examCategoryMap:  Map<string, string>,
): CategoryAvg[] {
  const buckets = new Map<string, number[]>()

  for (const s of submissions) {
    if (!s.exam_id || s.percentage === null || s.status !== 'released') {continue}

    const cat    = examCategoryMap.get(s.exam_id) ?? 'Other'
    const bucket = buckets.get(cat) ?? []
    bucket.push(s.percentage)
    buckets.set(cat, bucket)
  }

  return Array.from(buckets.entries())
    .map(([label, scores]) => ({
      label,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .sort((a, b) => b.score - a.score)
}