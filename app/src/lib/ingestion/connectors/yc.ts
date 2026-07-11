import { type SourceListing } from "../types";

export type YcConfig = {
  searchTerms: string[];
};

export async function fetchYcJobs(config: YcConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  
  try {
    // We use the Hacker News API to get active job stories (which are 95% YC companies)
    // This is incredibly robust and never blocked, unlike scraping workatastartup directly.
    const res = await fetch("https://hacker-news.firebaseio.com/v0/jobstories.json");
    if (!res.ok) {
      console.error("Failed to fetch HN job stories:", res.status);
      return [];
    }
    
    const jobIds = await res.json();
    if (!Array.isArray(jobIds)) return [];
    
    // Fetch all job details
    const jobPromises = jobIds.map(async (id: number) => {
      try {
        const jobRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        if (!jobRes.ok) return null;
        return await jobRes.json();
      } catch (err) {
        return null;
      }
    });
    
    const jobs = await Promise.all(jobPromises);
    
    for (const job of jobs) {
      if (!job || !job.title) continue;
      
      const titleLower = job.title.toLowerCase();
      
      // Fast fail for obviously senior roles
      const isTooSenior = 
        titleLower.includes("senior") || 
        titleLower.includes("staff") || 
        titleLower.includes("lead") ||
        titleLower.includes("manager") ||
        titleLower.includes("director") ||
        titleLower.includes("head") ||
        titleLower.includes("vp") ||
        titleLower.includes("principal");

      if (isTooSenior) continue;

      let matchesTerm = false;
      for (const term of config.searchTerms) {
        if (titleLower.includes(term.toLowerCase())) {
          matchesTerm = true;
          break;
        }
      }
      
      // If the user specified strict search terms for YC, filter them.
      // E.g., "intern", "product", "founder", "ai", "genai"
      if (!matchesTerm && config.searchTerms.length > 0) continue;

      let category: any = "fulltime";
      if (titleLower.includes("intern") || titleLower.includes("internship") || titleLower.includes("co-op")) {
        category = "internship";
      }

      // We extract organization from title if it's like "StartupName (YC W23) is hiring..."
      let organization = "YC Startup";
      const orgMatch = job.title.match(/^(.+?)\s*\(/);
      if (orgMatch && orgMatch[1]) {
        organization = orgMatch[1].trim();
      } else if (job.title.includes("is hiring")) {
        organization = job.title.split("is hiring")[0].trim();
      }

      // Sometimes job.url is not present, meaning the description is in job.text
      const applyUrl = job.url || `https://news.ycombinator.com/item?id=${job.id}`;

      listings.push({
        sourceUrl: applyUrl,
        title: job.title,
        organization,
        sourceSpecific: { hnId: job.id },
        structured: {
          title: job.title,
          organization,
          category,
          location: titleLower.includes("remote") ? "Remote" : "Unknown",
          is_remote: titleLower.includes("remote"),
          apply_url: applyUrl,
          description: job.text || "",
          tags: titleLower.includes("ai") ? ["ai", "startup"] : ["startup"]
        },
        rawText: JSON.stringify(job)
      });
    }
    
  } catch (err) {
    console.error("Error fetching YC/HN jobs:", err);
  }
  
  return listings;
}
