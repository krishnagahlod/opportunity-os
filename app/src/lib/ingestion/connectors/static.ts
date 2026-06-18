import * as cheerio from "cheerio";
import { SourceListing } from "../types";

export interface StaticPageConfig {
  url: string;
  sourceName: string;
  categoryHint?: "fellowship" | "scholarship" | "internship" | "fulltime";
}

export interface StaticGroupConfig {
  pages: StaticPageConfig[];
}

/**
 * Fetches bespoke static HTML landing pages (like Fellowship websites),
 * extracts their visible text by stripping out navigation, footers, and scripts,
 * and packages it for the AI extraction pipeline.
 */
export async function fetchStaticPages(config: StaticGroupConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];

  const fetchPromises = config.pages.map(async (page) => {
    try {
      const res = await fetch(page.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Opportunity-OS-Bot/1.0",
          "Accept": "text/html,application/xhtml+xml",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        console.warn(`[static] Failed to fetch ${page.sourceName}: ${res.status}`);
        return null;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // Remove noisy elements that confuse the AI
      $("script, style, nav, footer, header, noscript, iframe, .nav, .footer, .menu").remove();

      // Extract the remaining text
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();

      const rawText = [
        `SOURCE: ${page.sourceName}`,
        `URL: ${page.url}`,
        `HINT CATEGORY: ${page.categoryHint || "fellowship"}`,
        `PAGE CONTENT:`,
        bodyText.slice(0, 4000) // Keep it within context limits, early text has the best signal
      ].join("\n");

      return {
        sourceUrl: page.url,
        title: `${page.sourceName} Application`,
        organization: page.sourceName,
        rawText,
        sourceSpecific: {},
        structured: {
          id: "",
          source_id: "",
          title: `${page.sourceName} Application`,
          organization: page.sourceName,
          apply_url: page.url,
          category: page.categoryHint || "fellowship",
        }
      } as SourceListing;
    } catch (error) {
      console.error(`[static] Error fetching ${page.sourceName}:`, error);
      return null;
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      listings.push(res.value);
    }
  }

  return listings;
}
