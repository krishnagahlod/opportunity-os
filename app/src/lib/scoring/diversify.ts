/**
 * Top-pick diversification.
 *
 * Picking the N highest-scoring items by raw score frequently produces a
 * top list that's all one category — five internships in a row, no
 * fellowships or case comps surfaced. That collapses the variety the user
 * actually wants to see in their digest / featured row.
 *
 * pickDiversifiedTop solves this with a two-pass greedy:
 *   Pass 1: walk items in score order. While we've seen fewer than
 *           `minCategories` distinct categories, SKIP any item whose
 *           category has already been picked. This forces variety up front.
 *   Pass 2: fill any remaining slots with the highest-scoring items we
 *           skipped (in score order) — so the top of the list still has
 *           the best items overall, just rearranged to surface variety.
 *
 * Trade-off: the absolute top user-fit picks may shift down a slot or two
 * to make room for variety. Acceptable for digest / featured surfaces;
 * NOT applied to filtered search results (where the user explicitly asked
 * for that one thing).
 *
 * Edge cases:
 *   - Only one category exists in the input → returns top N by pure score
 *     (no items get skipped because diversity is impossible).
 *   - count larger than items.length → returns all items, in the
 *     diversified order.
 */
export function pickDiversifiedTop<T>(
  items: readonly T[],
  count: number,
  getScore: (i: T) => number,
  getCategory: (i: T) => string,
  options?: {
    /** Minimum distinct categories to surface before allowing same-category
     * picks. Default 2 — enough variety to feel curated without being
     * gimmicky. Set to 1 to disable diversification. */
    minCategories?: number;
  },
): T[] {
  if (count <= 0 || items.length === 0) return [];

  const minCats = Math.max(1, options?.minCategories ?? 2);
  const sorted = [...items].sort((a, b) => getScore(b) - getScore(a));

  const picked: T[] = [];
  const skipped: T[] = [];
  const seenCats = new Set<string>();

  // Pass 1: prefer category diversity until we hit minCats distinct categories.
  for (const item of sorted) {
    if (picked.length >= count) break;
    const cat = getCategory(item);
    if (seenCats.size < minCats && seenCats.has(cat)) {
      // Skip for now — we want a different category in this slot.
      skipped.push(item);
      continue;
    }
    picked.push(item);
    seenCats.add(cat);
  }

  // Pass 2: fill remaining slots from the items we skipped, score-ordered.
  if (picked.length < count) {
    for (const item of skipped) {
      if (picked.length >= count) break;
      picked.push(item);
    }
  }

  return picked;
}
