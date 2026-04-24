# Opportunity OS

Personalized discovery engine that aggregates career opportunities (internships, startup roles, case competitions, hackathons) from scattered sources, ranks them with AI, and surfaces the most relevant ones via a dashboard + daily email/Telegram digest.

Full implementation plan: `../../Users/krish/.claude/plans/i-have-attached-the-unified-salamander.md`

---

## Repo layout

```
opportunity-os/
├── app/                    # Next.js 16 application (frontend + API routes)
├── n8n-workflows/          # Exported n8n workflow JSON (version-controlled)
├── supabase/
│   └── migrations/         # SQL schema migrations
├── emails/                 # React Email templates
├── Idea.md                 # Original product brief
└── README.md               # This file
```

---

## Phase 0 — Setup checklist

### Prerequisites (verify you have these)

- [x] Node.js 20+ (you have v22)
- [x] pnpm 10+ (you have v10.26)
- [x] Git
- [x] Docker Desktop (running)
- [ ] Account: Supabase — https://supabase.com
- [ ] Account: Google AI Studio (Gemini) — https://aistudio.google.com
- [ ] Account: Groq — https://console.groq.com
- [ ] Account: Resend — https://resend.com
- [ ] Account: Vercel — https://vercel.com
- [ ] Telegram bot created via `@BotFather` (token saved)
- [ ] GitHub repo `opportunity-os` created (private)

### 1. Get your API keys

Collect these and paste into `app/.env.local` (copy from `app/.env.local.example`):

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → service_role (reveal). **Server-only, never browser** |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey → Create API key |
| `GROQ_API_KEY` | https://console.groq.com/keys → Create API key |
| `RESEND_API_KEY` | https://resend.com/api-keys → Create |
| `TELEGRAM_BOT_TOKEN` | From `@BotFather` when you ran `/newbot` |

### 2. Create a Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Name: `opportunity-os`. Region: closest to you. Password: save it.
3. Wait ~2 min for provisioning.
4. Copy the three Supabase keys (URL, anon, service_role) into your `.env.local`.

### 3. Start n8n (local Docker)

Already running via:
```bash
docker run -d --name n8n --restart unless-stopped -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_SECURE_COOKIE=false \
  docker.n8n.io/n8nio/n8n
```

Open **http://localhost:5678** → create your n8n owner account (local, never leaves your machine).

**Stop/start anytime:**
```bash
docker stop n8n     # pause
docker start n8n    # resume
docker logs -f n8n  # view logs
```

### 4. Start the Next.js dev server

```bash
cd app
cp .env.local.example .env.local   # then fill values
pnpm dev
```

Opens at **http://localhost:3000**.

---

## Phase progress

- [ ] **Phase 0** — Environment setup (← you are here)
- [ ] **Phase 1** — Foundation (auth, profile, seed feed)
- [ ] **Phase 2** — Ingestion pipeline (n8n workflows)
- [ ] **Phase 3** — AI layer (extract, summarize, score)
- [ ] **Phase 4** — Notifications (email + Telegram)
- [ ] **Phase 5** — Tracker + admin panel
- [ ] **Phase 6** — Multi-user prep

---

## Stack

- **Frontend**: Next.js 16, React 19, Tailwind 4, shadcn/ui
- **Backend**: Supabase (Postgres + Auth + Storage + RLS)
- **Automation**: n8n (local Docker)
- **AI**: Gemini 2.0 Flash (primary) + Groq Llama 3.3 70B (fallback)
- **Email**: Resend + React Email
- **Notifications**: Telegram Bot API
- **Hosting**: Vercel (Hobby)

All components on free tier at personal-use volume.
