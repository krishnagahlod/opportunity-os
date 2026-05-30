import { type SourceListing } from "../types";

export interface LinkedInConfig {
  keywords: string;
  location: string;
  maxPages?: number; // Each page is 25 jobs
}

/**
 * Scrapes public LinkedIn job postings using the jobs-guest API.
 * This is a completely free approach that fetches the HTML cards.
 */
export async function fetchLinkedIn(config: LinkedInConfig): Promise<SourceListing[]> {
  const { keywords, location, maxPages = 1 } = config;
  const listings: SourceListing[] = [];
  
  for (let page = 0; page < maxPages; page++) {
    const start = page * 25;
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
      keywords
    )}&location=${encodeURIComponent(location)}&start=${start}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      
      if (!res.ok) {
        console.error(`LinkedIn fetch failed: ${res.status}`);
        break; // Stop fetching on failure (likely rate-limited)
      }
      
      const html = await res.text();
      
      // Simple regex extraction since we can't reliably install cheerio
      const liMatches = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
      
      for (const li of liMatches) {
        const titleMatch = li.match(/<h3[^>]*base-search-card__title[^>]*>\s*([\s\S]*?)\s*<\/h3>/i);
        const orgMatch = li.match(/<h4[^>]*base-search-card__subtitle[^>]*>\s*(?:<a[^>]*>)?\s*([\s\S]*?)\s*(?:<\/a>)?\s*<\/h4>/i);
        const linkMatch = li.match(/<a[^>]*base-card__full-link[^>]*href="([^"]+)"/i);
        const locMatch = li.match(/<span[^>]*job-search-card__location[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
        const dateMatch = li.match(/<time[^>]*datetime="([^"]+)"/i);
        
        if (titleMatch && orgMatch && linkMatch) {
          const title = titleMatch[1].trim();
          const organization = orgMatch[1].trim();
          const jobUrl = linkMatch[1].split("?")[0] || "";
          const jobLocation = locMatch ? locMatch[1].trim() : "Unknown";
          const dateAdded = dateMatch ? dateMatch[1] : new Date().toISOString();

          listings.push({
            sourceUrl: jobUrl,
            title,
            organization,
            rawText: li, 
            structured: {
              title,
              organization,
              location: jobLocation,
              apply_url: jobUrl,
              date_added: dateAdded,
              category: "fulltime", 
            },
            sourceSpecific: {
              source: "linkedin_public",
            },
          });
        }
      }
    } catch (e) {
      console.error("Error fetching LinkedIn page", e);
      break;
    }
    
    if (page < maxPages - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return listings;
}
