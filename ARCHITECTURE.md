# Opportunity OS — Technical Architecture & Design Document

This document provides a comprehensive overview of the technical architecture, design decisions, tradeoffs, and system details for **Opportunity OS**. It serves as the master reference for anyone looking to understand how the system is built, why certain choices were made, and how the different components interact.

---

## 1. Executive Summary

**Opportunity OS** is a personalized discovery engine designed for ambitious Indian students and early-career professionals. It aggregates career opportunities (internships, hackathons, fellowships, and startup roles) from scattered sources, parses them using AI, ranks them by fit and quality, and surfaces the most relevant ones via a clean dashboard and daily digests (Email/Telegram).

The product is shifting from a simple aggregator to an **Opportunity Intelligence System**. The primary goal is not raw volume, but **high-signal curation**. The North Star metric is *Qualified Actions Per Weekly Active User* (saves, applications, feedback).

## 2. Tech Stack Overview

The stack was chosen for rapid iteration, low cost, and strong developer experience while remaining scalable for a multi-user SaaS.

*   **Frontend & API**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
*   **Backend & Database**: Supabase (PostgreSQL, Auth, Row-Level Security).
*   **Automation & Ingestion**: n8n (currently local Docker, transitioning to cloud VM).
*   **AI Engine**: Google Gemini 2.0 Flash (Primary) with Groq Llama 3.3 70B (Fallback/Fast tasks).
*   **Email & Notifications**: Resend + React Email, Telegram Bot API.
*   **Hosting**: Vercel (Hobby Tier for Web/API), Supabase Managed.

---

## 3. System Architecture & Data Flow

The system consists of three main operational phases: **Ingestion**, **Enrichment & Scoring**, and **Delivery**.

### 3.1 The Ingestion Pipeline (n8n → Next.js API → Supabase)
Ingestion is orchestrated by **n8n** workflows (`n8n-workflows/`). It separates sources into two distinct patterns:

*   **Structured Sources (Direct Upsert Pattern)**:
    *   *Sources*: Unstop, Devpost, Greenhouse ATS, Ashby, Lever.
    *   *Flow*: n8n fetches raw JSON from public APIs → maps fields directly in a Code node → POSTs to `/api/ingest/upsert`.
    *   *Tradeoff*: Extremely fast, 0 AI token cost, 100% extraction confidence. Requires manual mapping per source but yields the highest quality data.

*   **Unstructured Sources (AI Extract Pattern)**:
    *   *Sources*: HTML career pages, RSS feeds, unstructured job boards.
    *   *Flow*: n8n fetches raw HTML/text → POSTs to `/api/ai/extract` → The Next.js API uses Gemini/Groq to parse messy text into structured JSON → POSTs to `/api/ingest/upsert`.
    *   *Tradeoff*: Slower and incurs LLM token costs. However, it allows capturing opportunities from places without clean APIs.

### 3.2 Security
All automated ingestion endpoints (`/api/ingest/*`, `/api/ai/*`) are protected by a shared secret (`INGEST_SHARED_SECRET`) passed via the `X-Ingest-Secret` header.

---

## 4. AI Layer (Extraction & Enrichment)

Opportunity OS employs a **dual-pass AI architecture** to ensure accuracy and usefulness.

### Pass 1: Extraction (Fact-Gathering)
Used during ingestion for unstructured sources. The LLM is instructed to be strictly objective and extract factual data (title, organization, deadline, compensation, eligibility).
*   **Strict JSON Schema**: Powered by Zod validation.
*   **Hallucination Prevention**: Prompt engineering enforces returning `null` rather than guessing missing facts. 

### Pass 2: Enrichment (Value Interpretation)
A secondary asynchronous pass (`/api/ai/enrich`) evaluates the raw data to determine *usefulness* for the user.
*   *Outputs*: Plain language summary, effort score, upside score, required vs nice-to-have skills, eligibility tags, and "red flags" (e.g., unpaid, high effort, questionable org).
*   *Tradeoff*: Running enrichment asynchronously prevents ingestion bottlenecks and allows the system to continuously update older rows if enrichment logic improves.

### LLM Failover Architecture
The primary LLM is **Gemini 2.0 Flash** (generous free tier, large context window). If Gemini fails (rate limits, parsing errors), the system falls back to **Groq (Llama 3.3 70B)** for ultra-fast, robust extraction.

---

## 5. Scoring & Ranking Engine

The core value of the OS is sorting the noise. The scoring model has evolved from a generic deterministic score to a composite, outcome-aware ranking system.

**The Composite Formula**:
```
final_score = (
    0.30 * Fit Score (User interests, skills, graduation year match)
  + 0.25 * Value Score (Org tier, compensation, brand prestige)
  + 0.15 * Actionability Score (Apply URL present, clear eligibility, low effort)
  + 0.10 * Timing Score (Deadline proximity, freshness)
  + 0.10 * Behavioral Score (User's past saves/applies/dismissals)
  + 0.10 * Source Quality Score (Historical conversion rate of the source)
) * Confidence Multiplier
```

**Hard Penalties**:
*   *Ineligible / Senior roles*: Score capped low to prevent them from dominating the feed.
*   *Expired / Broken Links / Spam*: Hidden entirely.
*   *Low Extraction Confidence (<0.5)*: Hidden from users; routed to the Admin panel for manual review.

---

## 6. Source Quality & Analytics System

To maintain high signal-to-noise ratio, the system implements a dynamic **Source Quality Engine**.

*   **Source Registry (`source_connectors`)**: Moves away from hardcoded n8n knowledge. The DB tracks every source, its fetch frequency, and its target persona.
*   **Daily Analytics (`source_quality_daily`)**: Tracks how many opportunities a source generated vs. how many resulted in user saves/applies.
*   **Circuit Breakers**: Noisy sources (high volume, 0 saves) or sources throwing consecutive HTTP errors are automatically flagged in the Admin Dashboard and can be auto-disabled.
*   **User Feedback Loops (`opportunity_feedback`)**: Users can click "Not Interested" or "Hide". This feeds back into the Behavioral Score and immediately removes the item from their feed and search results.

---

## 7. Database & Auth (Supabase)

*   **Auth**: Passwordless Magic Links and Google OAuth via Supabase Auth.
*   **Row-Level Security (RLS)**: Enforced aggressively. Users can only see their own `saved_opportunities`, `applications`, and `profiles`. The `opportunities` table is readable by authenticated users.
*   **Schema Migrations**: Database changes are strictly managed via SQL scripts in `supabase/migrations/` to ensure environments (local dev vs production) remain in sync.

---

## 8. Notifications & Delivery

*   **Vercel Crons**: Trigger endpoints (e.g., `/api/cron/daily-digest`) on a schedule.
*   **Daily Digest**: Consolidates the top 5 personalized opportunities and urgent deadlines (next 3 days) into a single communication.
*   **Multi-Channel Delivery**:
    *   *Email*: Crafted using React Email and sent via Resend.
    *   *Telegram*: Sent via the Telegram Bot API using MarkdownV2 parsing.
*   *Tradeoff*: Vercel Hobby limits cron jobs (runs once a day max). This is perfectly sufficient for a "Daily Digest". Real-time alerts are reserved for premium tiers and would require an external trigger (like n8n scheduling or Upstash QStash).

---

## 9. Key Design Decisions & Tradeoffs

### Why Next.js App Router?
Allows seamless mixing of Server Components (fast DB reads without exposing keys) and Client Components (interactive feed, saving/applying). Built-in API routes (`/api/*`) handle webhooks and crons easily without standing up a separate Express server.

### Why n8n instead of custom scraping scripts?
n8n provides a visual interface for handling API pagination, error retries, and rapid webhook integration. 
*Tradeoff*: Running n8n in local Docker means ingestion only runs when the developer's laptop is awake. 
*Resolution*: The roadmap involves migrating n8n to an Oracle Cloud Always-Free VM or equivalent for 24/7 ingestion.

### Why deterministic AI extraction over pure RAG?
Opportunity discovery is highly structured (deadlines, links, locations). Vector search (RAG) is fuzzy and bad at filtering by strict dates or exact boolean matches (e.g., `is_remote = true`). By using AI strictly to populate structured PostgreSQL columns, we leverage standard SQL querying for blazing-fast, accurate filtering while getting the benefits of LLM comprehension.

### Why deprecate generic job boards (Reddit, WeWorkRemotely, HN)?
Initial testing proved these sources produced too much noise and low engagement for the target demographic (Indian students/early professionals). Quality over quantity. The focus shifted entirely to Tier 1 structured sources (Unstop, Devpost, ATS systems) and high-value niche verticals (Fellowships).

---

## 10. Future Roadmap

1.  **Multi-User Scale**: Migrate n8n to 24/7 cloud hosting, implement API rate limiting (Upstash Redis), and fully enable Google OAuth.
2.  **Monetization / Premium Tier**: Add instant SMS/WhatsApp alerts, deep resume-to-opportunity match analysis (identifying missing skills for specific roles), and priority source coverage.
3.  **Application Tracker Insights**: Use outcome tracking (tracking actual interviews and wins in the `applications` table) to mathematically prove the platform's ROI to users. 
4.  **Automated Cold Outreach**: Generate personalized cold emails/LinkedIn DMs for opportunities directly from the dashboard using the user's resume data.
