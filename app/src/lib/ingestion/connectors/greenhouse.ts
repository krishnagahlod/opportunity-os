import { type SourceListing } from "../types";

export interface GreenhouseConfig {
  boards: { slug: string; displayName: string }[];
}

/**
 * Scrapes Greenhouse public boards API.
 * https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 */
export async function fetchGreenhouse(config: GreenhouseConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  
  for (const board of config.boards) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.slug)}/jobs?content=true`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Greenhouse fetch failed for ${board.slug}: ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      const jobs = data.jobs || [];
      
      for (const job of jobs) {
        const title = job.title || "";
        // Basic filtering for early career / student roles
        const titleLower = title.toLowerCase();
        
        const isTooSenior = 
          titleLower.includes("senior") || 
          titleLower.includes("staff") || 
          titleLower.includes("lead") ||
          titleLower.includes("manager") ||
          titleLower.includes("director") ||
          titleLower.includes("head");
          
        if (isTooSenior) continue;

        const isInternship = 
          titleLower.includes("intern") || 
          titleLower.includes("graduate") ||
          titleLower.includes("university") ||
          titleLower.includes("co-op") ||
          titleLower.includes("apprentice");
          
        const isFellowship = titleLower.includes("fellow");
        const category = isInternship ? "internship" : isFellowship ? "fellowship" : "fulltime";

        // Decode HTML content to plain text if needed
        let descriptionPlain = "";
        if (job.content) {
            descriptionPlain = job.content.replace(/<[^>]*>?/gm, '').replace(/\s+/g, " ").trim();
        }
        
        listings.push({
          sourceUrl: job.absolute_url,
          title,
          organization: board.displayName,
          rawText: JSON.stringify(job),
          structured: {
            title,
            organization: board.displayName,
            location: job.location?.name || "Remote",
            apply_url: job.absolute_url,
            description: descriptionPlain,
            date_added: job.updated_at ? new Date(job.updated_at).toISOString() : new Date().toISOString(),
            category,
          },
          sourceSpecific: {
            source: "greenhouse",
            greenhouse_id: job.id,
            department: job.departments?.map((d: any) => d.name).join(", "),
          },
        });
      }
    } catch (e) {
      console.error(`Error fetching Greenhouse for ${board.slug}`, e);
    }
  }

  return listings;
}
