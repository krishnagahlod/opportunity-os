import * as cheerio from "cheerio";
import { type SourceListing } from "../types";
import { buildProxiedUrl } from "../proxy";

export interface LinkedInConfig {
  keywords: string;
  location: string;
  maxPages?: number; // Each page is 25 jobs
}

/**
 * Scrapes public LinkedIn job postings using the jobs-guest API.
 * Uses Cheerio for robust HTML parsing instead of fragile regex.
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
      const res = await fetch(buildProxiedUrl(url), {
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
      const $ = cheerio.load(html);
      
      $("li").each((_, el) => {
        const title = $(el).find("h3.base-search-card__title").text().trim();
        const organization = $(el).find("h4.base-search-card__subtitle").text().trim();
        const jobUrl = $(el).find("a.base-card__full-link").attr("href")?.split("?")[0] || "";
        const jobLocation = $(el).find("span.job-search-card__location").text().trim() || "Unknown";
        const dateAdded = $(el).find("time").attr("datetime") || new Date().toISOString();
        
        if (title && organization && jobUrl) {
          const titleLower = title.toLowerCase();
          const isInternship = 
            titleLower.includes("intern") || 
            titleLower.includes("trainee") ||
            titleLower.includes("apprentice") ||
            titleLower.includes("co-op") ||
            titleLower.includes("working student");
          const isFellowship = titleLower.includes("fellow");
          const category = isInternship ? "internship" : isFellowship ? "fellowship" : "fulltime";

          const rawHtml = $(el).html() || "";
          const plainText = $(el).text().replace(/\s+/g, " ").trim();

          listings.push({
            sourceUrl: jobUrl,
            title,
            organization,
            rawText: plainText, 
            structured: {
              title,
              organization,
              location: jobLocation,
              apply_url: jobUrl,
              date_added: dateAdded,
              category, // Refined based on title
            },
            sourceSpecific: {
              source: "linkedin_public",
            },
          });
        }
      });
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
