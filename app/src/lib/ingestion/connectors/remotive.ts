import { type SourceListing } from "../types";

export interface RemotiveConfig {
  maxItems?: number;
}

/**
 * Fetches remote software development jobs from Remotive API.
 * Filters locally for internship and entry-level/junior roles.
 */
export async function fetchRemotive(config: RemotiveConfig): Promise<SourceListing[]> {
  const { maxItems = 30 } = config;
  const listings: SourceListing[] = [];
  
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?category=software-dev", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    
    if (!res.ok) {
      console.error(`Remotive fetch failed: ${res.status}`);
      return listings;
    }
    
    const data = await res.json();
    const jobs = data.jobs || [];
    
    let count = 0;
    for (const job of jobs) {
      const titleLower = (job.title || "").toLowerCase();
      
      // Filter for entry-level and internships
      const isEarlyCareer = 
        titleLower.includes("intern") ||
        titleLower.includes("junior") ||
        titleLower.includes("jr") ||
        titleLower.includes("entry") ||
        titleLower.includes("grad") ||
        titleLower.includes("associate");
        
      if (!isEarlyCareer) continue;
      
      const isInternship = titleLower.includes("intern");
      
      listings.push({
        sourceUrl: job.url,
        title: job.title,
        organization: job.company_name,
        rawText: JSON.stringify(job),
        structured: {
          title: job.title,
          organization: job.company_name,
          category: isInternship ? "internship" : "fulltime",
          location: job.candidate_required_location || "Remote",
          is_remote: true, // Remotive is strictly remote
          apply_url: job.url,
          description: "Found via Remotive.com",
          tags: job.tags || ["remote", "tech"]
        },
        sourceSpecific: {
          source: "remotive",
          job_id: job.id
        }
      });
      
      count++;
      if (count >= maxItems) break;
    }
  } catch (e) {
    console.error("Error fetching from Remotive", e);
  }
  
  return listings;
}
