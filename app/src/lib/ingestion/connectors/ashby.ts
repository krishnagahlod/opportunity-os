import { type SourceListing } from "../types";

export type AshbyConfig = {
  companies: { slug: string; displayName: string }[];
  includeCompensation: boolean;
};

// Types for Ashby API response
type AshbyPosting = {
  id: string;
  title: string;
  locationName: string;
  departmentName: string;
  employmentType: string;
  jobUrl: string;
  descriptionHtml: string;
  compensationTierSummary?: string;
  isRemote?: boolean;
};

export async function fetchAshbyConnector(config: AshbyConfig): Promise<SourceListing[]> {
  const listings: SourceListing[] = [];
  
  const fetchPromises = config.companies.map(async (company) => {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=${config.includeCompensation}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch Ashby jobs for ${company.slug}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      if (!data.jobs || !Array.isArray(data.jobs)) {
        return [];
      }
      
      const companyListings: SourceListing[] = [];

      for (const job of data.jobs as AshbyPosting[]) {
        const titleLower = job.title.toLowerCase();
        
        const isTooSenior = 
          titleLower.includes("senior") || 
          titleLower.includes("staff") || 
          titleLower.includes("lead") ||
          titleLower.includes("manager") ||
          titleLower.includes("director") ||
          titleLower.includes("head") ||
          titleLower.includes("principal") ||
          titleLower.includes("architect") ||
          titleLower.includes("vp ") ||
          titleLower.includes("president");
          
        if (isTooSenior) continue;
        
        let category: any = "fulltime";
        if (titleLower.includes("intern") || titleLower.includes("internship")) {
          category = "internship";
        }
        
        const isStrictEarlyCareer = titleLower.includes("new grad") || titleLower.includes("junior") || titleLower.includes("entry level") || titleLower.includes("entry-level") || titleLower.includes("associate");
        
        if (category === "fulltime" && !isStrictEarlyCareer) {
            continue; // Skip generic full-time roles
        }
        
        // Strip HTML for basic summary/text
        const rawText = job.descriptionHtml.replace(/<[^>]*>?/gm, '');
        
        companyListings.push({
          sourceUrl: job.jobUrl,
          title: job.title,
          organization: company.displayName,
          rawText,
          structured: {
            title: job.title,
            organization: company.displayName,
            location: job.locationName,
            apply_url: job.jobUrl,
            description: rawText.substring(0, 500) + '...',
            category,
          },
          sourceSpecific: {
            source: 'ashby',
            ashby_id: job.id,
            department: job.departmentName,
            employment_type: job.employmentType,
            compensation_tier: job.compensationTierSummary,
            is_remote: job.isRemote
          }
        });
      }
      return companyListings;
    } catch (e) {
      console.error(`Error fetching Ashby for ${company.slug}`, e);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      listings.push(...result.value);
    }
  }

  return listings;
}
