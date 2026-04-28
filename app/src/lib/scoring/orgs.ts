/**
 * Hand-curated organization tier lookup.
 * Used by scoring math to assign career/brand value.
 *
 * Tier ranges 0..1:
 *   1.00 = top global brand (FAANG, MBB, top investment banks)
 *   0.85 = top India / top startup (Razorpay, Zerodha, Stripe, Atlassian, IIT/IIM)
 *   0.70 = well-known startup or established mid-size company
 *   0.50 = default for unknown organizations
 *
 * Match is case-insensitive and substring-friendly (so "Boston Consulting Group"
 * matches "BCG" via the explicit BCG entry, and vice versa via aliases).
 *
 * Expand this table over time — every new addition makes scoring smarter
 * for everyone.
 */

type Tier = number;

const TIER_1: string[] = [
  // Big tech
  "google",
  "microsoft",
  "apple",
  "amazon",
  "meta",
  "facebook",
  "netflix",
  "nvidia",
  "openai",
  "anthropic",
  "deepmind",
  // MBB consulting
  "mckinsey",
  "boston consulting group",
  "bcg",
  "bain",
  // Top investment banks
  "goldman sachs",
  "morgan stanley",
  "j.p. morgan",
  "jpmorgan",
  "blackrock",
  "blackstone",
  // Top product
  "stripe",
  "openai",
  "linear",
  "vercel",
];

const TIER_1_5: string[] = [
  // Top Indian fintech
  "razorpay",
  "zerodha",
  "groww",
  "cred",
  "phonepe",
  "paytm",
  // Top Indian consumer
  "swiggy",
  "zomato",
  "flipkart",
  "myntra",
  // Top global tech (T2 of "best to work at")
  "atlassian",
  "shopify",
  "twilio",
  "datadog",
  "cloudflare",
  "github",
  "gitlab",
  "hashicorp",
  "snowflake",
  "databricks",
  // Top consulting / strategy
  "kearney",
  "ey-parthenon",
  "deloitte",
  "pwc",
  "kpmg",
  // Top fellowships / unicorns
  "ashoka university",
  "young india fellowship",
];

const TIER_2: string[] = [
  // Well-known startups / unicorns
  "infosys",
  "tcs",
  "wipro",
  "accenture",
  "capgemini",
  "y combinator",
  "ycombinator",
  // Indian unicorns
  "ola",
  "byjus",
  "udaan",
  "freshworks",
  "polygon",
  "razorpay",
  // Other
  "teach for india",
];

/**
 * Returns a 0..1 tier value for an organization name.
 * Falls back to 0.5 (default unknown) if no match.
 */
export function getOrgTier(organization: string | null | undefined): Tier {
  if (!organization) return 0.5;
  const norm = organization.trim().toLowerCase();
  if (norm.length === 0) return 0.5;

  if (TIER_1.some((n) => norm.includes(n) || n.includes(norm))) return 1.0;
  if (TIER_1_5.some((n) => norm.includes(n) || n.includes(norm))) return 0.85;
  if (TIER_2.some((n) => norm.includes(n) || n.includes(norm))) return 0.7;

  // Heuristic boost: if "(YC X22)" or similar appears, it's at least Tier 2
  if (/\byc\s*[wfsp]?\d{2}\b|y combinator/i.test(organization)) return 0.7;

  return 0.5;
}

/**
 * Per-category baseline used when the org tier is unknown. Combats the flat
 * 0.5 noise floor that ~80% of opportunities fell to before. Selective
 * categories (fellowship, case_competition) carry inherent career value
 * even from an unknown sponsor.
 */
const CATEGORY_BASELINE: Record<string, number> = {
  fellowship: 0.7,
  scholarship: 0.65,
  case_competition: 0.65,
  internship: 0.55,
  fulltime: 0.55,
  hackathon: 0.55,
  conference: 0.45,
  workshop: 0.4,
  bootcamp: 0.4,
  networking: 0.45,
  campus_ambassador: 0.45,
  remote_gig: 0.5,
  other: 0.45,
};

/**
 * Career-value tier for an opportunity — combines the org tier (high signal
 * when known) with a category-based baseline (catches unknown orgs in
 * inherently selective tracks like fellowships). Returns the higher of the
 * two so a known top-tier org always wins.
 */
export function getCareerValueTier(
  organization: string | null | undefined,
  category: string | null | undefined,
): Tier {
  const orgTier = getOrgTier(organization);
  const catBaseline = category ? (CATEGORY_BASELINE[category] ?? 0.5) : 0.5;
  return Math.max(orgTier, catBaseline);
}
