# n8n Workflows

This folder contains version-controlled exports of the ingestion workflows that
populate the `opportunities` table.

Current status: **Phase 2.5 complete** — full pipeline with pre-AI dedup,
keyword filter, and observability via `ingestion_logs`. Workflows are built
by hand in the n8n UI and exported here once working.

## Pipeline architecture (post Phase 2.5)

```
Schedule Trigger (every 6h)
    ↓
RSS Read   ← any RSS feed (HN Jobs, WeWorkRemotely, Substack, …)
    ↓
Limit (e.g. 20)
    ↓
Loop Over Items
    │  loop output (one item at a time)
    ▼
Filter Keywords (n8n IF node, OR-combined)
    │  contains any of: hiring, intern, fellowship, hackathon,
    │  competition, role, apply, opportunity?
    │
    ├── false → POST /api/log {status: "skipped_filtered"} (then end)
    │
    └── true → Check Exists (HTTP POST /api/ingest/check-exists)
                   │
                   ▼
               If New (n8n IF on $json.exists)
                   │
                   ├── exists=true → POST /api/log {status: "skipped_duplicate"} (end)
                   │
                   └── exists=false → Wait (7s)
                                          ↓
                                     AI Extract (POST /api/ai/extract)
                                          ↓
                                     Upsert Opportunity (POST /api/ingest/upsert)
                                          ↓
                                     loop back to Loop Over Items
```

Every path writes to `ingestion_logs`. Query in Supabase:

```sql
select status, count(*) from public.ingestion_logs
where created_at > now() - interval '1 hour'
group by status;
```

## Critical n8n expression rule

After the **Check Exists** node, `$json` becomes `{exists: bool, opportunity_id?: uuid}`
— the original RSS data is gone. To reach the RSS item from any node downstream
of Check Exists, use:

```
{{ $('Loop Over Items').item.json.title }}
{{ $('Loop Over Items').item.json.link }}
{{ $('Loop Over Items').item.json.contentSnippet }}
```

This is the most common gotcha when extending the workflow.

## RSS feed catalog (reliable feeds)

Pick one for the RSS Read node based on the source's content:

| Feed | URL | Notes |
|---|---|---|
| WeWorkRemotely (all) | `https://weworkremotely.com/remote-jobs.rss` | ~50 fresh remote jobs/day, well-formatted, large content (truncate to 4000 chars in expression) |
| WeWorkRemotely (programming) | `https://weworkremotely.com/categories/remote-programming-jobs.rss` | Tech-focused subset |
| Indeed (search query) | `https://in.indeed.com/rss?q=internship&l=India` | Customizable via `q=` and `l=` params |
| Hacker News Jobs | `https://hnrss.org/jobs` | Mostly senior tech roles, third-party feed (occasionally flakes) |
| Hacker News new | `https://hnrss.org/newest` | All new submissions, mostly noise — heavy filter test |

For text-heavy feeds (WeWorkRemotely), cap content in the AI Extract `text` field:

```
{{ ($('Loop Over Items').item.json.title + '\n\n' + ($('Loop Over Items').item.json.contentSnippet || $('Loop Over Items').item.json.content || '')).slice(0, 4000) }}
```

Without `.slice()`, you'll hit the 20K char limit on the extract endpoint.

---

## Part 1 — Setup (one-time, ~5 minutes)

### 1. Make sure everything is running

Three services must be up simultaneously when a workflow fires:

| Service | How | Verify |
|---|---|---|
| **Supabase** | It's always on (managed, free tier) | `supabase.com/dashboard` |
| **Next.js dev server** | `cd app && pnpm dev` → listens on `http://localhost:3000` | Open http://localhost:3000/api/health in browser — should show `{"status":"ok",...}` |
| **n8n** | `docker ps` should show the `n8n` container | Open http://localhost:5678 — your editor UI |

### 2. The Docker networking rule

n8n runs inside a Docker container. From that container, `localhost` means the
container itself, **not** your host machine. To reach the Next.js dev server
(which is on your host), use:

```
http://host.docker.internal:3000
```

Not `http://localhost:3000`.

Use `host.docker.internal` in every HTTP Request node URL that hits our backend.

### 3. Get your INGEST_SHARED_SECRET

Open `app/.env.local`. Find this line:

```
INGEST_SHARED_SECRET=...
```

Copy the value — you'll paste it into every HTTP Request node in n8n as the
`X-Ingest-Secret` header.

> **Security note**: This secret is what lets n8n call our API. If it leaks,
> anyone could write to our opportunities table. Keep it in `.env.local` (gitignored),
> keep your n8n instance local-only, and rotate it if you ever suspect exposure.

### 4. Quick connectivity test (from n8n)

Before building a full workflow, confirm n8n can reach your backend:

1. Open http://localhost:5678 → **Workflows** → **+ Create workflow**.
2. Add a **Manual Trigger** node.
3. Add an **HTTP Request** node:
   - URL: `http://host.docker.internal:3000/api/health`
   - Method: GET
4. Click **Execute workflow**. You should see JSON output:
   ```json
   { "status": "ok", "service": "opportunity-os", "time": "..." }
   ```
5. If you see a timeout or connection error, the networking isn't working.
   Check that `pnpm dev` is running and that `docker ps` shows n8n running.

---

## Part 2 — Build your first workflow (RSS → AI extract → upsert)

We'll build an RSS ingestion workflow end-to-end. ~15 minutes.

### Workflow shape

```
 ┌────────────┐   ┌──────────┐   ┌───────────┐   ┌────────────┐   ┌────────────┐
 │ Schedule   │→ │ RSS Read │→ │ Split In  │→ │ HTTP POST  │→ │ HTTP POST  │
 │ Trigger    │   │          │   │ Batches   │   │ /api/ai/   │   │ /api/     │
 │ (every 6h) │   │          │   │ (1 at a  │   │ extract    │   │ ingest/   │
 │            │   │          │   │  time)    │   │            │   │ upsert    │
 └────────────┘   └──────────┘   └───────────┘   └────────────┘   └────────────┘
```

**Why Split In Batches?** The RSS feed returns many items at once. We want to
call the AI extraction endpoint one-at-a-time so we don't burst-exceed Gemini's
rate limit (and so errors on one item don't nuke the whole batch).

### Step 1 — Create the workflow

1. http://localhost:5678 → **Workflows** → **+ Create workflow**.
2. Name it: `RSS — HN Jobs` (or similar).

### Step 2 — Schedule Trigger

1. Click the **+** on the canvas → search **"Schedule Trigger"** → add it.
2. Parameters:
   - **Trigger Interval**: Hours
   - **Hours Between Triggers**: 6
3. Save.

(Tip: during development you can also click **"Execute Workflow"** to fire it
manually instead of waiting 6 hours.)

### Step 3 — RSS Feed Read

1. Click **+** after Schedule Trigger → search **"RSS Feed"** → pick **"RSS Feed Read"**.
2. Parameters:
   - **URL**: `https://hnrss.org/jobs`
     (Or any RSS feed of career opportunities — Unstop's RSS, a Substack job
     newsletter, a company's careers RSS, etc. HN Jobs works for testing.)
3. Click **Execute node** — you should see a list of items with fields like
   `title`, `link`, `contentSnippet`, `isoDate`.

### Step 4 — Split In Batches

1. **+** after RSS Feed Read → search **"Split In Batches"** → add it.
2. Parameters:
   - **Batch Size**: 1
   - **Options** → **Reset**: leave default
3. Save.

### Step 5 — HTTP Request to `/api/ai/extract`

This is the AI step — turns the RSS item's messy text into structured JSON.

1. **+** after Split In Batches → search **"HTTP Request"** → add it.
2. Parameters:
   - **Method**: POST
   - **URL**: `http://host.docker.internal:3000/api/ai/extract`
   - **Authentication**: None
   - **Send Headers**: ON → **Specify**: Using Fields Below
     - Header: Name = `X-Ingest-Secret`, Value = _(paste your INGEST_SHARED_SECRET)_
   - **Send Body**: ON → **Body Content Type**: JSON → **Specify Body**: **Using Fields Below**
     (Don't pick "Using JSON" — it requires manual JSON escaping. Fields Below
     handles escaping for you, so newlines/quotes/etc. in expressions are safe.)
   - Add three fields:
     - Name `text`, Value: `={{ $json.title + '\n\n' + ($json.contentSnippet || $json.content || '') }}`
     - Name `source_url`, Value: `={{ $json.link }}`
     - Name `hint`, Value: `RSS feed: HN Jobs`
   - **Options** → **Response** → **Response Format**: JSON
3. Rename the node to `AI Extract`.
4. Execute node — you should see `{ "opportunity": {...}, "provider": "gemini" }` (or `"groq"` if Gemini's quota is tapped).

### Step 6 — HTTP Request to `/api/ingest/upsert`

Takes the structured opportunity from step 5 and writes it to Supabase.

1. **+** after AI Extract → **HTTP Request** node.
2. Parameters:
   - **Method**: POST
   - **URL**: `http://host.docker.internal:3000/api/ingest/upsert`
   - **Headers**: same `X-Ingest-Secret` as above
   - **Send Body**: ON → **Body Content Type**: JSON → **Specify Body**: **Using Fields Below**
   - Add three fields:
     - Name `opportunity`, Value: `={{ $json.opportunity }}` ← n8n auto-serializes the object
     - Name `source_url`, Value: `={{ $('AI Extract').item.json.opportunity.apply_url }}`
     - Name `source_name`, Value: `Manual Admin Entry`
     (`Manual Admin Entry` is a pre-existing row in `sources` from migration
     0001. We'll add a proper "HN Jobs RSS" source later.)
3. Rename the node to `Upsert Opportunity`.
4. Execute — should return `{ "id": "...", "ok": true }`.

> **If you used "Using JSON" mode and got `Bad control character in string literal`**: that's because raw `\n\n` in an n8n expression evaluates to literal newline characters — which are not valid inside JSON strings. Switch to "Using Fields Below" or replace `'\n\n'` with a space/em-dash separator.

### Step 7 — Close the batch loop

Split In Batches needs its "loop" output connected back to continue processing.
Drag the **second output** (the blue "done" dot) of Split In Batches to the
Upsert node's completion... actually, by default when Batch Size = 1, n8n auto-loops.
If you see only the first item processed, connect Upsert's output back to
Split In Batches' top input.

### Step 8 — Save and test end-to-end

1. Click **Save** (top right).
2. Click **Execute Workflow** — watch the data flow through each node.
3. Open Supabase **Table Editor** → `opportunities` — new rows from the RSS feed should appear.
4. Refresh http://localhost:3000 — the new opportunities should show up in your feed.

### Step 9 — Activate it

Toggle **Inactive → Active** (top right). Now the Schedule Trigger fires every
6 hours automatically, as long as n8n and your dev server are running.

---

## Part 3 — Export for version control

Once a workflow is working, version it here:

1. In n8n, open the workflow → three-dot menu → **Download**.
2. Save the downloaded JSON file to `n8n-workflows/` in this repo with a
   descriptive name like `01-rss-hn-jobs.json`.
3. Commit it. This lets you restore or share the workflow.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `ECONNREFUSED localhost:3000` in n8n | Using `localhost` instead of `host.docker.internal` |
| `401 Unauthorized` from `/api/ai/extract` | Missing or wrong `X-Ingest-Secret` header |
| `500 INGEST_SHARED_SECRET not set` | Next.js dev server doesn't see the env var — restart `pnpm dev` |
| Gemini 429 → Groq falls over silently | Expected behavior. Check `provider` field in response |
| AI returns `invalid JSON` | Usually fixed by retry; check the prompt in `app/src/lib/ai/prompts.ts` |
| Supabase `duplicate key value violates unique constraint` | Upsert sees a row with the same `source_url` — that's dedup working; re-run returns the same id |

---

## Importing a saved workflow

When you have a workflow JSON in this folder (e.g. `01-rss-hn-jobs.json`):

1. n8n UI → **Workflows** → top-right **+ Create Workflow** → **⋯ menu** → **Import from File**.
2. Pick the JSON file. The graph appears.
3. Open **AI Extract** and **Upsert Opportunity** nodes — replace the placeholder
   `REPLACE_WITH_YOUR_INGEST_SHARED_SECRET` in the **X-Ingest-Secret** header
   with the value from your `app/.env.local`.
4. Save → click **Execute Workflow** to test → toggle **Active** (top right)
   when ready to let the cron fire automatically every 6 hours.

## Workflows

- [x] **`01-rss-hn-jobs`** — Hacker News "Who's hiring" RSS, every 6h
- [x] **`02-rss-weworkremotely`** — WeWorkRemotely all-jobs RSS, every 6h
- [x] **`03-greenhouse-ats`** — Greenhouse JSON Job Board API, 9 companies (Anthropic, Figma, Vercel, Discord, Airbnb, Postman, Cloudflare, Stripe, Webflow), every 12h
- [x] **`04-devpost-hackathons`** — Devpost hackathons via internal JSON API (direct upsert, no AI), every 12h
- [x] **`05-unstop-hackathons`** — Unstop India hackathons via public search API (direct upsert, no AI), every 12h
- [x] **`06-unstop-competitions`** — Unstop case competitions via the same search API; per-item type filter to skip leaked hackathons (direct upsert), every 12h
- [x] **`07-unstop-internships`** — Unstop India internships with structured stipend extraction (direct upsert), every 6h
- [x] **`08-internshala-internships`** — Internshala via their internal `/hiring/search` JSON endpoint, programming category (direct upsert), every 6h
- [x] **`10-rss-reddit-india`** — Aggregates Atom feeds from `r/developersIndia`, `r/cscareerquestionsIndia`, `r/csMajors` with keyword filter and AI extract, every 12h
- [x] **`11-lever-ats`** — Lever JSON Public Postings API, 2 confirmed companies (CRED, Meesho). AI Extract path. Designed to grow — add slugs to the COMPANIES array as you find live ones, every 12h
- [ ] **`09-mlh-events`** — Reserved. MLH does not expose JSON or iCal; an HTML scrape + AI extract path needs a separate session
- [ ] **`12-cleanup-expired`** — daily job that sets `status='expired'` for past-deadline rows (currently folded into the daily-digest cron in app code)

## How to verify a Greenhouse company before adding

Each company's careers page URL embeds the Greenhouse "board token" — that's the slug we need. Verify a slug is alive by hitting:

```
https://boards-api.greenhouse.io/v1/boards/<slug>/jobs
```

A 200 with a `jobs` array means add it. A 404 means the company moved to a different ATS (Lever, Ashby, Workday) and the slug should be dropped. Companies that 404'd as of Phase 9: hasura, atlassian, github, huggingface, plaid, notion, razorpay, openai. Those would need separate Lever/Ashby workflows.

## How to verify a Lever company before adding

Lever exposes a public JSON postings endpoint. Verify a slug by hitting:

```
https://api.lever.co/v0/postings/<slug>?mode=json
```

A 200 returning a non-empty array of job objects means the slug is live; add it to the `COMPANIES` array in `11-lever-ats.json`. A 404 means the company isn't on Lever (or uses a different slug). An empty array `[]` means the slug exists but has no open postings — skip until they reopen, no point ingesting an empty list.

Most US tech companies have moved off Lever to Greenhouse / Ashby / Workday. As of Phase 10.3a these stayed valid: `cred`, `meesho`. These 404'd: razorpay, atomberg, smallcase, urbancompany, urban-company, groww, zomato, swiggy, netflix, ramp, shopify, mercury, cohere, doordash, lattice, spinny, dunzo, box, juspay, glean, replit, scaleai, leadsquared. Several returned 200 but with empty arrays (attentive, lever) — same effect, skip until populated.

## Reddit aggregator notes

Reddit's `.rss` endpoint returns Atom XML. The Code node fetches each subreddit, regex-parses `<entry>` blocks, and emits flat items. Reddit gates by User-Agent, so the helper sets a descriptive UA. If Reddit starts 429-ing the workflow, change to a unique UA like `opportunity-os/1.0 by /u/<your_reddit_username>`.

This is the only post-Phase-9 workflow that still uses AI Extract — community posts are messy free-text and the AI's job is to decide whether each one is a real opportunity (extraction_confidence < 0.5 lets us hide noise on the dashboard).

## Workflow 04/05 — Direct upsert pattern (no AI extract)

Both Devpost and Unstop expose JSON APIs that already include all the
fields we need (title, organization, deadline, prize, description). So
these workflows construct the Opportunity object inline in a Code node
and POST straight to `/api/ingest/upsert`, **skipping AI Extract entirely**.

Why this matters:
- **~zero AI tokens** for hackathon ingestion (vs ~600/extraction)
- **~10x faster** per item (no Wait, no LLM call)
- **Higher fidelity** — no AI mistranscription of dates, prize amounts, etc.
- **`extraction_confidence` set to 0.9–0.95** since data is direct-from-source

The pattern is reusable for any source with a structured listing API:
write the field mapping in the Fetch Code node, set `extraction_confidence`
high, point straight at `/api/ingest/upsert`.

To extend either workflow to other Unstop/Devpost categories
(competitions, internships, fellowships), clone the workflow file and
change the `opportunity=` query param + the `category` field in the
Opportunity object construction.

## Workflow 03 — Greenhouse ATS notes

Different shape from the RSS workflows: a single Code node fetches every
company's JSON listing inside the workflow itself (no RSS Read node),
flattens, then runs the same dedup → AI extract → upsert pipeline.

**Add a company** by editing the `COMPANIES` array inside the
`Fetch Greenhouse Jobs` Code node. Find the slug from the company's
careers URL (e.g. `boards.greenhouse.io/<slug>` or
`job-boards.greenhouse.io/<slug>`). Verify it works before adding by
opening `https://boards-api.greenhouse.io/v1/boards/<slug>/jobs` in a
browser — should return JSON with a `jobs` array.

**Why no keyword filter**: every Greenhouse result is already a job
listing, so the keyword IF node from the RSS workflows would always
pass. Skipping it keeps the graph clean.

**Why every 12h** (not 6h): 5 companies × 8 jobs each = up to 40 fresh
extractions per run. Twice-daily keeps Gemini free-tier headroom while
still catching new postings within ~12 hours.

**`source_name`** is per-company (`Greenhouse: Anthropic`, etc.) so the
admin source-health view shows which companies are healthy. The upsert
endpoint auto-creates the source row on first sighting.

## Lessons from building 01

Real things that bit us, recorded so the next workflow doesn't repeat them:

- **n8n is in Docker, your Next.js app is on the host.** Use `http://host.docker.internal:3000` from inside n8n; never `localhost`. From WSL bash, the same hostname works to reach the Windows host.
- **Body field expressions**: in **Expression mode**, type just `{{ ... }}` — no leading `=`. The `=` is n8n's internal marker; if you type it in Expression mode, it leaks into the value as a literal character (e.g. `=https://...`). Or stay in Fixed mode and use `={{ ... }}` (the `=` flips that field to expression).
- **Use "Specify Body: Using Fields Below"**, not "Using JSON". Fields-below auto-escapes strings; JSON mode requires manual escaping which fails on newlines.
- **Free-tier rate limits are real.** Llama 3.1 8B Instant on Groq free tier is **6,000 TPM**. Each AI Extract call uses ~600–1500 tokens. So pace ~5–8 calls per minute. The Wait node (7s) + server-side retry-on-429 (in `lib/ai/fallover.ts`) work together to keep things flowing.
- **Always pair with `Continue On Fail`** + idempotent dedup. RSS feeds repeat the same items; `source_url` UNIQUE constraint upserts in place; cron retries pick up only what's actually new.
- **Split In Batches outputs**: connect the **`loop`** output (bottom) to your processing chain, and connect the LAST node back to Loop Over Items input. Leave **`done`** (top) disconnected unless you specifically want a post-loop action. Wiring `done` to processing causes silent re-firing with empty data.
