import { SourceListing } from "../types";

export interface UnstopConfig {
  maxItems?: number;
}

/**
 * Scrapes Unstop open opportunities (hackathons, case comps, hiring challenges).
 */
export async function fetchUnstop(config: UnstopConfig = {}): Promise<SourceListing[]> {
  const { maxItems = 10 } = config;
  const listings: SourceListing[] = [];
  
  try {
    // We hit their API endpoint for opportunities
    // Searching for currently open opportunities, sort by popularity or latest
    const url = "https://unstop.com/api/public/opportunity/search-result?opportunity=hackathons,competitions,workshops,conferences,festivals,hiring-challenges&per_page=" + maxItems;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Opportunity-OS-Bot/1.0",
        "Accept": "application/json",
      },
      next: { revalidate: 0 },
    });
    
    if (!res.ok) {
      console.error(`[unstop] fetch failed: ${res.status}`);
      return [];
    }
    
    const data = await res.json();
    const items = data?.data?.data || [];
    
    for (const item of items) {
      const title = item.title;
      const host = item.organization?.name || item.institute_name || "Unstop Host";
      const itemUrl = item.seo_url ? `https://unstop.com/${item.seo_url}` : null;
      
      if (title && itemUrl) {
        const prize = item.payment_prizes || "";
        const categoryHint = item.type === "hiring-challenges" ? "fulltime" : 
                             item.type === "hackathons" ? "hackathon" : "case_competition";
        
        const rawText = [
          `SOURCE: Unstop`,
          `URL: ${itemUrl}`,
          `TITLE: ${title}`,
          `HOST: ${host}`,
          `PRIZE: ${prize}`,
          `HINT CATEGORY: ${categoryHint}`,
          `TYPE: ${item.type}`,
        ].join("\n");

        listings.push({
          sourceUrl: itemUrl,
          title,
          organization: host,
          rawText,
          sourceSpecific: {
            source: "unstop",
            type: item.type,
          },
          structured: {
            title,
            organization: host,
            apply_url: itemUrl,
            category: categoryHint,
            compensation: prize,
            date_added: new Date().toISOString(),
          }
        });
      }
    }
  } catch (e) {
    console.error(`[unstop] Error fetching:`, e);
  }

  return listings;
}
