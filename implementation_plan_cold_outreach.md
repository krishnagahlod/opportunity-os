# Feature Expansion: Cold Outreach System + Company Intelligence

Two major features designed to transform our platform from an "opportunity finder" into a complete **career launch pad**.

---

## Phase 1: Company Intelligence Layer

Before we build cold outreach, we need a **company-level data layer**. Right now, `organization` is just a plain string on the `opportunities` table. We need to create a proper `companies` table that caches enriched company data, and then surface it across the UI.

### 1A. Database: New `companies` Table

Create a new Supabase table to store enriched company information:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | text | Canonical company name |
| `domain` | text | e.g. `stripe.com` (used as lookup key) |
| `logo_url` | text | Company logo (from Brandfetch free tier — 500k req/mo) |
| `description` | text | One-line summary |
| `industry` | text | e.g. "Fintech", "AI/ML", "SaaS" |
| `founded_year` | int | Year of incorporation |
| `employee_count` | text | Range like "50-200", "1000+" |
| `headquarters` | text | HQ city/country |
| `website` | text | Official website URL |
| `linkedin_url` | text | LinkedIn company page |
| `funding_stage` | text | "Seed", "Series A", "Series B", "Public", etc. |
| `total_funding` | text | e.g. "$50M", "$1.2B" |
| `trust_score` | int | 0-100 composite score (see below) |
| `trust_signals` | jsonb | Breakdown of how trust_score was calculated |
| `enriched_at` | timestamp | When data was last refreshed |

**Trust Score** — A composite 0-100 score computed from:
- Has a real website? (+15)
- Has a LinkedIn page? (+15)
- Employee count > 10? (+15)
- Founded > 2 years ago? (+10)
- Has known funding? (+15)
- Domain matches organization name? (+10)
- Has logo available? (+10)
- Listed on known platforms (Wellfound, Greenhouse, etc.)? (+10)

> [!NOTE]
> This score is NOT a Glassdoor review rating — it's a **legitimacy/trustworthiness signal**. It tells users "this company is real and established" vs. "this might be a fly-by-night operation." This is very valuable for students who can't easily distinguish between them.

### 1B. Data Sources (All Free)

Since we need purely free solutions:

| Source | What it gives us | Free Tier |
|--------|-----------------|-----------|
| **Brandfetch API** | Logo, brand colors, domain info | 500,000 requests/month |
| **Wikidata SPARQL** | Founded year, HQ, industry, employee count | Unlimited (CC0) |
| **SEC EDGAR API** | Funding data (Form D filings for US startups) | Unlimited (10 req/sec) |
| **TechCrunch RSS** | Recent funding news for signal detection | Free RSS |
| **Our own ingestion data** | Source platform (Greenhouse = legit, etc.) | Already have this |

**Enrichment flow:** When an opportunity is ingested with a new `organization` name, we:
1. Normalize the name → extract domain (e.g., "Stripe" → `stripe.com`)
2. Check if `companies` table already has this domain
3. If not, call Brandfetch for logo + domain data
4. Call Wikidata SPARQL for structured facts
5. Compute `trust_score` from available signals
6. Cache everything in the `companies` table

### 1C. UI Changes

#### On `OpportunityCard` (Feed View)
- Replace the current text-initial avatar with the **actual company logo** (from Brandfetch)
- Add a small **Trust Badge**: e.g., `✓ Verified · 500+ employees` or `⚠ New Company`

#### In `OpportunityDrawer` (Detail View)
- New **"About this Company"** section below the existing Quick Facts strip:
  - Company logo + name + industry
  - Founded year · HQ location · Employee count
  - Funding stage + total raised
  - Trust Score meter (similar visual style to the existing legitimacy_score bar)
  - Direct links: Website ↗ · LinkedIn ↗

---

## Phase 2: Cold Outreach System

This is the bigger feature. The idea is to create a dedicated section that helps users systematically reach out to decision-makers at companies they're interested in.

### 2A. Lead Discovery Engine

**Where do leads come from?**

| Lead Type | Source | How |
|-----------|--------|-----|
| **Startup Founders** | SEC EDGAR Form D + TechCrunch RSS | Parse recent funding filings for company names + officer names |
| **Hiring Managers** | Our own opportunity data | If we have a Greenhouse/Lever/Ashby listing, the company is actively hiring |
| **HR/Talent Leads** | AI-generated suggestions | Given a company name, the AI suggests likely titles to search for |

**Lead data model** — New `outreach_leads` table:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `company_id` | UUID | FK to `companies` |
| `name` | text | Person's full name |
| `title` | text | e.g. "Co-Founder & CEO", "Head of Talent" |
| `lead_type` | text | "founder", "hiring_manager", "hr_director" |
| `source` | text | Where we found them (SEC filing, LinkedIn, etc.) |
| `linkedin_url` | text | Their LinkedIn profile URL (if available) |
| `email_pattern` | text | Guessed email format like `first@company.com` |
| `relevance_score` | int | How relevant this lead is for cold outreach |

> [!IMPORTANT]
> **We will NOT be scraping personal emails or doing anything that violates privacy.** The system will:
> 1. Show publicly available names + titles (from SEC filings, company websites)
> 2. Suggest the *email pattern* for the company domain (e.g., `firstname@stripe.com`) — the user fills in the actual address
> 3. Guide users on how to find the right contact on LinkedIn themselves

### 2B. Cold Outreach Dashboard (New Page: `/outreach`)

A dedicated new page with these sections:

#### Section 1: "Hot Leads This Week"
- Auto-populated from our ingestion pipeline
- Shows recently funded startups (from TechCrunch RSS / SEC EDGAR)
- Each card shows: Company name, Funding round, Founder names, "Why reach out" AI summary
- One-click "Draft Email" button

#### Section 2: "Outreach for Your Saved Opportunities"
- For every opportunity the user has saved/bookmarked, we show:
  - The company's key people (from `outreach_leads`)
  - "Who to contact" recommendation (e.g., "For startups, email the founder directly. For large companies, find the hiring manager on LinkedIn.")
  - One-click "Generate Cold Email" — uses the user's resume + the opportunity details to generate a hyper-personalized cold email

#### Section 3: "My Outreach Tracker"
New `outreach_log` table:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to profiles |
| `lead_id` | UUID | FK to outreach_leads |
| `opportunity_id` | UUID | FK to opportunities (optional) |
| `status` | text | "drafted", "sent", "replied", "no_reply" |
| `email_draft` | text | The generated email content |
| `sent_at` | timestamp | When user marked as sent |
| `follow_up_at` | timestamp | Suggested follow-up date |

Users can track which emails they've sent, mark replies, and get AI-generated follow-up reminders.

### 2C. AI Email Generation

We already have `buildActionPlanPrompt` which generates a basic cold outreach draft. We'll create a dedicated, much more sophisticated prompt:

**Inputs:**
- User's resume text + skills + college + graduation year
- Target company info (from `companies` table)
- Target role info (from `opportunities` table, if applicable)
- Target person info (name, title)
- Outreach type: "cold email", "LinkedIn DM", "follow-up"

**Outputs:**
- Subject line
- Email body (3-4 paragraphs, highly personalized)
- LinkedIn DM version (shorter, more casual)
- Follow-up email (for 1 week later)

---

## Phased Rollout

### Phase 1A (Week 1): Company Database + Enrichment Pipeline
- Create `companies` table migration
- Build Brandfetch + Wikidata enrichment service
- Build trust_score computation logic
- Hook into ingestion pipeline (auto-enrich new companies)

### Phase 1B (Week 2): Company Intelligence UI
- Update `OpportunityCard` with real logos + trust badges
- Build "About this Company" section in `OpportunityDrawer`
- Backfill existing opportunities with company data

### Phase 2A (Week 3): Lead Discovery + Outreach Page
- Create `outreach_leads` and `outreach_log` tables
- Build SEC EDGAR + TechCrunch RSS lead ingestion
- Build the `/outreach` page with "Hot Leads" section

### Phase 2B (Week 4): AI Email Generation + Tracker
- Build dedicated cold email generation prompt + API route
- Build "Outreach for Saved Opportunities" section
- Build the outreach tracker with follow-up reminders

---

## Open Questions

> [!IMPORTANT]
> **Lead privacy approach:** The plan above only uses publicly available data (SEC filings, company websites). We will suggest email patterns but NOT scrape actual personal email addresses. Are you comfortable with this approach, or do you want to explore integrating Hunter.io (50 free lookups/month) for verified emails?

> [!IMPORTANT]
> **Outreach page scope:** Should the `/outreach` page be accessible to all users, or should it be a premium/gated feature behind the pricing page you already have?

> [!WARNING]
> **Brandfetch API key:** Brandfetch offers 500k free requests/month but requires a free API key signup. We'll need you to register at brandfetch.com/developers and add the key to `.env.local`. Is that okay?
