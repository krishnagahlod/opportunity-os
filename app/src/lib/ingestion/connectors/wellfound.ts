import { type SourceListing } from "../types";

export interface WellfoundConfig {
  maxItems?: number;
}

/**
 * Fetches product management and software engineering internships from Wellfound (AngelList).
 * Highly curated for remote/startup roles.
 */
export async function fetchWellfound(config: WellfoundConfig): Promise<SourceListing[]> {
  const { maxItems = 20 } = config;
  const listings: SourceListing[] = [];
  
  try {
    const res = await fetch("https://wellfound.com/graphql", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        "Accept": "*/*"
      },
      body: JSON.stringify({
        operationName: "TalentJobSearch",
        variables: {
          filter: {
            role: ["product-manager", "software-engineer", "founder"],
            jobTypes: ["internship"]
          }
        },
        query: "query TalentJobSearch($filter: TalentJobSearchFilterInput!) { talentStartupSearch(filter: $filter) { jobs { id title slug startup { name } locationNames remote } } }"
      })
    });
    
    if (!res.ok) {
      console.error(`Wellfound fetch failed: ${res.status}`);
      return listings;
    }
    
    const data = await res.json();
    const jobs = data.data?.talentStartupSearch?.jobs || [];
    
    let count = 0;
    for (const job of jobs) {
      const isRemote = job.remote || false;
      const url = `https://wellfound.com/jobs/${job.id}-${job.slug}`;
      const organization = job.startup?.name || "Startup";
      
      listings.push({
        sourceUrl: url,
        title: job.title,
        organization: organization,
        rawText: JSON.stringify(job),
        structured: {
          title: job.title,
          organization: organization,
          category: "internship",
          location: job.locationNames?.join(", ") || (isRemote ? "Remote" : "Unknown"),
          is_remote: isRemote,
          apply_url: url,
          description: "Found via Wellfound",
          tags: ["startup", "wellfound"]
        },
        sourceSpecific: {
          source: "wellfound",
          wellfoundId: job.id
        }
      });
      
      count++;
      if (count >= maxItems) break;
    }
  } catch (e) {
    console.error("Error fetching from Wellfound", e);
  }
  
  return listings;
}
