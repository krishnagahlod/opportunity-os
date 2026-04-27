import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  Folder,
  Mail,
  Send,
  Sparkles,
  Upload,
  Workflow,
  X,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public marketing landing — rendered at "/" when no user is signed in.
 *
 * Tone (from product brief): sharp, direct, slightly irreverent, never
 * corporate. Pain-first messaging — students see themselves before they
 * see the product. Visuals are in-browser mocks that mirror real product
 * surfaces, layered for depth (browser-window dashboard + Telegram bubble
 * + email card stacked behind each other).
 *
 * Layout inspired by 21st.dev patterns:
 *   - Hero with stacked rotated windows behind main preview (Vaib pattern)
 *   - Bento grid feature section (PerkAI / BentoGridShowcase)
 *   - Big pull-quote with thin accent bar (Tailark testimonial)
 */
export async function Landing() {
  const metrics = await fetchLiveMetrics();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero metrics={metrics} />
      <PainStrip />
      <ShowcaseSection />
      <FeaturesBento />
      <PullQuote />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ============================================================================
 * Live metrics — real numbers from the DB. Read-only, public-safe.
 * ========================================================================== */

type LiveMetrics = {
  liveCount: number;
  newThisWeek: number;
  sourcesCount: number;
};

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  try {
    const supabase = createAdminClient();
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [activeRes, recentRes, sourcesRes] = await Promise.all([
      supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("date_added", weekAgo),
      supabase
        .from("sources")
        .select("*", { count: "exact", head: true })
        .eq("enabled", true),
    ]);

    return {
      liveCount: activeRes.count ?? 0,
      newThisWeek: recentRes.count ?? 0,
      sourcesCount: sourcesRes.count ?? 0,
    };
  } catch {
    return { liveCount: 0, newThisWeek: 0, sourcesCount: 0 };
  }
}

/* ============================================================================
 * Sections
 * ========================================================================== */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Brand />
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "sm", className: "gap-1 px-4" }),
          )}
        >
          Get my feed
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero({ metrics }: { metrics: LiveMetrics }) {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid-dots pointer-events-none absolute inset-0 opacity-25" />
      <div className="bg-hero-radial dark:bg-hero-radial-dark pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:pt-20 sm:pb-16 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3 text-primary" />
            Built by a student who lived this
          </span>

          <h1
            className="animate-fade-up mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[68px]"
            style={{ animationDelay: "60ms" }}
          >
            The right opportunity,
            <br className="hidden sm:block" />{" "}
            <span className="text-gradient-brand">before it closes</span>.
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            We watch{" "}
            <span className="font-medium text-foreground">
              {metrics.sourcesCount > 0 ? `${metrics.sourcesCount}+` : "20+"}{" "}
              sources
            </span>{" "}
            every 6 hours, score every new listing against your resume, and ping
            you on Telegram the moment a high-fit one drops.
          </p>

          <div
            className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              href="/login"
              className={cn(
                buttonVariants({
                  size: "lg",
                  className:
                    "h-12 gap-1.5 px-7 text-[15px] shadow-md shadow-primary/15 transition-shadow hover:shadow-lg",
                }),
              )}
            >
              Get my personalized feed
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <p
            className="animate-fade-up mt-4 text-[12.5px] text-muted-foreground"
            style={{ animationDelay: "220ms" }}
          >
            90-second onboarding · No password · Free, forever
          </p>
        </div>

        {/* Layered product preview — money shot. Three rotated windows give depth
            without committing to any single channel as "the" product. */}
        <div
          className="animate-fade-up relative mx-auto mt-14 max-w-4xl px-4 sm:mt-20"
          style={{ animationDelay: "320ms" }}
        >
          <ProductPreviewStack />
        </div>

        {/* Live metrics ribbon — real DB numbers */}
        <div
          className="animate-fade-up mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 border-t border-border/40 pt-8"
          style={{ animationDelay: "380ms" }}
        >
          <Metric
            value={
              metrics.liveCount > 0
                ? metrics.liveCount.toLocaleString()
                : "Live"
            }
            label="opportunities live right now"
          />
          <Metric
            value={
              metrics.newThisWeek > 0
                ? `+${metrics.newThisWeek.toLocaleString()}`
                : "Daily"
            }
            label="added in the last 7 days"
          />
          <Metric
            value={
              metrics.sourcesCount > 0 ? `${metrics.sourcesCount}` : "20+"
            }
            label="sources scraped every 6h"
          />
        </div>
      </div>
    </section>
  );
}

/* "Sound familiar?" reduced to a single tight strip. Recognition without
   ceremony — three (X-icon) crossed-out moments inline beneath the hero. */
function PainStrip() {
  const moments = [
    "40 minutes scrolling Unstop",
    "two-days-late Telegram forwards",
    "missing the off-campus role your batchmate got",
  ];
  return (
    <section className="border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-7">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            No more
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-foreground/85">
            {moments.map((m) => (
              <li key={m} className="inline-flex items-center gap-1.5">
                <X
                  aria-hidden
                  className="size-3.5 shrink-0 text-destructive/70"
                />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            How the loop works
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Three things happen in the background.
            <br className="hidden sm:block" />{" "}
            <span className="text-muted-foreground">
              You don&apos;t have to do any of them.
            </span>
          </h2>
        </div>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <ShowcasePanel
            n="01"
            icon={<Upload className="size-3.5" />}
            title="You upload your resume"
            body="Once. We read your skills, your projects, your trajectory. That becomes your scoring engine — no generic 'pick 3 interests' chips required."
            visual={<UploadVisual />}
            tone="primary"
          />
          <ShowcasePanel
            n="02"
            icon={<Workflow className="size-3.5" />}
            title="We work while you sleep"
            body="Every 6 hours, 20+ sources scraped. Each new listing read by AI, scored against your resume, deduplicated, pushed to your feed."
            visual={<AutomationVisual />}
            tone="emerald"
          />
          <ShowcasePanel
            n="03"
            icon={<Bell className="size-3.5" />}
            title="You get pinged"
            body="High-fit drops the moment they arrive. 8am email digest catches the rest. You click, you apply, you move on. The opportunity finds you."
            visual={<TelegramVisual />}
            tone="fuchsia"
          />
        </div>
      </div>
    </section>
  );
}

function FeaturesBento() {
  return (
    <section className="border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            What you actually get
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for the way ambitious students actually job-hunt.
          </h2>
        </div>

        {/* Bento grid: tall AI scoring (2 rows) + 2 stacked medium cards on the
            right + wide kanban below + wide sources strip at the bottom. */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3 sm:auto-rows-[minmax(220px,auto)]">
          <BentoCard
            className="sm:col-span-2 sm:row-span-2"
            eyebrow="AI scoring"
            title="Every opportunity scored against your actual resume."
            body="Not against generic interest chips. We read your projects and roles, then tell you why each match matters — in one line you can act on."
            visual={<ScoredCardVisual />}
            tone="primary"
          />
          <BentoCard
            eyebrow="Telegram"
            title="Pings 48 hours before the deadline."
            body="The thing that makes a student feel like the system is actually looking out for them."
            visual={<MiniTelegramVisual />}
            tone="sky"
          />
          <BentoCard
            eyebrow="Daily digest"
            title="Top picks in your inbox at 8am."
            body="Email summary so you don't have to open the app to know if it's worth opening today."
            visual={<MiniEmailVisual />}
            tone="amber"
          />
          <BentoCard
            className="sm:col-span-2"
            eyebrow="Application tracker"
            title="Saved → Applied → Interviewing → Won."
            body="Drag to update. See your active pipeline, response rate, wins this month. Without it, opportunities slip through cracks."
            visual={<KanbanVisual />}
            tone="emerald"
          />
          <BentoCard
            className="sm:col-span-3"
            eyebrow="20+ sources"
            title="Things LinkedIn won't show you."
            body="Hacker News Jobs, Greenhouse boards, Devpost, Unstop, Internshala, We Work Remotely, Reddit dev communities, niche fellowship newsletters — wherever interesting opportunities actually live."
            visual={<SourcesStripVisual />}
            tone="fuchsia"
            wide
          />
        </div>
      </div>
    </section>
  );
}

function PullQuote() {
  // Single big pull quote — Tailark pattern. One real-feeling student
  // testimonial beats five small ones. Names are placeholders until real
  // testers are willing to be quoted.
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
        <blockquote className="relative pl-6 sm:pl-10 before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-indigo-500 before:via-violet-500 before:to-fuchsia-500">
          <p className="text-balance text-[22px] font-medium leading-snug tracking-tight sm:text-[28px] lg:text-[32px]">
            &ldquo;Got a Telegram ping for a Kearney off-campus role.{" "}
            <span className="text-gradient-brand">
              Applied the same day
            </span>
            . I had no idea they were even hiring.&rdquo;
          </p>
          <footer className="mt-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[12px] font-bold text-white shadow-sm">
              RM
            </span>
            <div className="border-l border-border/60 pl-4">
              <cite className="text-[13.5px] font-semibold not-italic">
                Rishabh Mehta
              </cite>
              <span className="block text-[11.5px] text-muted-foreground">
                BITS Pilani · 3rd year
              </span>
            </div>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "You spend 90 seconds",
      body: "Drop your resume. Skip the chip-clicking — we read it for you.",
    },
    {
      n: "02",
      title: "We do the rest",
      body: "Every 6 hours, 20+ sources get scored against your profile. Top picks rise.",
    },
    {
      n: "03",
      title: "You open Telegram",
      body: "Daily digest is ready. High-urgency drops ping you instantly. Apply, move on.",
    },
  ];

  return (
    <section className="border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From your point of view, not ours.
          </h2>
        </div>

        {/* Connected timeline — gradient line behind step cards ties them
            visually so they feel like one flow rather than three boxes. */}
        <div className="relative mt-14">
          <div
            aria-hidden
            className="absolute left-4 right-4 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent lg:block"
          />
          <ol className="relative grid gap-5 lg:grid-cols-3 lg:gap-6">
            {steps.map((s) => (
              <li
                key={s.n}
                className="group relative rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-elevated"
              >
                <span className="relative z-10 flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-mono text-[12px] font-bold tabular-nums text-white shadow-md">
                  {s.n}
                </span>
                <h3 className="mt-5 text-[17px] font-semibold leading-snug tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-hero-radial dark:bg-hero-radial-dark relative overflow-hidden border-b border-border/40">
      {/* Decorative orbs for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 size-80 rounded-full bg-primary/15 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-fuchsia-500/15 blur-[140px]"
      />

      <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          Your next big opportunity
          <br className="hidden sm:block" />{" "}
          is{" "}
          <span className="text-gradient-brand">
            being posted right now
          </span>
          .
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15.5px] text-muted-foreground">
          Sign up in 90 seconds. We&apos;ll surface your first high-fit
          opportunities tonight.
        </p>
        <div className="mt-10">
          <Link
            href="/login"
            className={cn(
              buttonVariants({
                size: "lg",
                className:
                  "h-12 gap-1.5 px-8 text-[15px] shadow-md shadow-primary/15 transition-shadow hover:shadow-xl",
              }),
            )}
          >
            Get my feed
            <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-5 text-[12.5px] text-muted-foreground">
          No password. Cancel anytime. Takes less time than scrolling LinkedIn.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-card/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
        <Brand />
        <p className="text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} Opportunity OS · Built for the people
          who actually apply.
        </p>
      </div>
    </footer>
  );
}

/* ============================================================================
 * Visual primitives & visuals
 * ========================================================================== */

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
        <Sparkles className="size-4" />
      </span>
      <span className="text-sm font-semibold tracking-tight">
        Opportunity <span className="text-muted-foreground">OS</span>
      </span>
    </Link>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 max-w-[200px] text-[11.5px] leading-snug text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* ====================== HERO: layered product preview ====================== */

function ProductPreviewStack() {
  return (
    <div className="relative">
      {/* Soft glow behind */}
      <div className="pointer-events-none absolute inset-x-12 -bottom-6 h-24 rounded-full bg-primary/15 blur-3xl" />

      {/* Layer 3: email card peeking out from the back-left */}
      <div
        aria-hidden
        className="absolute -left-2 top-6 hidden w-[360px] -rotate-6 overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-xl sm:block lg:-left-12"
      >
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Mail className="size-3" />
          </span>
          <span className="text-[11px] font-semibold tracking-tight">
            Daily digest · 8:00 AM
          </span>
        </div>
        <div className="space-y-1.5 px-4 py-3 text-[10.5px]">
          <p className="font-semibold">5 top picks for you today</p>
          <p className="text-muted-foreground">
            BCG ACE 2026 · 92/100 · 12d left
          </p>
          <p className="text-muted-foreground">Razorpay APM · 89/100</p>
          <p className="text-muted-foreground">YIF Fellowship · 84/100</p>
        </div>
      </div>

      {/* Layer 2: Telegram bubble peeking out from back-right */}
      <div
        aria-hidden
        className="absolute -right-2 top-2 hidden w-[300px] rotate-6 overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-xl sm:block lg:-right-10"
      >
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-3 py-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <Sparkles className="size-3" />
          </span>
          <span className="text-[11px] font-semibold">Opportunity OS</span>
          <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400">
            ●
          </span>
        </div>
        <div className="px-3 py-3 text-[10.5px]">
          <p className="font-semibold">🚨 Closing in 48h</p>
          <p className="mt-1 truncate underline decoration-primary/40 underline-offset-2">
            Kearney off-campus 2026
          </p>
          <p className="mt-1 text-muted-foreground">88/100 · Apply by May 1</p>
        </div>
      </div>

      {/* Layer 1: hero browser-window dashboard preview (the centerpiece) */}
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-2xl shadow-primary/15 backdrop-blur">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
          <span className="size-2.5 rounded-full bg-rose-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex h-6 w-full max-w-[280px] items-center gap-2 rounded-md border border-border/40 bg-background/60 px-2.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            opportunity-os.app/
            <span className="text-foreground">your feed</span>
          </div>
        </div>

        {/* Feed grid mock — three opportunity cards mirroring real product */}
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <FeedCard
            cat="Internship"
            catTone="text-indigo-600 dark:text-indigo-400"
            dotTone="bg-indigo-500"
            title="APM Internship"
            org="Razorpay"
            score={92}
            urgency="3 days left"
            urgencyTone="text-amber-600 dark:text-amber-300"
          />
          <FeedCard
            cat="Case Comp"
            catTone="text-amber-600 dark:text-amber-400"
            dotTone="bg-amber-500"
            title="BCG ACE 2026"
            org="Boston Consulting Group"
            score={88}
            urgency="12 days left"
          />
          <FeedCard
            cat="Fellowship"
            catTone="text-rose-600 dark:text-rose-400"
            dotTone="bg-rose-500"
            title="Young India Fellowship"
            org="Ashoka University"
            score={76}
            urgency="Rolling"
          />
        </div>
      </div>
    </div>
  );
}

function FeedCard({
  cat,
  catTone,
  dotTone,
  title,
  org,
  score,
  urgency,
  urgencyTone,
}: {
  cat: string;
  catTone: string;
  dotTone: string;
  title: string;
  org: string;
  score: number;
  urgency: string;
  urgencyTone?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", dotTone)}
        />
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[12.5px] font-semibold leading-snug tracking-tight">
            {title}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
            <span className="truncate font-medium uppercase tracking-[0.06em] text-foreground/75">
              {org}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className={cn("inline-flex items-center gap-0.5", urgencyTone)}>
              <Clock className="size-2.5" />
              {urgency}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
        <span className={cn("text-[9.5px] font-bold uppercase tracking-[0.08em]", catTone)}>
          {cat}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-2.5" />
          {score}
        </span>
      </div>
    </div>
  );
}

/* ============= Showcase panel scaffolding ============================ */

function ShowcasePanel({
  n,
  icon,
  title,
  body,
  visual,
  tone,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  visual: React.ReactNode;
  tone: "primary" | "emerald" | "fuchsia";
}) {
  const toneClasses = {
    primary:
      "before:from-primary/30 [--accent:var(--primary)] [--accent-soft:color-mix(in_oklch,var(--primary)_15%,transparent)]",
    emerald:
      "before:from-emerald-500/30 [--accent:theme(colors.emerald.500)] [--accent-soft:color-mix(in_oklch,theme(colors.emerald.500)_15%,transparent)]",
    fuchsia:
      "before:from-fuchsia-500/30 [--accent:theme(colors.fuchsia.500)] [--accent-soft:color-mix(in_oklch,theme(colors.fuchsia.500)_15%,transparent)]",
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-elevated",
        "before:absolute before:-right-12 before:-top-16 before:size-48 before:rounded-full before:bg-gradient-to-br before:to-transparent before:blur-3xl",
        toneClasses[tone],
      )}
    >
      <div className="relative flex items-center gap-3">
        <span className="font-mono text-[11px] font-semibold tabular-nums text-muted-foreground/70">
          {n}
        </span>
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary/15 text-primary",
            tone === "emerald" &&
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
            tone === "fuchsia" &&
              "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
          )}
        >
          {icon}
        </span>
      </div>
      <h3 className="relative mt-5 text-[19px] font-semibold leading-snug tracking-tight">
        {title}
      </h3>
      <p className="relative mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="relative mt-6">{visual}</div>
    </article>
  );
}

function UploadVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl border border-border/40 bg-muted/40"
      />
      <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-background/80 p-5 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-fuchsia-500/20 text-primary">
          <Upload className="size-4" />
        </div>
        <p className="mt-3 font-mono text-[12px]">resume.pdf</p>
        <div className="mt-4 space-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-left text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Check className="size-3 text-emerald-500" />
            Read 12 skills
          </p>
          <p className="flex items-center gap-1.5">
            <Check className="size-3 text-emerald-500" />
            Mapped 4 role buckets
          </p>
          <p className="flex items-center gap-1.5">
            <Check className="size-3 text-emerald-500" />
            Scoring engine ready
          </p>
        </div>
      </div>
    </div>
  );
}

function AutomationVisual() {
  const sources = ["Unstop", "HN Jobs", "Greenhouse", "Devpost", "+16"];
  return (
    <div className="space-y-2.5">
      <div className="rounded-lg border border-border/50 bg-background/80 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Sources scraped
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sources.map((s) => (
            <span
              key={s}
              className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center font-mono text-[11px] text-muted-foreground">
        ↓ every 6h
      </p>
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] p-3 font-mono text-[11px]">
        <Row label="Scraped today" value="847" />
        <Row label="Match your profile" value="12" valueClass="text-primary" />
        <Row
          label="High-fit alerts"
          value="3"
          valueClass="text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}

function TelegramVisual() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/80 p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Sparkles className="size-3.5" />
        </span>
        <p className="text-[11.5px] font-semibold">Opportunity OS</p>
        <span className="ml-auto text-[10px] text-muted-foreground">9:14</span>
      </div>
      <div className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-[12px]">
        <p className="font-semibold">🚨 New high-fit opportunity</p>
        <p className="mt-1 underline decoration-primary/40 underline-offset-2">
          Razorpay APM Internship
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10.5px]">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
            92/100
          </span>
          <span className="text-muted-foreground">· Apply by Apr 30</span>
        </div>
      </div>
    </div>
  );
}

/* ====================== FEATURES bento ====================== */

function BentoCard({
  className,
  eyebrow,
  title,
  body,
  visual,
  tone,
  wide,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  tone: "primary" | "sky" | "amber" | "emerald" | "fuchsia";
  wide?: boolean;
}) {
  const toneText = {
    primary: "text-primary",
    sky: "text-sky-600 dark:text-sky-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    fuchsia: "text-fuchsia-600 dark:text-fuchsia-400",
  };
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-elevated",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em]", toneText[tone])}>
          {eyebrow}
        </p>
        <h3 className="text-balance text-[18px] font-semibold leading-snug tracking-tight sm:text-[20px]">
          {title}
        </h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <div className={cn("mt-6", wide ? "" : "flex-1")}>{visual}</div>
    </article>
  );
}

function ScoredCardVisual() {
  return (
    <div className="relative">
      {/* Stacked decoration cards behind */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-2xl border border-border/40 bg-muted/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 translate-x-1 translate-y-1 rounded-2xl border border-border/50 bg-muted/50"
      />

      {/* Foreground real-shape opportunity card */}
      <div className="relative rounded-2xl border border-border/70 bg-background p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-indigo-500"
          />
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 text-[15.5px] font-semibold leading-snug tracking-tight">
              APM Internship — Razorpay
            </h4>
            <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.06em] text-foreground/75">
                Razorpay
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                <Clock className="size-3" />3 days left
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-3" />
            92/100
          </span>
        </div>
        <p className="mt-4 rounded-lg border-l-2 border-primary/50 bg-primary/[0.05] py-2 pl-3 pr-2 text-[12.5px] italic text-primary/90">
          Matches your interest in product · solid compensation · closing soon.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["react", "sql", "product"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniTelegramVisual() {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
      <div className="flex items-center gap-2 pb-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400">
          <Send className="size-3" />
        </span>
        <span className="text-[11px] font-semibold">Telegram · now</span>
      </div>
      <p className="text-[11.5px] font-medium">🚨 Closing in 48h</p>
      <p className="mt-0.5 text-[11px] underline decoration-primary/40 underline-offset-2">
        Kearney off-campus 2026
      </p>
      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
        88/100 · Due May 1
      </p>
    </div>
  );
}

function MiniEmailVisual() {
  return (
    <div className="rounded-xl border border-border/60 bg-background/80 p-3">
      <div className="flex items-center gap-2 pb-2">
        <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <Mail className="size-3" />
        </span>
        <span className="text-[11px] font-semibold">8:00 AM digest</span>
      </div>
      <p className="text-[11.5px] font-medium">5 top picks for today</p>
      <ul className="mt-1 space-y-0.5 text-[10.5px] text-muted-foreground">
        <li>· BCG ACE · 92/100</li>
        <li>· Razorpay APM · 89/100</li>
        <li>· YIF · 84/100</li>
      </ul>
    </div>
  );
}

function KanbanVisual() {
  const cols: { label: string; tone: string; cards: string[] }[] = [
    { label: "Saved", tone: "text-muted-foreground", cards: ["YIF 2026"] },
    {
      label: "Applied",
      tone: "text-indigo-600 dark:text-indigo-400",
      cards: ["BCG ACE", "Razorpay APM"],
    },
    {
      label: "Interview",
      tone: "text-amber-600 dark:text-amber-400",
      cards: ["Kearney"],
    },
    {
      label: "Won",
      tone: "text-emerald-600 dark:text-emerald-400",
      cards: ["Atomberg"],
    },
  ];
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border/60 bg-background/60 p-3">
      {cols.map((c) => (
        <div key={c.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-1 px-1">
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.06em]",
                c.tone,
              )}
            >
              {c.label}
            </p>
            <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {c.cards.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {c.cards.map((card) => (
              <div
                key={card}
                className="rounded-md border border-border/60 bg-card px-2 py-1.5 text-[10.5px] font-medium leading-tight"
              >
                {card}
              </div>
            ))}
            {c.cards.length === 0 && (
              <div className="h-6 rounded-md border border-dashed border-border/50" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SourcesStripVisual() {
  const sources: { name: string; tag: string }[] = [
    { name: "Unstop", tag: "Hackathons · Comps" },
    { name: "Internshala", tag: "Internships" },
    { name: "Hacker News Jobs", tag: "Tech roles" },
    { name: "We Work Remotely", tag: "Remote" },
    { name: "Greenhouse", tag: "Postman, Cloudflare …" },
    { name: "Devpost", tag: "Hackathons" },
    { name: "r/developersIndia", tag: "Community drops" },
    { name: "MLH events", tag: "Student hacks" },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {sources.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-background/60 px-3 py-2 transition-colors hover:border-border hover:bg-background"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500/15 to-indigo-500/15 text-muted-foreground">
            <Folder className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold leading-tight">
              {s.name}
            </p>
            <p className="truncate text-[10.5px] text-muted-foreground">
              {s.tag}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

