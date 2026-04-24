# n8n Workflows

This folder contains version-controlled exports of the ingestion workflows that
populate the `opportunities` table.

Current status: **Phase 2 in progress.** Backend endpoints are live; workflows
are built by hand in the n8n UI and exported here once working.

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
   - **URL**: `https://news.ycombinator.com/jobs.rss`
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
     - Add header: Name = `X-Ingest-Secret`, Value = _(paste your INGEST_SHARED_SECRET)_
     - Add header: Name = `Content-Type`, Value = `application/json`
   - **Send Body**: ON → **Body Content Type**: JSON → **Specify Body**: Using JSON
   - **JSON**:
     ```json
     {
       "text": "={{ $json.title + '\n\n' + ($json.contentSnippet || $json.content || '') }}",
       "source_url": "={{ $json.link }}",
       "hint": "RSS feed: Hacker News Jobs"
     }
     ```
   - **Options** → **Response** → **Response Format**: JSON
3. Rename the node to `AI Extract`.
4. Execute node — you should see `{ "opportunity": {...}, "provider": "gemini" }`.

### Step 6 — HTTP Request to `/api/ingest/upsert`

Takes the structured opportunity from step 5 and writes it to Supabase.

1. **+** after AI Extract → **HTTP Request** node.
2. Parameters:
   - **Method**: POST
   - **URL**: `http://host.docker.internal:3000/api/ingest/upsert`
   - **Headers**: same two as above (`X-Ingest-Secret`, `Content-Type: application/json`)
   - **Send Body**: ON → JSON:
     ```json
     {
       "opportunity": {{ $json.opportunity }},
       "source_url": "={{ $('AI Extract').item.json.opportunity.apply_url }}",
       "source_name": "Manual Admin Entry"
     }
     ```
     (`Manual Admin Entry` is a pre-existing row in `sources` from migration
     0001. We'll add a proper "HN Jobs RSS" source later.)
3. Rename the node to `Upsert Opportunity`.
4. Execute — should return `{ "id": "...", "ok": true }`.

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

## Planned workflows

- [ ] **`01-rss-aggregator`** — polls a list of RSS feeds (career pages, newsletters)
- [ ] **`02-unstop-scraper`** — hits Unstop listing pages, parses HTML
- [ ] **`03-wellfound-scraper`** — startup jobs from Wellfound
- [ ] **`04-cleanup-expired`** — daily job that sets `status='expired'` for past-deadline rows
