import { SourceListing } from "../types";

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
  
  for (const company of config.companies) {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${company.slug}?includeCompensation=${config.includeCompensation}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch Ashby jobs for ${company.slug}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      if (!data.jobs || !Array.isArray(data.jobs)) {
        continue;
      }
      
      for (const job of data.jobs as AshbyPosting[]) {
        // Filter for early career roles (basic heuristic)
        const titleLower = job.title.toLowerCase();
        if (titleLower.includes("senior") || titleLower.includes("staff") || titleLower.includes("principal") || titleLower.includes("lead")) {
          continue; // Skip senior roles
        }
        
        let category: any = "fulltime";
        if (titleLower.includes("intern") || titleLower.includes("internship")) {
          category = "internship";
        }
        
        // Strip HTML for basic summary/text
        const rawText = job.descriptionHtml.replace(/<[^>]*>?/gm, '');
        
        listings.push({
          sourceUrl: job.jobUrl,
          title: job.title,
          organization: company.displayName,
          rawText,
          structured: {
            title: job.title,
            organization: company.displayName,
            location: job.locationName,
            category,
            is_remote: job.isRemote || job.locationName?.toLowerCase().includes("remote") || false,
            compensation: job.compensationTierSummary || null,
            description: job.descriptionHtml,
            apply_url: job.jobUrl,
            status: "active",
            extraction_confidence: 0.95, // High confidence as it's from structured API
            source_url: job.jobUrl,
          },
          sourceSpecific: {
            department: job.departmentName,
            employmentType: job.employmentType,
          }
        });
      }
    } catch (e) {
      console.error(`Error processing Ashby company ${company.slug}:`, e);
    }
  }
  
  return listings;
}
