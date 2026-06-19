/**
 * Utility to wrap URLs in a ScraperAPI proxy if the SCRAPER_API_KEY is present.
 * This prevents our static Vercel IPs from being blocked by anti-bot measures (Cloudflare, etc.)
 * when scraping raw HTML from boards like LinkedIn or Internshala.
 */
export function buildProxiedUrl(targetUrl: string, renderJs = false): string {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) return targetUrl;
  
  const scraperUrl = new URL("http://api.scraperapi.com");
  scraperUrl.searchParams.set("api_key", apiKey);
  scraperUrl.searchParams.set("url", targetUrl);
  if (renderJs) {
    scraperUrl.searchParams.set("render", "true");
  }
  
  return scraperUrl.toString();
}
