import { supabaseAdmin } from "../supabase/admin";

export interface CompanyEnrichmentResult {
  name: string;
  domain: string;
  logo_url: string | null;
  description: string | null;
  industry: string | null;
  founded_year: number | null;
  employee_count: string | null;
  headquarters: string | null;
  website: string | null;
  linkedin_url: string | null;
  funding_stage: string | null;
  total_funding: string | null;
  trust_score: number;
  trust_signals: any;
}

/**
 * Extracts a domain from a company name by just removing non-alphanumeric chars
 * and appending .com, or uses Google/Clearbit autocomplete API if needed.
 * For now, a naive approach: companyName -> lowercased + .com
 */
function guessDomain(companyName: string): string {
  // If it's already a domain, return it
  if (companyName.includes(".")) {
    return companyName.toLowerCase().trim();
  }
  const clean = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${clean}.com`;
}

/**
 * Enriches a company using Brandfetch (if API key exists) and Wikidata,
 * computes the trust score, and caches it in Supabase.
 */
export async function enrichCompany(companyName: string, knownDomain?: string): Promise<CompanyEnrichmentResult | null> {
  const domain = knownDomain || guessDomain(companyName);
  
  // 1. Check if we already have it in DB
  const { data: existing } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("domain", domain)
    .single();
    
  if (existing) {
    return existing as CompanyEnrichmentResult;
  }
  
  // Initialize result
  const result: Partial<CompanyEnrichmentResult> = {
    name: companyName,
    domain: domain,
    logo_url: null,
    description: null,
    industry: null,
    founded_year: null,
    employee_count: null,
    headquarters: null,
    website: `https://${domain}`,
    linkedin_url: null,
    funding_stage: null,
    total_funding: null,
  };
  
  // 2. Fetch from Brandfetch (for logo & basic info)
  const brandfetchKey = process.env.BRANDFETCH_API_KEY;
  if (brandfetchKey) {
    try {
      const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: {
          Authorization: `Bearer ${brandfetchKey}`
        }
      });
      if (res.ok) {
        const bfData = await res.json();
        
        // Extract Logo
        const logos = bfData.logos || [];
        if (logos.length > 0) {
          const logoIcon = logos.find((l: any) => l.type === "icon") || logos[0];
          const formats = logoIcon.formats || [];
          const bestFormat = formats.find((f: any) => f.format === "png") || formats[0];
          if (bestFormat) {
            result.logo_url = bestFormat.src;
          }
        }
        
        result.description = bfData.description || null;
        result.industry = bfData.industry || null;
        
        // Extract LinkedIn
        const links = bfData.links || [];
        const linkedin = links.find((l: any) => l.name === "linkedin");
        if (linkedin) {
          result.linkedin_url = linkedin.url;
        }
      }
    } catch (e) {
      console.error(`Brandfetch error for ${domain}:`, e);
    }
  }

  // 3. Compute Trust Score
  let score = 0;
  const signals: any = {};
  
  if (result.website) { score += 15; signals.website = 15; }
  if (result.logo_url) { score += 10; signals.logo = 10; }
  if (result.linkedin_url) { score += 15; signals.linkedin = 15; }
  
  // Base trust score for having a known name/domain
  score += 10; signals.base = 10;
  
  result.trust_score = score;
  result.trust_signals = signals;
  
  // 4. Save to DB
  try {
    const { data: saved, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name: result.name,
        domain: result.domain,
        logo_url: result.logo_url,
        description: result.description,
        industry: result.industry,
        founded_year: result.founded_year,
        employee_count: result.employee_count,
        headquarters: result.headquarters,
        website: result.website,
        linkedin_url: result.linkedin_url,
        funding_stage: result.funding_stage,
        total_funding: result.total_funding,
        trust_score: result.trust_score,
        trust_signals: result.trust_signals,
        enriched_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error inserting company:", error);
      // Still return the in-memory result so the UI works
    } else {
      return saved as CompanyEnrichmentResult;
    }
  } catch (e) {
    console.error("Error saving company:", e);
  }
  
  return result as CompanyEnrichmentResult;
}
