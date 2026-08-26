import Link from "next/link";
import { Zap, ShieldCheck, ArrowUpRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white text-zinc-900 font-sans">
      {/* Main Footer Links */}
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12">
          {/* Brand Column (2 cols wide on desktop) */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-sm text-zinc-900 tracking-tight">
              <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white font-mono text-xs shadow-2xs">
                <Zap className="size-4 fill-current" />
              </span>
              <span className="text-base font-extrabold">Opportunity OS</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              The high-velocity career intelligence platform. We index 50+ tech networks, score listings against your resume, and reveal direct hiring manager contact details.
            </p>

            {/* Live Uptime Status Indicator */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[11px] font-mono font-semibold text-emerald-800 shadow-2xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All 50+ Ingestion Engines Operational</span>
            </div>

            <div className="pt-2 text-[11px] font-mono text-zinc-400">
              Payments secured via Dodo Payments · 100% UPI & Cards
            </div>
          </div>

          {/* Col 1: Product Capabilities */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Platform
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <Link href="#feed-preview" className="hover:text-zinc-900 transition-colors">
                  Live Opportunity Feed
                </Link>
              </li>
              <li>
                <Link href="#workflow" className="hover:text-zinc-900 transition-colors">
                  0–100 Resume Scoring
                </Link>
              </li>
              <li>
                <Link href="#superpowers" className="hover:text-zinc-900 transition-colors">
                  Verified Recruiter Radar
                </Link>
              </li>
              <li>
                <Link href="#superpowers" className="hover:text-zinc-900 transition-colors">
                  AI Cold Email Composer
                </Link>
              </li>
              <li>
                <Link href="#alerts" className="hover:text-zinc-900 transition-colors">
                  48h Emergency Telegram Alerts
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
                  Transparent Career Passes
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Integrations & Ingestion */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Ingestion Sources
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <span className="text-zinc-700">Greenhouse API</span>
              </li>
              <li>
                <span className="text-zinc-700">Lever ATS Careers</span>
              </li>
              <li>
                <span className="text-zinc-700">Ashby HQ Systems</span>
              </li>
              <li>
                <span className="text-zinc-700">Y Combinator Jobs</span>
              </li>
              <li>
                <span className="text-zinc-700">Hacker News Who&apos;s Hiring</span>
              </li>
              <li>
                <span className="text-zinc-700">Devpost & MLH Leagues</span>
              </li>
              <li>
                <span className="text-zinc-700">Unstop & Case Comps</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Academic & Legal */}
          <div className="space-y-3 text-xs">
            <p className="font-mono font-bold uppercase tracking-wider text-zinc-900 text-[11px]">
              Campus & Legal
            </p>
            <ul className="space-y-2 text-zinc-500 font-medium">
              <li>
                <Link href="#campus" className="text-blue-600 font-bold hover:underline">
                  @iitb.ac.in Student Tier
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-zinc-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
                  Refund & Cancellation
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-zinc-900 transition-colors">
                  Candidate Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer Bar */}
      <div className="border-t border-zinc-200/80 bg-zinc-50/70 py-6 text-xs text-zinc-500 font-mono">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-4 px-4">
          <p>© {new Date().getFullYear()} Opportunity OS · Built for maximum placement velocity.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="rounded bg-zinc-200/80 px-2 py-0.5 font-bold text-zinc-700">
              v2.6.4 (Production)
            </span>
            <span>Zero Spam · Verified Listings Only</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
