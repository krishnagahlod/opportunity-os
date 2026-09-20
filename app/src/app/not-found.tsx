import Link from "next/link";
import { ArrowLeft, Compass, Sparkles, Zap, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "404 - Page Not Found | Opportunity OS",
  description: "The opportunity or page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm text-foreground tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background font-mono text-xs">
              <Zap className="size-4 fill-current" />
            </span>
            <span className="text-base font-extrabold">Opportunity OS</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Return to Discovery Feed
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-inner">
          <Compass className="size-8 animate-pulse" />
        </div>

        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-primary">
          HTTP 404 · Uncharted Territory
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Opportunity Not Found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
          The listing, route, or resource you are looking for has either expired, moved to another URL, or doesn&apos;t exist.
        </p>

        <div className="mt-8 grid w-full grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition hover:border-border hover:bg-muted/40 shadow-2xs group"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                Live Opportunity Feed
              </p>
              <p className="text-[11px] text-muted-foreground">Browse 50+ tech networks</p>
            </div>
          </Link>

          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-3.5 transition hover:border-border hover:bg-muted/40 shadow-2xs group"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                Career Passes
              </p>
              <p className="text-[11px] text-muted-foreground">Upgrade to Pro matching</p>
            </div>
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-2xs"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground font-mono">
        <p>© {new Date().getFullYear()} Opportunity OS · Built for placement velocity.</p>
      </footer>
    </div>
  );
}
