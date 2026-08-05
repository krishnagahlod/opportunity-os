import { type SourceListing } from "../types";

export interface GithubVanshConfig {
  maxItems?: number;
}

/**
 * Fetches curated internships from the vanshb03/Summer2025-Internships GitHub repository.
 */
export async function fetchGithubVansh(config: GithubVanshConfig): Promise<SourceListing[]> {
  const { maxItems = 50 } = config;
  const listings: SourceListing[] = [];
  
  try {
    const res = await fetch("https://raw.githubusercontent.com/vanshb03/Summer2025-Internships/dev/README.md", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });
    
    if (!res.ok) {
      console.error(`Vansh GitHub fetch failed: ${res.status}`);
      return listings;
    }
    
    const text = await res.text();
    
    // Parse Markdown table: | Company | Role | Location | Application/Link | Date Posted |
    const lines = text.split("\n");
    let inTable = false;
    let count = 0;
    
    for (const line of lines) {
      if (line.trim().startsWith("| Company |") || line.trim().startsWith("| Employer |")) {
        inTable = true;
        continue;
      }
      if (inTable && line.trim().startsWith("|---")) {
        continue;
      }
      
      if (inTable && line.trim().startsWith("|")) {
        const parts = line.split("|").map(p => p.trim());
        if (parts.length >= 5) {
          const companyRaw = parts[1];
          const roleRaw = parts[2];
          const locationRaw = parts[3];
          const applyRaw = parts[4];
          
          if (companyRaw.includes("↳")) continue;
          
          const company = companyRaw.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1").replace(/<[^>]*>/g, "").replace(/\*\*/g, "").trim();
          const role = roleRaw.replace(/<[^>]*>/g, "").replace(/\*\*/g, "").trim();
          const location = locationRaw.replace(/<[^>]*>/g, "").trim();
          
          let urlMatch = applyRaw.match(/href="([^"]+)"/);
          let url = urlMatch ? urlMatch[1] : null;
          
          if (!url) {
            const markdownUrlMatch = applyRaw.match(/\[([^\]]+)\]\(([^\)]+)\)/);
            if (markdownUrlMatch) url = markdownUrlMatch[2];
          }
          
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
                description: "Curated tech internship from Vanshb03 GitHub",
                tags: ["tech", "github"]
              },
              sourceSpecific: {
                source: "github-vansh",
              }
            });
            count++;
            if (count >= maxItems) break;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error fetching from GithubVansh", e);
  }
  
  return listings;
}
