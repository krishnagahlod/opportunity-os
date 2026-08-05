import { type SourceListing } from "../types";

export interface SimplifyConfig {
  maxItems?: number;
}

/**
 * Fetches curated internships from the SimplifyJobs GitHub repository (Summer 2024/2025).
 * Highly curated for paid tech internships.
 */
export async function fetchSimplify(config: SimplifyConfig): Promise<SourceListing[]> {
  const { maxItems = 50 } = config;
  const listings: SourceListing[] = [];
  
  try {
    // Simplify's main open-source repo for internships
    const res = await fetch("https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/README.md", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    
    if (!res.ok) {
      console.error(`Simplify GitHub fetch failed: ${res.status}`);
      return listings;
    }
    
    const text = await res.text();
    
    // Parse Markdown table: | Company | Role | Location | Application/Link | Date Posted |
    const lines = text.split("\n");
    let inTable = false;
    let count = 0;
    
    for (const line of lines) {
      if (line.trim().startsWith("| Company |")) {
        inTable = true;
        continue;
      }
      if (inTable && line.trim().startsWith("|---")) {
        continue;
      }
      
      if (inTable && line.trim().startsWith("|")) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 5) {
          const companyRaw = parts[1]; // might have markdown links
          const roleRaw = parts[2];
          const locationRaw = parts[3];
          const applyRaw = parts[4];
          
          if (companyRaw.includes("↳")) continue; // Skip sub-roles if not useful
          
          const company = companyRaw.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/<[^>]*>/g, "").replace(/\*\*/g, "").trim();
          const role = roleRaw.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").trim();
          const location = locationRaw.replace(/<[^>]*>/g, "").trim();
          
          const urlMatch = applyRaw.match(/href="([^"]+)"/);
          let url = urlMatch ? urlMatch[1] : null;
          
          if (!url) {
            const markdownUrlMatch = applyRaw.match(/\[([^\]]+)\]\(([^\)]+)\)/);
            if (markdownUrlMatch) url = markdownUrlMatch[2];
          }
          
          // Only take open roles (often marked with closed emojis, let's just assume valid URL means open for this basic parse)
          if (url && company && role) {
            const isRemote = location.toLowerCase().includes("remote");
            
            listings.push({
              sourceUrl: url,
              title: role,
              organization: company,
              rawText: line,
              structured: {
                title: role,
                organization: company,
                category: "internship",
                location: location,
                is_remote: isRemote,
                apply_url: url,
                description: "Curated tech internship from SimplifyJobs",
                tags: ["tech", "simplify"]
              },
              sourceSpecific: {
                source: "simplify",
              }
            });
            count++;
            if (count >= maxItems) break;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error fetching from Simplify", e);
  }
  
  return listings;
}
