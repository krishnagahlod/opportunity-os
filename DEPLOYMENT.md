# Deployment Guide — Vercel

How to deploy `app/` to Vercel with the cron, auth, and Supabase wiring all working.

---

## Prerequisites

- [x] GitHub repo pushed (`opportunity-os`)
- [x] Vercel account (free Hobby tier is fine)
- [x] Supabase project running
- [x] All API keys in `app/.env.local` (we'll copy them to Vercel)

---

## Step 1 — Create the Vercel project (~3 min)

1. Go to https://vercel.com/new.
2. **Import Git Repository** → select your `opportunity-os` repo.
3. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: click **Edit** and set to `app`
     ⚠️ This is critical — without it, Vercel will look for `package.json` at the repo root and fail.
   - **Build Command**: leave default (`pnpm run build` or `next build`)
   - **Output Directory**: leave default
   - **Install Command**: leave default
4. **Don't deploy yet** — click **Environment Variables** below first.

---

## Step 2 — Add environment variables (~5 min)

Open `app/.env.local` and copy each value. In Vercel's Environment Variables section, add each one:

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `.env.local` | Same as local |
| `SUPABASE_SERVICE_ROLE_KEY` | from `.env.local` | Same as local |
| `GEMINI_API_KEY` | from `.env.local` | Same as local |
| `GROQ_API_KEY` | from `.env.local` | Same as local |
| `RESEND_API_KEY` | from `.env.local` | Same as local |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Same as local |
| `TELEGRAM_BOT_TOKEN` | from `.env.local` | Same as local |
| `TELEGRAM_DEFAULT_CHAT_ID` | from `.env.local` | Same as local |
| `INGEST_SHARED_SECRET` | from `.env.local` | Same as local |
| `CRON_SECRET` | from `.env.local` | Same as local |
| **`NEXT_PUBLIC_APP_URL`** | **`https://YOUR-VERCEL-URL.vercel.app`** | ⚠️ Use the URL Vercel will assign — usually `https://opportunity-os.vercel.app` or `https://opportunity-os-yourusername.vercel.app`. You can update this later; just put your best guess for now. |

For each variable: name, value, then **all three environments** (Production / Preview / Development) checked.

---

## Step 3 — Deploy

Click **Deploy**. Vercel will:
- Install dependencies
- Build the Next.js app
- Deploy to a preview URL
- Run any cron schedule defined in `vercel.json`

Build takes ~2 minutes the first time. Watch the logs for errors.

**If the build fails**, paste the error in chat and I'll debug.

---

## Step 4 — Update env after first deploy (~1 min)

Vercel will assign you a URL like `https://opportunity-os-abc123.vercel.app`.

1. Copy that URL.
2. Go to **Settings → Environment Variables**.
3. Edit `NEXT_PUBLIC_APP_URL` → set to your real URL.
4. **Redeploy** so the change takes effect: **Deployments tab → ⋯ → Redeploy** on the latest one.

---

## Step 5 — Update Supabase auth redirect URLs (~1 min)

Magic links need to know where to send users back to.

1. Supabase dashboard → your project → **Authentication → URL Configuration**.
2. **Site URL**: `https://YOUR-VERCEL-URL.vercel.app`
3. **Redirect URLs** (click *Add URL*): `https://YOUR-VERCEL-URL.vercel.app/auth/callback`
4. **Keep** the existing `http://localhost:3000/auth/callback` entry — that lets you keep dev working too.
5. **Save**.

---

## Step 6 — Verify the deploy (~5 min)

### A. Public site loads
Open `https://YOUR-VERCEL-URL.vercel.app` — you should be redirected to `/login`.

### B. Magic link login works
1. Enter your email → click **Send magic link**.
2. Check inbox → click link.
3. Should land on the dashboard with all your scored opportunities.

### C. Daily digest cron is registered
1. Vercel dashboard → your project → **Settings → Crons**.
2. You should see `/api/cron/daily-digest` listed with schedule `30 2 * * *` (08:00 IST).
3. To test it manually right now, click **Trigger** (or use curl):
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://YOUR-VERCEL-URL.vercel.app/api/cron/daily-digest
   ```
4. Check inbox + Telegram — digest should arrive (with the **production URL** as a clickable link this time, not local).

### D. The Telegram link is finally a real link
The Telegram message will now contain `<a href="https://YOUR-VERCEL-URL.vercel.app">Open dashboard →</a>` — actually clickable from your phone.

---

## What stays local vs what moves to production

| Component | Where it runs | Why |
|---|---|---|
| Web app | **Vercel** | Public access, always-on |
| Daily digest cron | **Vercel** | Scheduled execution |
| Supabase | **Managed** | Already SaaS |
| **n8n ingestion** | **Still local Docker on your laptop** | Cron only fires when your laptop is on. Acceptable for personal use. To move to 24/7, see Phase 6 plan (Oracle Cloud Always-Free VM). |

n8n keeps using `host.docker.internal:3000` to hit your **local** dev server during ingestion. If you later want the production app to receive ingestion writes, point your n8n HTTP nodes at `https://YOUR-VERCEL-URL.vercel.app` instead. Either works — service-role key writes the same Supabase rows from either endpoint.

---

## Troubleshooting

**Build fails with "Cannot find module"**: usually means a dependency is in `devDependencies` but should be in `dependencies`. Paste the error.

**Magic link redirects to localhost in production email**: `NEXT_PUBLIC_APP_URL` env var not set on Vercel, or set wrong. Update it and redeploy.

**Cron returns 401**: `CRON_SECRET` env var on Vercel doesn't match the one you're sending. Make sure both match.

**Cron isn't firing automatically**: Vercel Hobby plan has a **2-cron limit** and cron only fires every 24h on Hobby (which is fine for daily digest). Pro is needed for higher frequencies.

**Telegram message still shows "local — open from your laptop"**: `NEXT_PUBLIC_APP_URL` still set to localhost. Update + redeploy.
