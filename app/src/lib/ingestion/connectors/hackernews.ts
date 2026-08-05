import { type SourceListing } from "../types";

export interface HackerNewsConfig {
  maxItems?: number; 
}

/**
 * Fetches "Who is hiring?" posts from Hacker News.
 * We fetch the latest "Ask HN: Who is hiring?" thread,
 * and extract comments as job listings.
 */
export async function fetchHackerNews(config: HackerNewsConfig): Promise<SourceListing[]> {
  const { maxItems = 20 } = config;
  const listings: SourceListing[] = [];
  
  try {
    // 1. Find the latest "Who is hiring?" thread
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=Ask%20HN:%20Who%20is%20hiring?&tags=story&restrictSearchableAttributes=title`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      console.error(`HN Algolia fetch failed: ${searchRes.status}`);
      return listings;
    }
    
    const searchData = await searchRes.json();
    const latestThread = searchData.hits?.[0];
    
    if (!latestThread) {
      return listings;
    }

    const threadId = latestThread.objectID;
    
    // 2. Fetch the comments (job postings) from the thread using the HN Firebase API
    const threadUrl = `https://hn.algolia.com/api/v1/items/${threadId}`;
    const threadRes = await fetch(threadUrl);
    
    if (!threadRes.ok) {
      console.error(`HN Thread fetch failed: ${threadRes.status}`);
      return listings;
    }
    
    const threadData = await threadRes.json();
    const comments = threadData.children || [];
    
    // Process top-level comments (usually direct job posts)
    let count = 0;
    for (const comment of comments) {
      if (!comment.text) continue;
      
      // Basic heuristic: job posts usually have a URL and are fairly long
      if (comment.text.includes("href=") && comment.text.length > 200) {
        
        // Extract a rough title (usually the first line)
        const textParts = comment.text.split("<p>");
        let titleLine = textParts[0].replace(/<[^>]+>/g, "").trim();
        
        // Sometimes title is something like "Company | Role | Location | ..."
        const companyMatch = titleLine.split("|");
        const company = companyMatch[0]?.trim() || "Startup";
        const role = companyMatch[1]?.trim() || titleLine;
        
        const jobUrl = `https://news.ycombinator.com/item?id=${comment.objectID}`;

        const roleLower = role.toLowerCase();
        const titleLower = titleLine.toLowerCase();
        const combinedLower = `${roleLower} ${titleLower}`;
        
        const isInternship = 
          combinedLower.includes("intern") || 
          combinedLower.includes("trainee") ||
          combinedLower.includes("apprentice") ||
          combinedLower.includes("co-op") ||
          combinedLower.includes("working student");
          
        if (!isInternship) continue;

        const isFellowship = combinedLower.includes("fellow");
        const category = isFellowship ? "fellowship" : "internship";

        const plainText = comment.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

        listings.push({
          sourceUrl: jobUrl,
          title: role,
          organization: company,
          rawText: plainText,
          structured: {
            title: role,
            organization: company,
            location: "Flexible / Check post",
            apply_url: jobUrl,
            category, // Refined based on title
          },
          sourceSpecific: {
            source: "hackernews",
            thread_id: threadId,
          },
        });
        
        count++;
        if (count >= maxItems) break;
      }
    }
  } catch (e) {
    console.error("Error fetching Hacker News", e);
  }

  return listings;
}
