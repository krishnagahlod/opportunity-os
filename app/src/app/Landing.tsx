import Link from "next/link";
import {
  ArrowRight,
  Bell,
  GraduationCap,
  Radar,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Public-facing marketing landing. Rendered at "/" when no user is signed in.
 * Authenticated visitors hitting "/" see the dashboard instead.
 */
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <FeatureGrid />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ============ Sections ============ */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Brand />
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "sm", className: "gap-1" }))}
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-grid-dots pointer-events-none absolute inset-0 opacity-30" />
      <div className="bg-hero-radial dark:bg-hero-radial-dark pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3 text-primary" />
            For ambitious students & early professionals
          </span>
          <h1
            className="animate-fade-up mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "60ms" }}
          >
            The opportunities that{" "}
            <span className="text-gradient-brand">shape your career</span>,
            ranked just for you.
          </h1>
          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            One inbox for every internship, startup role, case competition,
            hackathon, and fellowship you&apos;d actually want — scraped from
            20+ sources, scored by AI, delivered daily.
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
                    "h-11 gap-1.5 px-5 shadow-md shadow-primary/15 transition-shadow hover:shadow-lg",
                }),
              )}
            >
              Get your free feed
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-xs text-muted-foreground">
              No password · 90 sec onboarding
            </span>
          </div>
        </div>

        {/* Mock dashboard preview card */}
        <div
          className="animate-fade-up relative mx-auto mt-16 max-w-3xl"
          style={{ animationDelay: "240ms" }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-border/50 bg-muted/30 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-rose-400/60" />
              <span className="size-2.5 rounded-full bg-amber-400/60" />
              <span className="size-2.5 rounded-full bg-emerald-400/60" />
              <span className="ml-3 text-[11px] font-medium text-muted-foreground">
                opportunity-os.app — your feed
              </span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3">
              <MockCard
                cat="INTERNSHIP"
                catTone="text-indigo-700 dark:text-indigo-300"
                title="APM Internship — Razorpay"
                org="Razorpay"
                why="Matches PM · top-tier brand"
                score={92}
                scoreTone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              />
              <MockCard
                cat="CASE COMP"
                catTone="text-amber-700 dark:text-amber-300"
                title="BCG ACE 2026"
                org="Boston Consulting Group"
                why="Matches consulting · closing in 12d"
                score={88}
                scoreTone="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              />
              <MockCard
                cat="FELLOWSHIP"
                catTone="text-rose-700 dark:text-rose-300"
                title="Young India Fellowship"
                org="Ashoka University"
                why="Top alumni network"
                score={76}
                scoreTone="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
              />
            </div>
          </div>
          {/* Soft glow underneath */}
          <div className="pointer-events-none absolute inset-x-12 -bottom-4 h-12 rounded-full bg-primary/15 blur-3xl" />
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      Icon: Radar,
      title: "Aggregated from 20+ sources",
      body: "Unstop, Wellfound, HN Jobs, WeWorkRemotely, Substack newsletters — automatically scraped, deduplicated, and structured.",
    },
    {
      Icon: Target,
      title: "Ranked for you, not the crowd",
      body: "AI scores every opportunity on profile fit, career value, brand, compensation, and urgency. Your top picks rise to the top.",
    },
    {
      Icon: Bell,
      title: "Deadline alerts that matter",
      body: "Daily email digest plus instant Telegram pings for opportunities closing within 3 days. Never miss a deadline again.",
    },
    {
      Icon: Trophy,
      title: "Application tracker built in",
      body: "Drag-and-drop kanban: Saved → Applied → Interviewing → Won. Every opportunity you bookmarked, all in one place.",
    },
    {
      Icon: GraduationCap,
      title: "Built for the right audience",
      body: "Designed for students at top colleges and ambitious early professionals. Categories tuned to internships, fellowships, and case comps.",
    },
    {
      Icon: Zap,
      title: "Free forever",
      body: "Your personal opportunity OS, on the house. No paywalls, no premium tier — just the tool we wished existed.",
    },
  ];

  return (
    <section className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            Why Opportunity OS
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop tab-hopping. Start applying.
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Built for the way ambitious people actually find opportunities —
            scattered, async, and overwhelming.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-indigo-600 dark:text-indigo-300">
                <f.Icon className="size-4.5" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
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
      title: "Tell us what you care about",
      body: "90-second onboarding: pick your interests, skills, location, and what you're looking for.",
    },
    {
      n: "02",
      title: "AI scores every opportunity for you",
      body: "We pull from 20+ sources every 6 hours. Each one gets a 0–100 personal fit score with a one-line reason.",
    },
    {
      n: "03",
      title: "You apply to what matters",
      body: "Save, mark applied, and track your pipeline. Daily digest catches what slipped past.",
    },
  ];
  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Three steps. One inbox.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="relative rounded-2xl border border-border/70 bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-gradient-brand text-3xl font-bold tracking-tight">
                  {s.n}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden size-4 text-muted-foreground/40 lg:block" />
                )}
              </div>
              <h3 className="mt-4 text-[16px] font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/40 bg-hero-radial dark:bg-hero-radial-dark">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          Ready to never miss another opportunity?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Sign up free in 90 seconds. We&apos;ll surface your first 5 high-fit
          opportunities tonight.
        </p>
        <div className="mt-9">
          <Link
            href="/login"
            className={cn(
              buttonVariants({
                size: "lg",
                className:
                  "h-11 gap-1.5 px-5 shadow-md shadow-primary/15 transition-shadow hover:shadow-lg",
              }),
            )}
          >
            Get started — it&apos;s free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Brand />
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} Opportunity OS · Built for ambitious people.
        </p>
      </div>
    </footer>
  );
}

/* ============ Bits ============ */

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

function MockCard({
  cat,
  catTone,
  title,
  org,
  why,
  score,
  scoreTone,
}: {
  cat: string;
  catTone: string;
  title: string;
  org: string;
  why: string;
  score: number;
  scoreTone: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-[10px] font-semibold uppercase tracking-wider", catTone)}>
          {cat}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ring-1 ring-inset ring-current/10",
            scoreTone,
          )}
        >
          <Sparkles className="size-2.5" />
          {score}
        </span>
      </div>
      <h4 className="mt-1 line-clamp-2 text-[12.5px] font-semibold leading-snug">
        {title}
      </h4>
      <p className="mt-0.5 text-[10.5px] text-muted-foreground">{org}</p>
      <p className="mt-2 rounded-md border-l-2 border-primary/40 bg-primary/[0.05] py-1 pl-2 text-[10px] font-medium text-primary/90">
        {why}
      </p>
    </div>
  );
}
