import { Sparkles, Radar, Target, Bell } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; message?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative min-h-screen overflow-hidden bg-hero-radial dark:bg-hero-radial-dark">
      <div className="bg-grid-dots pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:items-center md:py-16">
        {/* Left — brand + value prop */}
        <div className="order-2 md:order-1">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Opportunity <span className="text-muted-foreground">OS</span>
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Never miss the <span className="text-gradient-brand">opportunities</span> that shape your career.
          </h1>
          <p className="mt-4 max-w-md text-sm text-muted-foreground sm:text-base">
            One inbox for every internship, startup role, case competition,
            hackathon, and fellowship you&apos;d actually want — ranked by
            what fits your goals.
          </p>
          <ul className="mt-8 space-y-3">
            <Feature
              Icon={Radar}
              title="Aggregated from 20+ sources"
              body="Unstop, Wellfound, career pages, RSS feeds — scraped and deduplicated."
            />
            <Feature
              Icon={Target}
              title="Ranked for you, not the crowd"
              body="AI scores every opportunity on fit, career value, and urgency."
            />
            <Feature
              Icon={Bell}
              title="Deadline alerts that matter"
              body="Daily digest + Telegram pings for opportunities you shouldn't miss."
            />
          </ul>
        </div>

        {/* Right — sign-in card */}
        <div className="order-1 md:order-2">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-[0_30px_80px_-24px_color-mix(in_oklch,var(--primary)_20%,transparent)] backdrop-blur">
              <h2 className="text-lg font-semibold tracking-tight">
                Sign in
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;ll email you a one-click link. No password.
              </p>
              <div className="mt-5">
                <LoginForm next={params.next} />
              </div>
              {params.message && (
                <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                  {params.message}
                </p>
              )}
              {params.error && (
                <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {params.error}
                </p>
              )}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By continuing you agree to keep your opportunity hunt organized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-fuchsia-500/15 text-indigo-600 dark:text-indigo-300">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}
