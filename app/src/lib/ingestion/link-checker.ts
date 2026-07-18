import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Sweeps a batch of the most stale active opportunities to verify their apply_url is still live.
 * Opportunities that return 404, 410, or redirect to a known "closed" page are marked as expired.
 * Also updates last_verified_at so we can cycle through the database systematically.
 * 
 * Returns the number of opportunities checked and the number marked as expired.
 */
export async function verifyActiveLinks(batchSize = 75): Promise<{ checked: number; expired: number }> {
  const supabase = createAdminClient();
  
  // Get oldest active opportunities by last_verified_at
  const { data: opps } = await supabase
    .from("opportunities")
    .select("id, apply_url")
    .eq("status", "active")
    .not("apply_url", "is", null)
    .order("last_verified_at", { ascending: true, nullsFirst: true })
    .limit(batchSize);

  if (!opps || opps.length === 0) return { checked: 0, expired: 0 };

  let expiredCount = 0;
  const now = new Date().toISOString();
  
  // Update last_verified_at immediately for all grabbed so another cron won't grab them
  const ids = opps.map(o => o.id);
  await supabase
    .from("opportunities")
    .update({ last_verified_at: now })
    .in("id", ids);

  // We can do this concurrently to save time
  const verifyPromises = opps.map(async (opp) => {
    if (!opp.apply_url) return;
    
    let isDead = false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); // 8s timeout
      
      const res = await fetch(opp.apply_url, { 
        method: "GET", // Using GET as some ATS systems block HEAD requests
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml"
        },
        signal: controller.signal
      });
      clearTimeout(id);
      
      // Standard HTTP errors
      if (res.status === 404 || res.status === 410) {
        isDead = true;
      } else if (res.ok) {
        // Look for specific redirect/closed clues in the URL or text
        const urlStr = res.url.toLowerCase();
        
        // LinkedIn redirects to a generic jobs search if closed
        if (urlStr.includes("unavailable") || urlStr.includes("jobs/search")) {
           isDead = true;
        }
        
        // Some ATS systems return 200 OK but the content says the job is closed.
        const text = await res.text();
        const htmlLower = text.toLowerCase();
        
        if (
          htmlLower.includes("this position has been filled") ||
          htmlLower.includes("this job is no longer available") ||
          htmlLower.includes("job posting is no longer available") ||
          htmlLower.includes("this job has been closed") ||
          htmlLower.includes("this job is no longer accepting applications") || // Greenhouse
          htmlLower.includes("this position is no longer available") || // Lever
          htmlLower.includes("this job posting is currently closed") || // Lever
          htmlLower.includes("this position has been closed") || // Ashby
          htmlLower.includes("job not found") || // Ashby
          htmlLower.includes("the job is no longer posted") || // iCIMS
          htmlLower.includes("no longer accepting applications") // LinkedIn
        ) {
          isDead = true;
        }
      }
    } catch (e) {
      // Ignore network errors or timeouts to avoid false positives
    }

    if (isDead) {
      await supabase.from("opportunities").update({ status: "expired" }).eq("id", opp.id);
      expiredCount++;
    }
  });

  await Promise.allSettled(verifyPromises);

  return { checked: opps.length, expired: expiredCount };
}
