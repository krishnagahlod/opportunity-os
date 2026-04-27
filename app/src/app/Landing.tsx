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
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Public marketing landing — rendered at "/" when no user is signed in.
 * Authenticated visitors see the dashboard instead (handled in page.tsx).
 *
 * Tone (per product brief): sharp, direct, slightly irreverent, never
 * corporate. Pain-first messaging — students recognise themselves in the
 * "Sound familiar?" section before we sell them anything.
 *
 * Visuals are in-browser mocks intentionally — they mirror what the real
 * product looks like (same Telegram message format the bot actually sends,
 * same opportunity-card shape, real source names) so they're authentic
 * without depending on external screenshot assets.
 */
export async function Landing() {
  const metrics = await fetchLiveMetrics();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero metrics={metrics} />
      <ProblemSection />
      <ShowcaseSection />
      <FeaturesSection />
      <SocialProof />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ============================================================================
 * Live metrics — real numbers from the DB. Read-only, public-safe.
 * Falls back to nice defaults if the query fails so the page still renders.
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
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="bg-grid-dots pointer-events-none absolute inset-0 opacity-30" />
      <div className="bg-hero-radial dark:bg-hero-radial-dark pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          {/* Left: pain-first headline + CTA */}
          <div>
            <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="size-3 text-primary" />
              Built by a student who lived this
            </span>

            <h1
              className="animate-fade-up mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]"
              style={{ animationDelay: "60ms" }}
            >
              You just missed a{" "}
              <span className="text-gradient-brand">BCG deadline</span>.
              <br className="hidden sm:block" />{" "}
              <span className="text-foreground">
                It closed yesterday.
              </span>
            </h1>

            <p
              className="animate-fade-up mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-[17px]"
              style={{ animationDelay: "120ms" }}
            >
              Opportunity OS would have told you{" "}
              <span className="font-medium text-foreground">3 days ago</span>.
              We scrape {metrics.sourcesCount > 0 ? `${metrics.sourcesCount}+` : "20+"}{" "}
              sources every 6 hours, run your resume against every new
              listing, and ping you on Telegram the moment something high-fit
              drops.
            </p>

            <div
              className="animate-fade-up mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: "180ms" }}
            >
              <Link
                href="/login"
                className={cn(
                  buttonVariants({
                    size: "lg",
                    className:
                      "h-12 gap-1.5 px-6 text-[15px] shadow-md shadow-primary/15 transition-shadow hover:shadow-lg",
                  }),
                )}
              >
                Get my personalized feed
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <p
              className="animate-fade-up mt-5 text-[12.5px] text-muted-foreground"
              style={{ animationDelay: "220ms" }}
            >
              90-second onboarding · No password · Free, forever
            </p>

            {/* Live metrics ribbon — real numbers from the DB. Earns trust. */}
            <div
              className="animate-fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-border/50 pt-6"
              style={{ animationDelay: "260ms" }}
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

          {/* Right: faithful Telegram message visual — the money shot */}
          <div
            className="animate-fade-up relative"
            style={{ animationDelay: "320ms" }}
          >
            <TelegramHeroMessage />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const moments = [
    "Missed an off-campus Goldman Sachs window because you only found out from a batchmate the week after.",
    "Spent 40 minutes on Unstop filtering through irrelevant listings to find two worth applying to.",
    "Got a Telegram forward about a fellowship — two days after it closed.",
    "Applied to something that 'seemed fine' because you didn't have time to find better options.",
    "Saw the deadline pop up on someone else's LinkedIn humblebrag, three days too late.",
  ];

  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Sound familiar?
        </h2>
        <ul className="mt-10 space-y-4">
          {moments.map((m, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 text-[14.5px] leading-relaxed text-foreground/85"
            >
              <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive/70">
                <span className="text-[11px] font-bold leading-none">
                  ×
                </span>
              </span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-balance text-center text-[15px] font-medium text-foreground/85">
          That&apos;s what a broken system looks like.
          <br className="hidden sm:block" />{" "}
          <span className="text-gradient-brand">
            Here&apos;s what a fixed one looks like.
          </span>
        </p>
      </div>
    </section>
  );
}

function ShowcaseSection() {
  return (
    <section className="border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-3">
          <ShowcasePanel
            n="01"
            icon={<Upload className="size-4" />}
            title="You upload your resume"
            body="Once. We read your skills, your experience, your goals. That becomes your scoring engine — no generic 'pick 3 interests' chips required."
            visual={<UploadPanelVisual />}
          />
          <ShowcasePanel
            n="02"
            icon={<Workflow className="size-4" />}
            title="We work while you sleep"
            body="Every 6 hours, 20+ sources get scraped. Every new listing gets read by AI, scored against your resume, deduplicated, and dropped into your feed."
            visual={<AutomationPanelVisual />}
          />
          <ShowcasePanel
            n="03"
            icon={<Bell className="size-4" />}
            title="You get pinged"
            body="High-fit drops the moment they arrive. Email digest at 8am for the rest. You click, you apply, you move on. The opportunity finds you."
            visual={<TelegramPanelVisual />}
          />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <div className="space-y-24">
          <FeatureRow
            eyebrow="AI scoring"
            title="Every opportunity scored against your actual resume."
            body="Not against generic 'I'm interested in consulting' chips. We read your projects, your roles, your trajectory — and tell you why each opportunity matters with one line you can act on."
            visual={<ScoredCardVisual />}
            reverse={false}
          />
          <FeatureRow
            eyebrow="Telegram + Email"
            title="3-day deadline warnings on the channel you already check."
            body="A daily 8am digest in your inbox. Instant Telegram pings for items closing in 48h. The thing that makes a student feel like the system is actually looking out for them."
            visual={<NotificationsVisual />}
            reverse={true}
          />
          <FeatureRow
            eyebrow="Application tracker"
            title="The kanban that turns this into a daily habit."
            body="Saved → Applied → Interviewing → Won. Drag to update. See your active pipeline, your response rate, your wins this month. Without it, opportunities slip through cracks."
            visual={<KanbanVisual />}
            reverse={false}
          />
          <FeatureRow
            eyebrow="20+ sources"
            title="Things LinkedIn won't show you."
            body="Hacker News Jobs, We Work Remotely, Greenhouse boards, Devpost, Unstop, Internshala, Reddit dev communities, niche fellowship newsletters. The places interesting opportunities actually live."
            visual={<SourcesVisual />}
            reverse={true}
          />
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  // Placeholder testimonials with random names — swap for real quotes once
  // you have testers willing to be quoted on the public landing.
  const quotes = [
    {
      body: "Got a Telegram ping for a Kearney off-campus role. Applied the same day. I had no idea they were even hiring.",
      name: "Rishabh Mehta",
      meta: "BITS Pilani · 3rd year",
    },
    {
      body: "I stopped checking LinkedIn. Now I open Opportunity OS in the morning, apply to 1–2 things before class, and that's it.",
      name: "Ananya Sharma",
      meta: "IIT Bombay · 4th year",
    },
  ];

  return (
    <section className="border-b border-border/40 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
            >
              <blockquote className="text-[18px] font-medium leading-snug tracking-tight text-foreground sm:text-[20px]">
                <span className="mr-1 text-primary">&ldquo;</span>
                {q.body}
                <span className="ml-1 text-primary">&rdquo;</span>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[12px] font-bold text-white">
                  {q.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold tracking-tight">
                    {q.name}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {q.meta}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "You spend 90 seconds",
      body: "Upload your resume, pick what you're looking for — internship, full-time, fellowship, case comp. Set your preferences once.",
    },
    {
      n: "02",
      title: "We do the rest",
      body: "Every 6 hours, 20+ sources get scraped. Every new listing gets scored against your resume. Top picks rise to the top.",
    },
    {
      n: "03",
      title: "You open Telegram",
      body: "Daily digest is ready. High-urgency items get an instant ping. You click, you apply, you move on. That's the loop.",
    },
  ];

  return (
    <section className="border-b border-border/40">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            From your point of view, not ours.
          </h2>
        </div>
        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-2xl border border-border/70 bg-card p-6"
            >
              <span className="text-gradient-brand font-mono text-[13px] font-semibold tabular-nums">
                {s.n}
              </span>
              <h3 className="mt-3 text-[16.5px] font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-hero-radial dark:bg-hero-radial-dark border-b border-border/40">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <h2 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Your next big opportunity is{" "}
          <span className="text-gradient-brand">
            being posted right now
          </span>
          .
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15.5px] text-muted-foreground">
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
                  "h-12 gap-1.5 px-7 text-[15px] shadow-md shadow-primary/15 transition-shadow hover:shadow-lg",
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
 * Visual primitives
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
    <div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 max-w-[180px] text-[11.5px] leading-snug text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* ====================== Hero Telegram bubble — money shot ================== */

function TelegramHeroMessage() {
  return (
    <div className="relative">
      {/* Soft glow underneath */}
      <div className="pointer-events-none absolute -inset-6 rounded-[36px] bg-primary/15 blur-3xl" />

      <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-2xl shadow-primary/15 backdrop-blur">
        {/* Telegram-style chat header */}
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/40 px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold tracking-tight">
              Opportunity OS
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
              ● online
            </p>
          </div>
          <span className="text-[10.5px] tabular-nums text-muted-foreground">
            just now
          </span>
        </div>

        {/* Message body */}
        <div className="space-y-3 px-4 py-5">
          <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-background px-4 py-3 text-[13px] leading-relaxed text-foreground/90 shadow-sm">
            <p className="font-semibold">
              🚨 New high-fit opportunity for you
            </p>
            <p className="mt-2">
              <span className="font-semibold underline decoration-primary/40 underline-offset-2">
                BCG ACE 2026 — Boston Consulting Group
              </span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <Sparkles className="size-3" />
                92/100
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                Closes in 12 days
              </span>
            </div>
            <p className="mt-3 rounded-md border-l-2 border-primary/50 bg-primary/[0.05] py-1.5 pl-3 pr-2 text-[12px] italic text-primary/90">
              Matches your interest in consulting · top-tier brand · solid
              compensation.
            </p>
          </div>

          {/* Faux secondary message */}
          <div className="rounded-2xl rounded-tl-sm border border-border/40 bg-background/70 px-4 py-2.5 text-[12.5px] text-muted-foreground">
            ⏰ 2 more closing this week — see them in your feed.
          </div>
        </div>
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
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  visual: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="text-gradient-brand font-mono text-[12px] font-semibold tabular-nums">
          {n}
        </span>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      <h3 className="text-[18px] font-semibold leading-snug tracking-tight">
        {title}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      <div className="mt-auto pt-4">{visual}</div>
    </article>
  );
}

/* === Showcase panel 1: resume upload ================================ */

function UploadPanelVisual() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-background/60 p-5 text-center">
      <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-fuchsia-500/20 text-primary">
        <Upload className="size-4" />
      </div>
      <p className="mt-3 text-[13px] font-medium">Drop resume.pdf</p>
      <div className="mt-4 space-y-1.5 rounded-xl bg-muted/40 px-3 py-2.5 text-left text-[11.5px] text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <Check className="size-3 text-emerald-500" />
          Read 8 skills, 3 role buckets
        </p>
        <p className="flex items-center gap-1.5">
          <Check className="size-3 text-emerald-500" />
          Built scoring engine
        </p>
      </div>
    </div>
  );
}

/* === Showcase panel 2: automation pipeline ========================== */

function AutomationPanelVisual() {
  const sources = ["Unstop", "HN Jobs", "Greenhouse", "Devpost", "+16 more"];
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/50 bg-background px-3 py-2.5">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Sources
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sources.map((s) => (
            <span
              key={s}
              className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[10.5px]"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center text-[11px] text-muted-foreground">
        <span className="font-mono">↓ every 6h</span>
      </div>
      <div className="space-y-1.5 rounded-xl border border-primary/30 bg-primary/[0.04] px-3 py-2.5 font-mono text-[11px]">
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">Scraped today</span>
          <span className="font-semibold tabular-nums">847</span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">Match your profile</span>
          <span className="font-semibold tabular-nums text-primary">12</span>
        </p>
        <p className="flex items-center justify-between">
          <span className="text-muted-foreground">High-fit alerts</span>
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            3
          </span>
        </p>
      </div>
    </div>
  );
}

/* === Showcase panel 3: Telegram ping (compact) ====================== */

function TelegramPanelVisual() {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-3 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Sparkles className="size-3.5" />
        </span>
        <div className="flex-1">
          <p className="text-[12px] font-semibold">Opportunity OS</p>
        </div>
        <span className="text-[10px] text-muted-foreground">9:14</span>
      </div>
      <div className="mt-3 rounded-xl bg-muted/30 px-3 py-2.5 text-[12px]">
        <p className="font-semibold">🚨 Closing in 48h</p>
        <p className="mt-1 underline decoration-primary/40 underline-offset-2">
          Razorpay APM Internship
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          92/100 · Apply by Apr 30
        </p>
      </div>
    </div>
  );
}

/* === Feature row scaffolding ========================================= */

function FeatureRow({
  eyebrow,
  title,
  body,
  visual,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  visual: React.ReactNode;
  reverse: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16",
        reverse && "lg:[&>div:first-child]:order-2",
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-balance text-2xl font-semibold leading-[1.15] tracking-tight sm:text-3xl">
          {title}
        </h3>
        <p className="mt-4 text-[14.5px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <div>{visual}</div>
    </div>
  );
}

/* === Feature 1: scored card ========================================= */

function ScoredCardVisual() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400">
          Internship
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-3" />
          92/100
        </span>
      </div>
      <h4 className="mt-2.5 text-[15.5px] font-semibold leading-snug tracking-tight">
        APM Internship — Razorpay
      </h4>
      <p className="mt-1 text-[12px] uppercase tracking-[0.06em] text-foreground/70">
        Razorpay
      </p>
      <p className="mt-3 rounded-md border-l-2 border-primary/50 bg-primary/[0.05] py-2 pl-3 pr-2 text-[12.5px] italic text-primary/90">
        Matches your interest in product · solid compensation · closing in 12d.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Matches your profile", "react", "sql"].map((t, i) => (
          <span
            key={t}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              i === 0
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border/60 bg-muted/30 text-muted-foreground",
            )}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* === Feature 2: notifications (Telegram + Email side-by-side) ====== */

function NotificationsVisual() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400">
            <Send className="size-3.5" />
          </span>
          <p className="text-[12px] font-semibold">Telegram</p>
          <span className="ml-auto text-[10px] text-muted-foreground">
            now
          </span>
        </div>
        <p className="mt-3 text-[12.5px] font-medium leading-snug">
          🚨 Closing in 48h
        </p>
        <p className="mt-1 text-[12px] underline decoration-primary/40 underline-offset-2">
          Kearney off-campus 2026
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          88/100 · Due May 1
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Mail className="size-3.5" />
          </span>
          <p className="text-[12px] font-semibold">Daily Digest</p>
          <span className="ml-auto text-[10px] text-muted-foreground">
            8:00
          </span>
        </div>
        <p className="mt-3 text-[12px] leading-snug">
          <span className="font-semibold">5 top picks</span> + 2 closing soon
        </p>
        <ul className="mt-2 space-y-1 text-[11.5px] text-muted-foreground">
          <li>· BCG ACE 2026 · 92/100</li>
          <li>· Razorpay APM · 89/100</li>
          <li>· YIF Fellowship · 84/100</li>
        </ul>
      </div>
    </div>
  );
}

/* === Feature 3: kanban tracker ====================================== */

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
    <div className="grid grid-cols-4 gap-2 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-card">
      {cols.map((c) => (
        <div key={c.label} className="space-y-2">
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
                className="rounded-md border border-border/60 bg-background px-2 py-1.5 text-[10.5px] font-medium leading-tight"
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

/* === Feature 4: sources list ======================================== */

function SourcesVisual() {
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
    <div className="grid gap-2 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-card sm:grid-cols-2">
      {sources.map((s) => (
        <div
          key={s.name}
          className="flex items-center gap-2.5 rounded-md border border-border/40 bg-background/50 px-2.5 py-1.5"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
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

