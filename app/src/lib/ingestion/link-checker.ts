import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sweeps a batch of oldest active opportunities from sources that often have closed listings (like LinkedIn)
 * to verify their apply_url is still live.
 * Opportunities that return 404 or redirect to a known "closed" page are marked as expired.
 * 
 * Returns the number of opportunities checked and the number marked as expired.
 */
export async function verifyActiveLinks(batchSize = 20): Promise<{ checked: number; expired: number }> {
  const supabase = createAdminClient();
  
  // Find LinkedIn source ID
  const { data: linkedinSource } = await supabase
    .from("sources")
    .select("id")
    .ilike("name", "%linkedin%")
    .single();
    
  if (!linkedinSource) return { checked: 0, expired: 0 };

  // Get oldest active opportunities for this source
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, apply_url")
    .eq("status", "active")
    .eq("source_id", linkedinSource.id)
    .not("apply_url", "is", null)
    .order("date_added", { ascending: true })
    .limit(batchSize);

  if (!opps || opps.length === 0) return { checked: 0, expired: 0 };

  let expiredCount = 0;

  for (const opp of opps) {
    if (!opp.apply_url) continue;
    
    let isDead = false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const res = await fetch(opp.apply_url, { 
        method: "HEAD",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" },
        signal: controller.signal
      });
      clearTimeout(id);
      
      // LinkedIn sometimes returns 404 for closed jobs, or redirects to a specific URL
      if (res.status === 404 || res.status === 410 || res.url.includes("unavailable")) {
        isDead = true;
      }
    } catch (e) {
      // Ignore network errors or timeouts to avoid false positives
    }

    if (isDead) {
      await supabase.from("opportunities").update({ status: "expired" }).eq("id", opp.id);
      expiredCount++;
    } else {
      // We don't have last_verified_at, so to avoid checking this same active job forever,
      // we can update its date_added slightly so it moves to the back of the queue, 
      // or we accept that it will be checked frequently until it expires.
      // Since maxAge for LinkedIn is 14 days, checking the oldest 20 each day is perfectly fine.
    }
  }

  return { checked: opps.length, expired: expiredCount };
}
