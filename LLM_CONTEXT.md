# Opportunity OS — LLM Context & Architecture Guide

Welcome, AI Assistant! This file contains everything you need to know about the **Opportunity OS** project. Read this before suggesting architectural changes, modifying the database, or writing new features.

## 1. Product Vision & Positioning
Opportunity OS is a personalized opportunity radar for ambitious Indian students and early-career professionals. It finds high-quality internships, competitions, fellowships, hackathons, and early-career roles before deadlines pass, ranks them by fit, and explains what to do next.

**Core User Promise**:
- "Never miss a high-value opportunity."
- "See exactly why it fits you and if it's worth the effort."
- "Get daily digests/alerts for things actually worth applying to."

**Key North Star Metric**: 
- *Qualified Actions Per Weekly Active User* (saves, applies, calendar subscriptions, reminders set). We prioritize high-signal curation over raw volume.

## 2. Tech Stack & Environment
- **Frontend & API**: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui.
- **Backend**: Supabase (Postgres, Auth, Storage, Row-Level Security).
- **Automation / Ingestion**: n8n (currently running in local Docker, migrating to 24/7 cloud VM).
- **AI Engine**: Gemini 2.0 Flash (primary) with Groq Llama 3.3 70B (fallback).
- **Email & Notifications**: Resend + React Email, Telegram Bot API.
- **Hosting**: Vercel (Hobby tier). Supabase (Managed).

*Note: As per `app/AGENTS.md`, this uses the very latest Next.js features. Be aware of breaking changes from earlier versions.*

## 3. System Architecture

### The Ingestion Pipeline (n8n -> API -> Supabase)
Data ingestion is handled by n8n workflows located in the `n8n-workflows/` directory.

1. **Structured Sources (e.g., Unstop, Devpost)**:
   - Uses the **Direct Upsert Pattern**.
   - n8n fetches JSON APIs -> Maps fields in a Code node -> POSTs directly to `/api/ingest/upsert`.
   - *Advantage*: Zero AI tokens, high fidelity (`extraction_confidence` ~0.95).

2. **Unstructured Sources (e.g., RSS, HTML, Lever ATS)**:
   - Uses the **AI Extract Pattern**.
   - n8n fetches raw data -> POSTs to `/api/ai/extract` (uses Gemini/Groq to parse into structured JSON) -> POSTs to `/api/ingest/upsert`.

*Security*: All ingestion routes require the `INGEST_SHARED_SECRET` passed via the `X-Ingest-Secret` header.

### Current Active Sources
As of Phase 9.2, noisy sources (Reddit, WeWorkRemotely, HN Jobs) have been disabled. Active sources include:
- Greenhouse ATS (Anthropic, Vercel, Airbnb, Stripe, etc. — focus on dev-tooling).
- Devpost Hackathons.
- Unstop Hackathons, Competitions, Internships (highest engagement).
- Lever ATS (CRED, Meesho).

## 4. Planned Roadmap & Architectural Improvements
The project is pivoting from a basic aggregator to an "Opportunity Intelligence System". When working on new features, align with these upcoming pillars (detailed in `Improvements` file):

### Pillar 1: Source Quality Engine
- **Goal**: Move away from hardcoded n8n workflows towards a dynamic `source_connectors` table and `source_quality_daily` tracking.
- **New Sources**: Ashby ATS, Fellowships/Scholarships (Teach For India, Ashoka, etc.).
- **Auto-Disabling**: Automatically disable sources that yield low-confidence extractions or expired links.

### Pillar 2: Opportunity Enrichment Layer
- **Current state**: Opportunities just have factual fields (title, deadline, org, basic description).
- **Future state**: Add a second asynchronous AI pass (`/api/ai/enrich/route.ts`) to determine *usefulness*.
- **New Schema Needs**: 
  - `role_seniority`, `eligibility_tags`, `effort_score`, `upside_score`, `red_flags`, `action_plan`.
  - Do not let AI invent facts here. Store inferred data strictly in these enrichment fields.

### Pillar 3: Scoring Logic & Feedback Loops
- **Current state**: Monolithic deterministic relevance score.
- **Future state**: Composite score combining:
  `final_score = (0.3*fit + 0.25*value + 0.15*actionability + 0.10*timing + 0.10*behavioral + 0.10*source_quality) * confidence_multiplier`
- **Feedback Loops**: Users will have "Hide" or "Not for me" buttons (tracked in `opportunity_feedback`).
- **Outcome Tracking**: Track actual application success (interviews, wins) in the `applications` table to feed the `source_quality_daily` table.

## 5. Deployment Setup
- The `app/` folder is deployed on Vercel. 
- Vercel Cron jobs (`vercel.json`) handle triggers like `/api/cron/daily-digest` which sends Resend emails and Telegram messages.
- Magic link Auth relies on `NEXT_PUBLIC_APP_URL` and Supabase redirect URLs being correctly configured in the production environment.
- Supabase migrations live in `supabase/migrations/` (e.g. `0001_init.sql`, `0002_fix_rls_recursion.sql`, etc.). Any database schema modifications must be done via new SQL migration scripts.

## 6. Development Rules for AI Agents
1. **API Keys**: Stored in `app/.env.local`. Do not leak them.
2. **Database Changes**: Always write Supabase SQL migrations in `supabase/migrations/` rather than manually executing DDL. Remember to update the `app/src/types/db.ts` or equivalent types.
3. **Next.js conventions**: Use App router conventions (`page.tsx`, `layout.tsx`, `route.ts`).
4. **Avoid Hallucinations in Ingestion**: When touching the extraction logic, ensure AI is prompted to return factual representations of the data, using standard confidence thresholds.

Refer to `Idea.md` for original product intent and `Improvements` for the deeply researched strategic roadmap.
