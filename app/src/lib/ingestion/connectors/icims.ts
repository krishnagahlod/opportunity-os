import * as cheerio from "cheerio";
import { type SourceListing } from "../types";

export type IcimsCompany = {
  displayName: string;
  /** Base iCIMS domain, e.g. "https://jpmorganchase.icims.com" */
  baseUrl: string;
};

export type IcimsConfig = {
  companies: IcimsCompany[];
  searchTerms: string[];
};

export async function fetchIcims(config: IcimsConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];

  const fetchPromises = config.companies.map(async (company) => {
    const companyListings: SourceListing[] = [];

    for (const term of config.searchTerms) {
      try {
        // iCIMS uses searchKeyword and searchCategory, we'll just use searchKeyword
        // offset is typically done via &pr=0 (page 0), &pr=1 (page 1)
        let page = 0;
        let hasMore = true;
        const maxPages = 3;

        while (hasMore && page < maxPages) {
          // Some iCIMS portals use /jobs/search, some use /jobs/intro, but search is standard.
          // Note: iCIMS heavily uses iframes, so we hit the iframe source directly.
          // The query `in_iframe=1` sometimes bypasses the wrapper.
          const url = `${company.baseUrl}/jobs/search?ss=1&searchKeyword=${encodeURIComponent(term)}&pr=${page}&in_iframe=1`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html'
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch iCIMS for ${company.displayName}: ${response.status}`);
            break;
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          // iCIMS job listings are typically in div.iCIMS_JobsTable div.row
          const jobRows = $(".iCIMS_JobsTable .row");
          
          if (jobRows.length === 0) {
            hasMore = false;
            break;
          }

          jobRows.each((_, row) => {
            const titleEl = $(row).find("a.iCIMS_Anchor");
            const title = titleEl.text().trim();
            const relativeLink = titleEl.attr("href");
            
            if (!title || !relativeLink) return;

            const titleLower = title.toLowerCase();
            
            // Fast fail
            const isTooSenior = 
              titleLower.includes("senior") || 
              titleLower.includes("staff") || 
              titleLower.includes("lead") ||
              titleLower.includes("manager") ||
              titleLower.includes("director") ||
              titleLower.includes("head") ||
              titleLower.includes("vp") ||
              titleLower.includes("principal");

            if (isTooSenior) return;

            let category: any = "fulltime";
            if (titleLower.includes("intern") || titleLower.includes("internship") || titleLower.includes("co-op")) {
              category = "internship";
            }
            
            const isStrictEarlyCareer = 
              titleLower.includes("new grad") || 
              titleLower.includes("graduate") ||
              titleLower.includes("university") ||
              titleLower.includes("entry level") || 
              titleLower.includes("entry-level") || 
              titleLower.includes("associate");
              
            if (category === "fulltime" && !isStrictEarlyCareer) {
              return;
            }

            const applyUrl = relativeLink;
            
            const exists = companyListings.some(l => l.sourceUrl === applyUrl);
            if (!exists) {
              // Location is often in a span with class or just text in the row
              const locationText = $(row).find(".iCIMS_JobHeaderData").text().trim();
              
              companyListings.push({
                sourceUrl: applyUrl,
                title,
                organization: company.displayName,
                sourceSpecific: {},
                structured: {
                  title,
                  organization: company.displayName,
                  category,
                  location: locationText || "Unknown",
                  is_remote: locationText.toLowerCase().includes("remote") || false,
                  apply_url: applyUrl,
                  description: "",
                  tags: []
                },
                rawText: title + " " + locationText
              });
            }
          });

          page++;
          
          // If no next page button, stop
          if ($(".iCIMS_Paginator_Bottom a:contains('Next')").length === 0 && $(".iCIMS_Paginator_Bottom a[aria-label*='Next']").length === 0) {
            hasMore = false;
          }
        }
      } catch (error) {
        console.error(`Error fetching iCIMS for ${company.displayName}:`, error);
      }
    }
    
    return companyListings;
  });

  const results = await Promise.all(fetchPromises);
  for (const companyJobs of results) {
    listings.push(...companyJobs);
  }

  return listings;
}
