import { type SourceListing } from "../types";

export type WorkdayCompany = {
  /** The human-readable name of the company */
  displayName: string;
  /** The full Workday JSON API endpoint for fetching jobs.
   *  e.g., "https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs"
   */
  apiUrl: string;
  /** The base URL for the job posting so we can construct the apply link. 
   * e.g., "https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job"
  */
  jobBaseUrl: string;
};

export type WorkdayConfig = {
  companies: WorkdayCompany[];
  /** Search terms to restrict the query. Workday returns thousands of results otherwise. */
  searchTerms: string[];
};

type WorkdayJob = {
  title: string;
  externalPath: string; // e.g. "/Santa-Clara/Software-Engineer_JR12345"
  locationsText: string;
  postedOn: string;
  jobReqId: string;
};

export async function fetchWorkday(config: WorkdayConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];

  const fetchPromises = config.companies.map(async (company) => {
    const companyListings: SourceListing[] = [];
    
    // We fetch for each search term individually
    for (const term of config.searchTerms) {
      try {
        let offset = 0;
        const limit = 20;
        let hasMore = true;
        let pagesFetched = 0;
        const maxPages = 3; // Prevent infinite loops, 60 jobs per term is enough

        while (hasMore && pagesFetched < maxPages) {
          const payload = {
            appliedFacets: {},
            limit,
            offset,
            searchText: term
          };

          const response = await fetch(company.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            console.error(`Failed to fetch Workday jobs for ${company.displayName}: ${response.status}`);
            break;
          }

          const data = await response.json();
          
          if (!data.jobPostings || !Array.isArray(data.jobPostings) || data.jobPostings.length === 0) {
            hasMore = false;
            break;
          }

          for (const job of data.jobPostings as WorkdayJob[]) {
            const titleLower = job.title.toLowerCase();
            
            // Fast fail for obviously senior roles even if they match the search term
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
            
            // Fast fail for obviously non-technical/non-relevant roles (can adjust later)
            const isIrrelevant = 
              titleLower.includes("barista") ||
              titleLower.includes("warehouse") ||
              titleLower.includes("cashier") ||
              titleLower.includes("driver");
              
            if (isIrrelevant) continue;

            let category: any = "fulltime";
            if (titleLower.includes("intern") || titleLower.includes("internship") || titleLower.includes("co-op")) {
              category = "internship";
            }
            
            const isStrictEarlyCareer = 
              titleLower.includes("new grad") || 
              titleLower.includes("graduate") ||
              titleLower.includes("university") ||
              titleLower.includes("entry level") || 
              titleLower.includes("entry-level") || 
              titleLower.includes("associate");
              
            if (category === "fulltime" && !isStrictEarlyCareer) {
              continue;
            }

            const applyUrl = `${company.jobBaseUrl}${job.externalPath}`;
            
            // Basic deduplication check since we loop over multiple search terms
            const exists = companyListings.some(l => l.sourceUrl === applyUrl);
            if (!exists) {
              companyListings.push({
                sourceUrl: applyUrl,
                title: job.title,
                organization: company.displayName,
                sourceSpecific: {},
                structured: {
                  title: job.title,
                  organization: company.displayName,
                  category,
                  location: job.locationsText || "Unknown",
                  is_remote: job.locationsText?.toLowerCase().includes("remote") || false,
                  apply_url: applyUrl,
                  description: "", // Workday list API doesn't return full desc
                  tags: []
                },
                rawText: JSON.stringify(job)
              });
            }
          }

          offset += limit;
          pagesFetched++;
        }
      } catch (error) {
        console.error(`Error fetching Workday for ${company.displayName}:`, error);
      }
    }
    
    return companyListings;
  });

  const results = await Promise.all(fetchPromises);
  for (const companyJobs of results) {
    listings.push(...companyJobs);
  }

  return listings;
}
