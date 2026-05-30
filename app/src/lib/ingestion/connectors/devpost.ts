import { type SourceListing } from "../types";

export interface DevpostConfig {
  maxPages?: number;
}

/**
 * Scrapes Devpost public hackathons list.
 * https://devpost.com/hackathons?page=1
 */
export async function fetchDevpost(config: DevpostConfig = {}): Promise<SourceListing[]> {
  const { maxPages = 2 } = config;
  const listings: SourceListing[] = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://devpost.com/hackathons?page=${page}`;
    
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        }
      });
      
      if (!res.ok) {
        console.error(`Devpost fetch failed for page ${page}: ${res.status}`);
        break;
      }
      
      const html = await res.text();
      
      const tiles = html.split('class="hackathon-tile"');
      tiles.shift(); // remove everything before first tile
      
      for (const tile of tiles) {
        const titleMatch = tile.match(/<h3[^>]*>\s*([^<]*?)\s*<\/h3>/i);
        const urlMatch = tile.match(/<a[^>]*class="[^"]*main-link[^"]*"[^>]*href="([^"]+)"/i);
        const hostMatch = tile.match(/class="host-label"[^>]*>\s*([^<]*?)\s*<\/span>/i);
        const locMatch = tile.match(/class="info[^>]*>[\s\S]*?class="label"[^>]*>\s*([^<]*?)\s*<\/span>/i);
        const prizeMatch = tile.match(/class="prize-amount"[^>]*>\s*([^<]*?)\s*<\/span>/i);
        const dateMatch = tile.match(/class="submission-period"[^>]*>\s*([^<]*?)\s*<\/div>/i);
        
        if (titleMatch && urlMatch) {
          const title = titleMatch[1].trim();
          const hackathonUrl = urlMatch[1];
          const host = hostMatch ? hostMatch[1].trim() : "Devpost";
          const location = locMatch ? locMatch[1].trim() : "Online";
          const prizeAmount = prizeMatch ? prizeMatch[1].trim() : "";
          const dates = dateMatch ? dateMatch[1].trim() : "";
          
          listings.push({
            sourceUrl: hackathonUrl,
            title,
            organization: host,
            rawText: tile, 
            structured: {
              title,
              organization: host,
              location,
              apply_url: hackathonUrl,
              date_added: new Date().toISOString(),
              category: "hackathon",
              compensation: prizeAmount,
              summary: `Hackathon by ${host} · Prize: ${prizeAmount} · ${dates}`,
            },
            sourceSpecific: {
              source: "devpost",
              dates,
              prize: prizeAmount,
            },
          });
        }
      }
    } catch (e) {
      console.error(`Error fetching Devpost page ${page}`, e);
      break;
    }
  }

  return listings;
}
