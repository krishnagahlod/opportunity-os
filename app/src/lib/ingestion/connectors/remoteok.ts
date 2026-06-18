import { type SourceListing } from "../types";

export interface RemoteOKConfig {
  tags?: string[];
}

export async function fetchRemoteOK(config?: RemoteOKConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  const url = "https://remoteok.com/api";
  
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Opportunity-OS-Bot/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error(`Failed to fetch RemoteOK: ${res.status}`);
      return [];
    }

    const data = await res.json();
    
    // RemoteOK API returns an array where the first item is usually a legal notice/metadata
    const jobs = Array.isArray(data) ? data.slice(1) : [];
    
    for (const job of jobs) {
      if (!job.id || !job.title) continue;

      const title = job.title;
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

      // Strip HTML from description
      const descriptionHtml = job.description || "";
      const descriptionPlain = descriptionHtml.replace(/<[^>]*>?/gm, '').replace(/\s+/g, " ").trim();

      listings.push({
        sourceUrl: job.url,
        title,
        organization: job.company || "Unknown Company",
        rawText: JSON.stringify(job),
        structured: {
          title,
          organization: job.company || "Unknown Company",
          location: job.location || "Remote",
          apply_url: job.url,
          description: descriptionPlain.substring(0, 500) + '...',
          date_added: job.date ? new Date(job.date).toISOString() : new Date().toISOString(),
          category,
        },
        sourceSpecific: {
          source: "remoteok",
          remoteok_id: job.id,
          tags: job.tags || [],
        },
      });
    }
    
  } catch (error) {
    console.error(`[remoteok] Error fetching:`, error);
  }

  return listings;
}
