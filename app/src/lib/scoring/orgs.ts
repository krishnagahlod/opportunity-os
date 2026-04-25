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
