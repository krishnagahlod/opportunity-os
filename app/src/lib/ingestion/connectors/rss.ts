import * as cheerio from "cheerio";
import { SourceListing } from "../types";
import { buildProxiedUrl } from "../proxy";

export interface RssConfig {
  url: string;
  sourceName: string;
  categoryHint?: string;
}

export async function fetchRss(config: RssConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  
  try {
    const proxiedUrl = buildProxiedUrl(config.url);
    const res = await fetch(proxiedUrl, {
      headers: {
        "User-Agent": "Opportunity-OS-Bot/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch RSS feed: ${res.status} ${res.statusText}`);
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // Handle both RSS <item> and Atom <entry>
    const items = $("item, entry");
    
    items.each((_, el) => {
      const title = $(el).find("title").first().text().trim() || "Unknown Title";
      
      // Link can be <link>http...</link> (RSS) or <link href="http..."/> (Atom)
      let link = $(el).find("link").first().text().trim();
      if (!link) {
        link = $(el).find("link").first().attr("href") || "";
      }
      
      const description = $(el).find("description, content, summary").first().text().trim();
      
      // We package the raw text with a clear hint so the AI extractor knows what it's looking at
      const rawText = [
        `SOURCE: ${config.sourceName}`,
        `TITLE: ${title}`,
        `LINK: ${link}`,
        `DESCRIPTION:`,
        description
      ].join("\n");

      listings.push({
        sourceUrl: link || config.url,
        title,
        organization: config.sourceName,
        rawText,
        sourceSpecific: {},
        // Since RSS feeds are generic, we don't know the exact structure
        // We leave the fields empty and let the AI extract them from rawText
        structured: {
          id: "",
          source_id: "", // Will be assigned during upsert
          title,
          organization: config.sourceName, // Fallback, AI should refine
          apply_url: link || config.url,
          category: (config.categoryHint as any) || undefined,
        }
      });
    });
    
  } catch (error) {
    console.error(`[rss] Error fetching ${config.sourceName}:`, error);
    throw error;
  }

  return listings;
}
