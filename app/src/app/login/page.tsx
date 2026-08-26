import { redirect } from "next/navigation";
import { Zap, Radar, Target, Bell, ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    message?: string;
    error?: string;
    code?: string;
  }>;
}) {
  const params = await searchParams;

  if (params.code) {
    const next = params.next ?? "/";
    redirect(`/auth/callback?code=${params.code}&next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-zinc-900 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Navbar Header */}
      <header className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900 tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs shadow-2xs">
              <Zap className="size-4 fill-current" />
            </span>
            <span>Opportunity OS</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Authentication Split Screen */}
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
        {/* Left Column: Value Proposition & Telemetry */}
        <div className="order-2 md:order-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-mono font-semibold text-zinc-800 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>1,248 Active Openings Scored Today</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.1]">
            Never miss the opportunities that shape your career.
          </h1>

          <p className="text-base text-zinc-600 leading-relaxed max-w-lg">
            One intelligent dashboard for every high-match internship, startup role, case competition, and fellowship — ranked specifically for your resume.
          </p>

          <ul className="space-y-4 pt-2">
            <Feature
              Icon={Radar}
              title="Continuous Ingestion across 50+ Networks"
              body="Greenhouse, Lever, Ashby, YC, Hacker News, and campus portals scraped & deduplicated 24/7."
            />
            <Feature
              Icon={Target}
              title="0–100 Resume Match Intelligence"
              body="Know your exact fit, missing keywords, and recruiter advantages before submitting."
            />
            <Feature
              Icon={Bell}
              title="Emergency 48-Hour Closing Alerts"
              body="Daily 8:00 AM curated digest + instant Telegram alerts so you never miss an off-campus deadline."
            />
          </ul>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 pt-2 border-t border-zinc-200/60">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <ShieldCheck className="size-3.5" /> 100% Verified Authenticity
            </span>
            <span>·</span>
            <span>Free @iitb.ac.in Student Tier</span>
          </div>
        </div>

        {/* Right Column: Clean Authentication Box */}
        <div className="order-1 md:order-2">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-8 shadow-xl">
              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
                  Sign in to your feed
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Continue with Google or get a passwordless magic link to your email.
                </p>
              </div>

              <LoginForm next={params.next} />

              {params.message && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 font-medium">
                  {params.message}
                </div>
              )}
              {params.error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-800 font-medium">
                  {params.error}
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-[11px] text-zinc-400 font-mono">
              Secure authentication powered by Supabase. No spam ever.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-[11px] text-zinc-400 font-mono">
        <p>© {new Date().getFullYear()} Opportunity OS · Built for placement velocity.</p>
      </footer>
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
    <li className="flex items-start gap-3 text-left">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 border border-zinc-200/80 text-zinc-800 shadow-2xs">
        <Icon className="size-4 text-blue-600" />
      </span>
      <div>
        <p className="text-xs sm:text-sm font-bold text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{body}</p>
      </div>
    </li>
  );
}
