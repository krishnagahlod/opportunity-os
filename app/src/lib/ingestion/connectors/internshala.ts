import * as cheerio from "cheerio";
import { type SourceListing } from "../types";
import { buildProxiedUrl } from "../proxy";

export interface InternshalaConfig {
  maxPages?: number; 
}

/**
 * Scrapes Internshala for the latest internships in India.
 * Uses Cheerio to parse the HTML DOM.
 */
export async function fetchInternshala(config: InternshalaConfig): Promise<SourceListing[]> {
  const { maxPages = 1 } = config;
  const listings: SourceListing[] = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://internshala.com/internships/page-${page}/`;
    
    try {
      const res = await fetch(buildProxiedUrl(url), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      
      if (!res.ok) {
        console.error(`Internshala fetch failed on page ${page}: ${res.status}`);
        break;
      }
      
      const html = await res.text();
      const $ = cheerio.load(html);
      
      $(".individual_internship").each((_, el) => {
        const title = $(el).find(".heading_4_5 a").text().trim();
        const organization = $(el).find(".heading_6.company_name a").text().trim();
        let jobUrl = $(el).find(".heading_4_5 a").attr("href");
        if (jobUrl && !jobUrl.startsWith("http")) {
          jobUrl = `https://internshala.com${jobUrl}`;
        }
        
        const jobLocation = $(el).find(".location_link").text().trim();
        // Fallback to "Work From Home" if location isn't explicit but "WFH" is in title
        const loc = jobLocation || (title.toLowerCase().includes("wfh") ? "Remote" : "India");
        
        const stipend = $(el).find(".stipend").text().trim() || "Unpaid";
        
        if (title && organization && jobUrl) {
          listings.push({
            sourceUrl: jobUrl,
            title,
            organization,
            rawText: $(el).html() || "", 
            structured: {
              title,
              organization,
              location: loc,
              apply_url: jobUrl,
              compensation: stipend,
              category: "internship", // Definitely an internship
            },
            sourceSpecific: {
              source: "internshala",
            },
          });
        }
      });
    } catch (e) {
      console.error("Error fetching Internshala page", e);
      break;
    }
    
    if (page < maxPages) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  return listings;
}
