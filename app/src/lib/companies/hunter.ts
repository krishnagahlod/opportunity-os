export interface HunterLead {
  first_name: string | null;
  last_name: string | null;
  email: string;
  position: string | null;
  department: string | null;
  seniority: string | null;
  confidence: number;
  type: string; // 'personal' or 'generic'
}

/**
 * Fetch verified email leads for a given domain using Hunter.io
 */
export async function fetchHunterLeads(domain: string): Promise<HunterLead[]> {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) {
    console.log("HUNTER_API_KEY not found, skipping email verification.");
    return [];
  }

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}&limit=5&type=personal&seniority=executive,management`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Hunter API Error:", await response.text());
      return [];
    }

    const data = await response.json();
    return data.data?.emails?.map((e: any) => ({
      first_name: e.first_name,
      last_name: e.last_name,
      email: e.value,
      position: e.position,
      department: e.department,
      seniority: e.seniority,
      confidence: e.confidence,
      type: e.type,
    })) || [];
  } catch (err) {
    console.error("Failed to fetch leads from Hunter:", err);
    return [];
  }
}
