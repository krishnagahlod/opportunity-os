import { type SourceListing } from "../types";

export interface LeverConfig {
  companies: { slug: string; displayName: string }[];
}

/**
 * Scrapes Lever public postings API.
 * https://api.lever.co/v0/postings/{site}?mode=json
 */
export async function fetchLever(config: LeverConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  
  const fetchPromises = config.companies.map(async (company) => {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company.slug)}?mode=json`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Lever fetch failed for ${company.slug}: ${res.status}`);
        return [];
      }
      
      const data = await res.json();
      const companyListings: SourceListing[] = [];
      
      for (const job of data) {
        const title = job.text || "";
        const titleLower = title.toLowerCase();
        
        const isTooSenior = 
          titleLower.includes("senior") || 
          titleLower.includes("staff") || 
          titleLower.includes("lead") ||
          titleLower.includes("manager") ||
          titleLower.includes("director") ||
          titleLower.includes("head") ||
          titleLower.includes("principal") ||
          titleLower.includes("architect") ||
          titleLower.includes("vp ") ||
          titleLower.includes("president");
          
        if (isTooSenior) continue;
        
        const isInternship = 
          titleLower.includes("intern") || 
          titleLower.includes("graduate") ||
          titleLower.includes("university") ||
          titleLower.includes("co-op") ||
          titleLower.includes("apprentice");
          
        const isFellowship = titleLower.includes("fellow");
        const category = isInternship ? "internship" : isFellowship ? "fellowship" : "fulltime";

        companyListings.push({
          sourceUrl: job.applyUrl || job.hostedUrl,
          title,
          organization: company.displayName,
          rawText: JSON.stringify(job),
          structured: {
            title,
            organization: company.displayName,
            location: job.categories?.location || "Remote",
            apply_url: job.applyUrl || job.hostedUrl,
            description: job.descriptionPlain || job.description || "",
            date_added: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
            category,
          },
          sourceSpecific: {
            source: "lever",
            lever_id: job.id,
            department: job.categories?.team,
            commitment: job.categories?.commitment,
          },
        });
      }
      return companyListings;
    } catch (e) {
      console.error(`Error fetching Lever for ${company.slug}`, e);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      listings.push(...result.value);
    }
  }

  return listings;
}
