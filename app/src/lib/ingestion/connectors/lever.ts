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
  
  for (const company of config.companies) {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(company.slug)}?mode=json`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Lever fetch failed for ${company.slug}: ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      
      for (const job of data) {
        const title = job.text || "";
        // Basic filtering for early career / student roles
        const titleLower = title.toLowerCase();
        const isStudentFriendly = 
          titleLower.includes("intern") || 
          titleLower.includes("graduate") ||
          titleLower.includes("university") ||
          titleLower.includes("associate");
          
        const isTooSenior = 
          titleLower.includes("senior") || 
          titleLower.includes("staff") || 
          titleLower.includes("lead") ||
          titleLower.includes("manager") ||
          titleLower.includes("director");
          
        if (isTooSenior) continue;
        
        listings.push({
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
            date_added: new Date(job.createdAt).toISOString(),
            category: isStudentFriendly ? "internship" : "fulltime",
          },
          sourceSpecific: {
            source: "lever",
            lever_id: job.id,
            team: job.categories?.team,
            commitment: job.categories?.commitment,
          },
        });
      }
    } catch (e) {
      console.error(`Error fetching Lever for ${company.slug}`, e);
    }
  }

  return listings;
}
